-- Community Intelligence — Lot 3 — Schéma du moteur de recalcul
-- PRD §6.5 (états dérivés), §6.6 (cohortes).
--
-- DÉVIATION DÉLIBÉRÉE DU SCHÉMA LITTÉRAL DU PRD : follower_states a pour
-- clé primaire (account_id, profile_id, episode) et non (account_id,
-- profile_id) comme écrit au §6.5. Sur les données réelles Eden Park, des
-- profils partent puis reviennent avec un followed_at postérieur (2 cas
-- observés sur 5 810 profils communs aux deux exports). Une clé sans
-- `episode` ferait qu'un retour écrase (upsert) la ligne qui portait le
-- départ précédent, et l'historique du départ serait perdu. `episode`
-- s'incrémente à chaque fois que le followed_at d'un profil change (signe
-- d'un désabonnement suivi d'un réabonnement) : chaque épisode de suivi
-- continu porte sa propre ligne, avec son propre statut et sa propre
-- fenêtre de départ éventuelle.

create type public.follower_status as enum
  ('present','gone','out_of_window','likely_rename');

create table public.follower_states (
  account_id              uuid   not null references public.instagram_accounts(id) on delete cascade,
  profile_id              bigint not null,
  episode                 int    not null default 1,
  followed_at             timestamptz not null,
  cohort_week             date   not null,
  first_import_id         uuid   not null references public.imports(id),
  last_present_import_id  uuid   not null references public.imports(id),
  status                  public.follower_status not null,
  departure_window_start  timestamptz,
  departure_window_end    timestamptz,
  tenure_days             int,
  rename_candidate_of     bigint,
  sig_digit_suffix        boolean not null default false,
  sig_many_underscores    boolean not null default false,
  sig_long_handle         boolean not null default false,
  computed_at             timestamptz not null default now(),
  primary key (account_id, profile_id, episode)
);

create index on public.follower_states (account_id, cohort_week);
create index on public.follower_states (account_id, status);

create table public.following_states (
  account_id             uuid   not null references public.instagram_accounts(id) on delete cascade,
  profile_id             bigint not null,
  followed_at            timestamptz,
  status                 text not null,
  removed_between_start  timestamptz,
  removed_between_end    timestamptz,
  is_mutual              boolean not null default false,
  primary key (account_id, profile_id)
);

create table public.cohorts (
  account_id       uuid not null references public.instagram_accounts(id) on delete cascade,
  cohort_week      date not null,
  size             int  not null,
  origin_import_id uuid not null references public.imports(id),
  is_spike_period  boolean not null default false,
  primary key (account_id, cohort_week)
);

create table public.cohort_survival (
  account_id          uuid not null references public.instagram_accounts(id) on delete cascade,
  cohort_week         date not null,
  measured_import_id  uuid not null references public.imports(id),
  measured_at         timestamptz not null,
  remaining           int  not null,
  departed            int  not null,
  survival_rate       numeric(6,4) not null,
  exposure_days       int  not null,
  primary key (account_id, cohort_week, measured_import_id)
);

alter table public.follower_states enable row level security;
alter table public.following_states enable row level security;
alter table public.cohorts enable row level security;
alter table public.cohort_survival enable row level security;

-- Lecture seule pour le client : ces tables ne sont écrites que par
-- recompute_account() (service_role), jamais directement.
create policy "follower_states_read" on public.follower_states
  for select using (account_id in (select public.user_account_ids()));
create policy "following_states_read" on public.following_states
  for select using (account_id in (select public.user_account_ids()));
create policy "cohorts_read" on public.cohorts
  for select using (account_id in (select public.user_account_ids()));
create policy "cohort_survival_read" on public.cohort_survival
  for select using (account_id in (select public.user_account_ids()));
