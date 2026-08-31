-- Community Intelligence — Lot 5 (anticipé) — schéma Contenu et Écosystème
-- PRD v1.0 §6.8 (contenu), §6.9 (écosystème).
--
-- Ces tables sont créées maintenant, en avance du Lot 5, parce que l'Addendum
-- v1.1 (§13) les référence par clé étrangère : `content_attribution` pointe
-- sur `content(id)`, `acquisition_spikes.linked_content_id` aussi, et
-- plusieurs croisements (`territory_retention`, `format_retention`,
-- `ecosystem_retention`) agrègent `content_classification` / `ecosystem_profiles`.
-- Seul le schéma est posé ici : aucun parseur d'ingestion pour
-- posts.json / profiles_reached.json / content_interactions.json /
-- your_chat_information.json n'est branché (ça reste le travail du Lot 5).
-- Tant qu'aucune ligne n'existe dans `content`, les croisements qui en
-- dépendent produisent simplement zéro ligne — ce qui est le comportement
-- correct, pas un bug.

create table public.content (
  id              uuid primary key default gen_random_uuid(),
  account_id      uuid not null references public.instagram_accounts(id) on delete cascade,
  media_key       text not null,
  permalink       text,
  media_type      text not null check (media_type in ('post','reel','story','live','carousel')),
  published_at    timestamptz not null,
  caption         text,
  thumb_path      text,
  first_import_id uuid not null references public.imports(id),
  unique (account_id, media_key)
);

create table public.content_metrics (
  content_id     uuid not null references public.content(id) on delete cascade,
  import_id      uuid not null references public.imports(id) on delete cascade,
  account_id     uuid not null references public.instagram_accounts(id) on delete cascade,
  reach          bigint,
  impressions    bigint,
  likes          int,
  comments       int,
  shares         int,
  saves          int,
  profile_visits int,
  follows_gained int,
  external_taps  int,
  follow_conversion_rate numeric(8,6),
  engagement_rate        numeric(8,6),
  primary key (content_id, import_id)
);

create table public.content_classification (
  content_id    uuid primary key references public.content(id) on delete cascade,
  account_id    uuid not null references public.instagram_accounts(id) on delete cascade,
  territory     text,
  tags          text[],
  has_person    boolean,
  setting       text,
  model         text not null,
  model_version text not null,
  confidence    numeric(4,3),
  classified_at timestamptz not null default now()
);

create table public.ecosystem_profiles (
  account_id        uuid   not null references public.instagram_accounts(id) on delete cascade,
  profile_id        bigint not null,
  is_creator        boolean not null default false,
  is_brand          boolean not null default false,
  is_verified       boolean not null default false,
  is_follower       boolean not null default false,
  is_mutual         boolean not null default false,
  audience_bucket   int,
  follow_started_at timestamptz,
  has_replied       boolean,
  last_import_id    uuid not null references public.imports(id),
  primary key (account_id, profile_id)
);

create table public.ecosystem_summary (
  import_id            uuid primary key references public.imports(id) on delete cascade,
  account_id           uuid not null references public.instagram_accounts(id) on delete cascade,
  conversations_total  int not null,
  professional_count   int not null,
  private_count        int not null,
  unanswered_pro_count int not null
);

create index on public.content (account_id, published_at);
create index on public.content_metrics (account_id);
create index on public.content_classification (account_id, territory);
create index on public.ecosystem_profiles (account_id, is_follower);
create index on public.ecosystem_summary (account_id);

alter table public.content enable row level security;
alter table public.content_metrics enable row level security;
alter table public.content_classification enable row level security;
alter table public.ecosystem_profiles enable row level security;
alter table public.ecosystem_summary enable row level security;

create policy "content_read" on public.content
  for select using (account_id in (select public.user_account_ids()));
create policy "content_metrics_read" on public.content_metrics
  for select using (account_id in (select public.user_account_ids()));
create policy "content_classification_read" on public.content_classification
  for select using (account_id in (select public.user_account_ids()));
create policy "ecosystem_profiles_read" on public.ecosystem_profiles
  for select using (account_id in (select public.user_account_ids()));
create policy "ecosystem_summary_read" on public.ecosystem_summary
  for select using (account_id in (select public.user_account_ids()));
