-- Community Intelligence — Addendum v1.1 §1, §2, §5 — schéma du moteur de
-- croisements.
--
-- Note d'implémentation sur `cross_analyses.dimension` : le PRD le déclare
-- `text` nullable dans la contrainte unique (account_id, import_id, code,
-- dimension). En Postgres, NULL n'est jamais égal à NULL dans une contrainte
-- unique : deux lignes (même code, dimension NULL) pourraient donc coexister
-- sans violation. Pour les croisements sans axe (cadence_vs_churn,
-- reach_quality, unfollow_boomerang, cohort_quality_score, inflow_geo agrégé)
-- on écrit `dimension = ''` plutôt que NULL, ce qui rend la contrainte unique
-- effective. Documenté ici plutôt que silencieusement.

create or replace function public.cohort_rate_at_horizon(
  p_account uuid, p_cohort_week date, p_horizon_days int
) returns numeric language sql stable set search_path = public as $$
  with base as (
    select profile_id, followed_at, status, departure_window_start
      from public.follower_states
     where account_id = p_account and cohort_week = p_cohort_week and episode = 1
  )
  select case when count(*) = 0 then null
              else count(*) filter (
                where status = 'gone'
                  and departure_window_start <= followed_at + (p_horizon_days || ' days')::interval
              )::numeric / count(*)
         end
    from base;
$$;

alter table public.cohort_survival
  add column horizon_days       int,
  add column rate_at_horizon    numeric(6,4),
  add column horizon_confidence text check (horizon_confidence in ('robuste','indicatif','insuffisant'));

create table public.cross_analyses (
  id                 uuid primary key default gen_random_uuid(),
  account_id         uuid not null references public.instagram_accounts(id) on delete cascade,
  import_id          uuid not null references public.imports(id) on delete cascade,
  code               text not null,
  dimension          text not null default '',
  payload            jsonb not null,
  sample_size        int  not null,
  window_start       timestamptz,
  window_end         timestamptz,
  confidence         text not null check (confidence in ('robuste','indicatif','insuffisant')),
  confidence_reason  text,
  computed_at        timestamptz not null default now(),
  unique (account_id, import_id, code, dimension)
);
create index on public.cross_analyses (account_id, code, computed_at desc);

create table public.content_attribution (
  content_id           uuid not null references public.content(id) on delete cascade,
  account_id           uuid not null references public.instagram_accounts(id) on delete cascade,
  import_id            uuid not null references public.imports(id) on delete cascade,
  window_hours         int  not null default 48,
  arrivals_in_window    int not null,
  baseline_expected     numeric(10,2) not null,
  excess_arrivals       int not null,
  meta_follows_gained   int,
  divergence_ratio      numeric(8,3),
  retained_at_horizon   int,
  retention_rate        numeric(6,4),
  confidence            text not null check (confidence in ('robuste','indicatif','insuffisant')),
  primary key (content_id, import_id)
);

create table public.hazard_curve (
  account_id   uuid not null references public.instagram_accounts(id) on delete cascade,
  import_id    uuid not null references public.imports(id) on delete cascade,
  cohort_week  date not null default '1900-01-01',
  age_bucket   int not null,
  at_risk      int not null,
  departed     int not null,
  hazard_rate  numeric(6,4) not null,
  primary key (account_id, import_id, cohort_week, age_bucket)
);

create table public.acquisition_spikes (
  id                    uuid primary key default gen_random_uuid(),
  account_id            uuid not null references public.instagram_accounts(id) on delete cascade,
  import_id             uuid not null references public.imports(id) on delete cascade,
  spike_start           date not null,
  spike_end             date not null,
  volume                int not null,
  baseline_daily        numeric(10,2) not null,
  multiple               numeric(8,2) not null,
  shape                 text not null check (shape in ('plateau','pic_court','rampe')),
  night_share           numeric(5,2),
  signal_share          numeric(5,2),
  retention_rate        numeric(6,4),
  inferred_type         text not null check (inferred_type in
                           ('probable_paid','probable_viral','probable_automated','indetermine')),
  inference_confidence  text not null check (inference_confidence in ('robuste','indicatif','insuffisant')),
  linked_content_id     uuid references public.content(id),
  budget_eur            numeric(12,2),
  unique (account_id, import_id, spike_start)
);

create table public.inflow_geo_estimate (
  account_id     uuid not null references public.instagram_accounts(id) on delete cascade,
  import_id      uuid not null references public.imports(id) on delete cascade,
  country        text not null,
  estimated_pct  numeric(6,2) not null,
  error_margin   numeric(6,2) not null,
  method         text not null default 'stock_delta',
  confidence     text not null check (confidence in ('robuste','indicatif','insuffisant')),
  primary key (account_id, import_id, country)
);

create table public.reconciliation (
  import_id            uuid primary key references public.imports(id) on delete cascade,
  account_id           uuid not null references public.instagram_accounts(id) on delete cascade,
  meta_gained          int,
  observed_arrivals    int,
  arrivals_coverage    numeric(6,4),
  meta_lost            int,
  observed_departures  int,
  departures_coverage  numeric(6,4),
  unobservable_reason  text
);

create index on public.follower_states (account_id, followed_at);
create index on public.content_attribution (account_id);
create index on public.hazard_curve (account_id, import_id);
create index on public.acquisition_spikes (account_id, import_id);
create index on public.inflow_geo_estimate (account_id, import_id);

alter table public.cross_analyses enable row level security;
alter table public.content_attribution enable row level security;
alter table public.hazard_curve enable row level security;
alter table public.acquisition_spikes enable row level security;
alter table public.inflow_geo_estimate enable row level security;
alter table public.reconciliation enable row level security;

create policy "cross_analyses_read" on public.cross_analyses
  for select using (account_id in (select public.user_account_ids()));
create policy "content_attribution_read" on public.content_attribution
  for select using (account_id in (select public.user_account_ids()));
create policy "hazard_curve_read" on public.hazard_curve
  for select using (account_id in (select public.user_account_ids()));
create policy "acquisition_spikes_read" on public.acquisition_spikes
  for select using (account_id in (select public.user_account_ids()));
create policy "inflow_geo_estimate_read" on public.inflow_geo_estimate
  for select using (account_id in (select public.user_account_ids()));
create policy "reconciliation_read" on public.reconciliation
  for select using (account_id in (select public.user_account_ids()));

-- budget_eur est la seule colonne saisie manuellement par l'agence (§3.8,
-- « Budget à saisir » au catalogue) : écriture directe autorisée pour les
-- rôles qui peuvent écrire sur le compte, la lecture RLS ci-dessus suffit
-- pour le reste (le recalcul complet passe par service_role).
create policy "acquisition_spikes_update_budget" on public.acquisition_spikes
  for update using (public.can_write_account(account_id))
  with check (public.can_write_account(account_id));
