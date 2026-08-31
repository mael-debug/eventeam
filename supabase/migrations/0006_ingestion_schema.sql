-- Community Intelligence — Lot 2 — Schéma d'ingestion
-- PRD §6.4 (imports), §6.5 (observations, sans les états dérivés — Lot 3),
-- §6.7 (insights agrégés).

-- ---------------------------------------------------------------------------
-- §6.4 — Imports
-- ---------------------------------------------------------------------------

create type public.import_status as enum
  ('uploading','uploaded','parsing','computing','completed','failed');

create table public.imports (
  id                uuid primary key default gen_random_uuid(),
  account_id        uuid not null references public.instagram_accounts(id) on delete cascade,
  uploaded_by       uuid references auth.users(id),
  status            public.import_status not null default 'uploading',
  exported_at       timestamptz,
  window_start      timestamptz,
  window_end        timestamptz,
  files_expected    int,
  files_parsed      int not null default 0,
  parser_version    text not null,
  storage_prefix    text not null,
  error_message     text,
  started_at        timestamptz,
  completed_at      timestamptz,
  created_at        timestamptz not null default now()
);

create index on public.imports (account_id, exported_at desc);

create table public.import_files (
  id            uuid primary key default gen_random_uuid(),
  import_id     uuid not null references public.imports(id) on delete cascade,
  source_path   text not null,
  category      text not null,
  storage_path  text,
  bytes         bigint,
  sha256        text,
  rows_ingested int,
  status        text not null default 'pending',
  error_message text,
  unique (import_id, source_path)
);

-- Seul le rôle authenticated (agence) crée/fait progresser un import côté
-- client ; l'Edge Function (service_role) prend le relais dès 'uploaded' et
-- contourne RLS. On restreint donc les transitions permises depuis le client
-- pour éviter qu'un import soit marqué 'completed' sans être passé par le
-- pipeline serveur.
create or replace function public.enforce_import_status_transition()
returns trigger language plpgsql as $$
begin
  if current_setting('role', true) = 'authenticated' then
    if old.status is distinct from 'uploading' or new.status is distinct from 'uploaded' then
      raise exception 'Transition de statut non autorisée depuis le client (% -> %)', old.status, new.status;
    end if;
  end if;
  return new;
end $$;

create trigger imports_status_transition
  before update of status on public.imports
  for each row execute function public.enforce_import_status_transition();

alter table public.imports enable row level security;
alter table public.import_files enable row level security;

create policy "imports_read" on public.imports
  for select using (account_id in (select public.user_account_ids()));

create policy "imports_insert" on public.imports
  for insert with check (public.can_write_account(account_id));

create policy "imports_update" on public.imports
  for update using (public.can_write_account(account_id))
  with check (public.can_write_account(account_id));

create policy "import_files_read" on public.import_files
  for select using (
    exists (select 1 from public.imports i where i.id = import_id and i.account_id in (select public.user_account_ids()))
  );

-- ---------------------------------------------------------------------------
-- §6.5 — Abonnés : observations (faits bruts, immuables)
-- ---------------------------------------------------------------------------

create table public.follower_observations (
  import_id    uuid   not null references public.imports(id) on delete cascade,
  account_id   uuid   not null references public.instagram_accounts(id) on delete cascade,
  profile_id   bigint not null,
  followed_at  timestamptz not null,
  primary key (import_id, profile_id)
);

create index on public.follower_observations (account_id, profile_id);
create index on public.follower_observations (account_id, followed_at);

create table public.following_observations (
  import_id   uuid   not null references public.imports(id) on delete cascade,
  account_id  uuid   not null references public.instagram_accounts(id) on delete cascade,
  profile_id  bigint not null,
  followed_at timestamptz,
  primary key (import_id, profile_id)
);

create index on public.following_observations (account_id, profile_id);

alter table public.follower_observations enable row level security;
alter table public.following_observations enable row level security;

-- Faits bruts : uniquement écrits par l'Edge Function (service_role, hors
-- RLS). Le client authentifié n'a qu'un accès en lecture.
create policy "follower_observations_read" on public.follower_observations
  for select using (account_id in (select public.user_account_ids()));

create policy "following_observations_read" on public.following_observations
  for select using (account_id in (select public.user_account_ids()));

-- ---------------------------------------------------------------------------
-- §6.7 — Insights agrégés
-- ---------------------------------------------------------------------------

create table public.audience_insights (
  import_id       uuid primary key references public.imports(id) on delete cascade,
  account_id      uuid not null references public.instagram_accounts(id) on delete cascade,
  period_start    date not null,
  period_end      date not null,
  followers_total int,
  followers_gained int,
  followers_lost  int,
  followers_net   int,
  growth_pct      numeric(6,2),
  male_pct        numeric(5,2),
  female_pct      numeric(5,2)
);

create table public.audience_geo (
  import_id  uuid not null references public.imports(id) on delete cascade,
  account_id uuid not null references public.instagram_accounts(id) on delete cascade,
  kind       text not null check (kind in ('country','city')),
  name       text not null,
  pct        numeric(5,2) not null,
  primary key (import_id, kind, name)
);

create table public.audience_age (
  import_id  uuid not null references public.imports(id) on delete cascade,
  account_id uuid not null references public.instagram_accounts(id) on delete cascade,
  gender     text not null check (gender in ('all','male','female')),
  age_bucket text not null,
  pct        numeric(5,2) not null,
  primary key (import_id, gender, age_bucket)
);

create table public.audience_activity (
  import_id    uuid not null references public.imports(id) on delete cascade,
  account_id   uuid not null references public.instagram_accounts(id) on delete cascade,
  weekday      int  not null check (weekday between 1 and 7),
  active_count int  not null,
  primary key (import_id, weekday)
);

create table public.reach_insights (
  import_id         uuid primary key references public.imports(id) on delete cascade,
  account_id        uuid not null references public.instagram_accounts(id) on delete cascade,
  period_start      date not null,
  period_end        date not null,
  accounts_reached  bigint,
  reach_delta_pct   numeric(6,2),
  impressions       bigint,
  impressions_delta_pct numeric(6,2),
  follower_reach_pct    numeric(5,2),
  non_follower_reach_pct numeric(5,2),
  profile_visits    bigint,
  profile_visits_delta_pct numeric(6,2),
  external_taps     bigint,
  external_taps_delta_pct  numeric(6,2)
);

create table public.interaction_insights (
  import_id    uuid not null references public.imports(id) on delete cascade,
  account_id   uuid not null references public.instagram_accounts(id) on delete cascade,
  format       text not null check (format in ('all','posts','stories','reels','lives')),
  interactions int,
  delta_pct    numeric(6,2),
  likes        int,
  comments     int,
  shares       int,
  saves        int,
  replies      int,
  primary key (import_id, format)
);

create index on public.audience_insights (account_id);
create index on public.audience_geo (account_id);
create index on public.audience_age (account_id);
create index on public.audience_activity (account_id);
create index on public.reach_insights (account_id);
create index on public.interaction_insights (account_id);
create index on public.import_files (import_id);

alter table public.audience_insights enable row level security;
alter table public.audience_geo enable row level security;
alter table public.audience_age enable row level security;
alter table public.audience_activity enable row level security;
alter table public.reach_insights enable row level security;
alter table public.interaction_insights enable row level security;

create policy "audience_insights_read" on public.audience_insights
  for select using (account_id in (select public.user_account_ids()));
create policy "audience_geo_read" on public.audience_geo
  for select using (account_id in (select public.user_account_ids()));
create policy "audience_age_read" on public.audience_age
  for select using (account_id in (select public.user_account_ids()));
create policy "audience_activity_read" on public.audience_activity
  for select using (account_id in (select public.user_account_ids()));
create policy "reach_insights_read" on public.reach_insights
  for select using (account_id in (select public.user_account_ids()));
create policy "interaction_insights_read" on public.interaction_insights
  for select using (account_id in (select public.user_account_ids()));
