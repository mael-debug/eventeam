-- Simplification radicale du suivi des abonnés (2026-09-08). follower_states
-- (statuts, épisodes, cohort_week, tenure_days, fenêtres de départ,
-- détection de renommage) et tout ce qui en dépendait (cohortes, survie,
-- hazard_curve, pics d'acquisition, attribution, cross_analyses,
-- inflow_geo_estimate — déjà mortes depuis v_deep_analytics=false, 0051)
-- sont retirés. Remplacés par une comparaison à la volée entre les deux
-- derniers imports de follower_observations, sans aucune table d'état à
-- maintenir : nouveau / toujours_là / parti / revenu.
--
-- "revenu" (quelqu'un absent de l'import précédent mais déjà vu avant) était
-- auparavant traité comme du bruit à exclure ("renommage présumé") ; le
-- nouveau modèle l'affiche comme un mouvement à part entière, plus honnête.
--
-- Ordre des opérations : on répointe d'abord les vues encore utiles
-- (v_recent_departures, v_overview, check_canary_account) sur les nouvelles
-- sources AVANT de supprimer les tables dont elles dépendaient, pour ne
-- jamais laisser une vue référencer un objet déjà supprimé.

-- ==========================================================
-- 1. Nouvelles vues, calculées uniquement à partir de
--    follower_observations + imports (aucune table dérivée à maintenir).
-- ==========================================================

create or replace view public.v_latest_two_imports as
select
  i.account_id,
  i.id as import_id,
  i.exported_at,
  row_number() over (partition by i.account_id order by i.exported_at desc) as rn
from public.imports i
where i.status in ('completed', 'computing');

create or replace view public.v_follower_movements as
with latest as (
  select account_id, import_id, exported_at from public.v_latest_two_imports where rn = 1
),
previous as (
  select account_id, import_id, exported_at from public.v_latest_two_imports where rn = 2
),
latest_set as (
  select fo.account_id, fo.profile_id, fo.followed_at
  from public.follower_observations fo
  join latest l on l.import_id = fo.import_id
),
previous_set as (
  select fo.account_id, fo.profile_id
  from public.follower_observations fo
  join previous p on p.import_id = fo.import_id
),
-- Vu dans un import STRICTEMENT antérieur à l'import précédent : condition
-- de "revenu" plutôt que "nouveau" pour un profil absent de l'import
-- précédent mais présent au dernier.
seen_before_previous as (
  select distinct fo.account_id, fo.profile_id
  from public.follower_observations fo
  join public.imports i on i.id = fo.import_id
  join previous p on p.account_id = i.account_id
  where i.exported_at < p.exported_at
),
arrivals as (
  select
    l.account_id, l.profile_id, l.followed_at,
    (case when sb.profile_id is not null then 'revenu' else 'nouveau' end) as movement
  from latest_set l
  left join previous_set pv on pv.account_id = l.account_id and pv.profile_id = l.profile_id
  left join seen_before_previous sb on sb.account_id = l.account_id and sb.profile_id = l.profile_id
  where pv.profile_id is null
),
stayed as (
  select l.account_id, l.profile_id, l.followed_at, 'toujours_la' as movement
  from latest_set l
  join previous_set pv on pv.account_id = l.account_id and pv.profile_id = l.profile_id
),
departed as (
  select pv.account_id, pv.profile_id, fo.followed_at, 'parti' as movement
  from previous_set pv
  left join latest_set l on l.account_id = pv.account_id and l.profile_id = pv.profile_id
  join public.follower_observations fo
    on fo.account_id = pv.account_id and fo.profile_id = pv.profile_id
   and fo.import_id = (select import_id from previous pr where pr.account_id = pv.account_id)
  where l.profile_id is null
)
select * from arrivals
union all select * from stayed
union all select * from departed;

-- Repointée sur v_follower_movements (avant que follower_states ne
-- disparaisse) : même jeu de colonnes qu'avant, donc aucun changement côté
-- consommateurs (listes/paginated-departures.tsx, croissance/page.tsx).
-- DROP explicite : CREATE OR REPLACE refuse tout changement de type de
-- colonne, même compatible (Postgres 42P16).
drop view if exists public.v_recent_departures;
create view public.v_recent_departures as
select
  m.account_id,
  m.profile_id,
  m.followed_at,
  date_trunc('week', m.followed_at at time zone 'UTC')::date as cohort_week,
  p.exported_at as departure_window_start,
  l.exported_at as departure_window_end,
  extract(day from p.exported_at - m.followed_at)::int as tenure_days
from public.v_follower_movements m
join public.v_latest_two_imports l on l.account_id = m.account_id and l.rn = 1
join public.v_latest_two_imports p on p.account_id = m.account_id and p.rn = 2
where m.movement = 'parti'
order by departure_window_end desc nulls last, tenure_days desc;

-- Remplace la table reconciliation (alimentée par la section 9, désormais
-- supprimée, de recompute_account) : mêmes colonnes, calculées à la volée.
create or replace view public.v_reconciliation as
select
  l.account_id,
  l.import_id,
  ai.followers_gained as meta_gained,
  count(*) filter (where m.movement in ('nouveau', 'revenu')) as observed_arrivals,
  round(count(*) filter (where m.movement in ('nouveau', 'revenu'))::numeric / nullif(ai.followers_gained, 0), 4) as arrivals_coverage,
  ai.followers_lost as meta_lost,
  count(*) filter (where m.movement = 'parti') as observed_departures,
  round(count(*) filter (where m.movement = 'parti')::numeric / nullif(ai.followers_lost, 0), 4) as departures_coverage,
  'la liste d''abonnés exportée par Meta ne couvre pas nécessairement 100 % du compte (comptes désactivés ou restreints exclus) : ce ratio peut sous-estimer la couverture réelle.' as unobservable_reason
from public.v_latest_two_imports l
left join public.v_follower_movements m on m.account_id = l.account_id
left join public.audience_insights ai on ai.account_id = l.account_id and ai.import_id = l.import_id
where l.rn = 1
group by l.account_id, l.import_id, ai.followers_gained, ai.followers_lost;

-- v_overview : retire les colonnes issues de v_cohort_totals (bientôt
-- supprimée avec cohort_survival) — total_remaining/departed/measurable et
-- departure_rate n'ont plus de source. La carte "Taux de départ mesuré"
-- correspondante est retirée côté front dans le même commit. DROP explicite :
-- CREATE OR REPLACE refuse de retirer des colonnes (Postgres 42P16).
drop view if exists public.v_overview;
create view public.v_overview as
select
  li.account_id,
  li.import_id,
  li.window_start,
  li.window_end,
  li.completed_at,
  ai.period_start as insights_period_start,
  ai.period_end as insights_period_end,
  ai.followers_total,
  ai.followers_gained,
  ai.followers_lost,
  ai.followers_net,
  ai.growth_pct,
  og.organic_gained,
  (case
    when ai.followers_gained is not null and ai.followers_gained > 0
      then round(og.organic_gained::numeric / ai.followers_gained::numeric, 4)
    else null
  end) as organic_share
from public.latest_completed_import li
left join public.audience_insights ai on ai.account_id = li.account_id and ai.import_id = li.import_id
left join public.v_organic_gained og on og.account_id = li.account_id;

-- check_canary_account (0020) : outil interne, non exposé au front.
-- Repointé sur follower_observations/v_follower_movements — les
-- expected_values enregistrées visaient l'ancien schéma et devront être
-- recalibrées, mais la fonction ne doit plus référencer des tables sur le
-- point de disparaître (follower_states, cohorts).
create or replace function public.check_canary_account(p_account_id uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_expected jsonb;
  v_actual jsonb;
  v_diffs jsonb := '{}'::jsonb;
  v_key text;
  v_passed boolean := true;
  v_latest_import uuid;
begin
  if p_account_id not in (select public.user_account_ids()) then
    raise exception 'Accès refusé';
  end if;

  select expected_values into v_expected from public.canary_accounts where account_id = p_account_id;
  if v_expected is null then
    raise exception 'Compte % non enregistré comme canari', p_account_id;
  end if;

  select import_id into v_latest_import from public.v_latest_two_imports where account_id = p_account_id and rn = 1;

  select jsonb_build_object(
    'present', (select count(*) from public.follower_observations where account_id = p_account_id and import_id = v_latest_import),
    'gone', (select count(*) from public.v_follower_movements where account_id = p_account_id and movement = 'parti')
  ) into v_actual;

  for v_key in select jsonb_object_keys(v_expected) loop
    if (v_expected -> v_key) is distinct from (v_actual -> v_key) then
      v_diffs := v_diffs || jsonb_build_object(v_key, jsonb_build_object('expected', v_expected -> v_key, 'actual', v_actual -> v_key));
      v_passed := false;
    end if;
  end loop;

  update public.canary_accounts
     set last_checked_at = now(), last_check_passed = v_passed, last_check_diffs = v_diffs
   where account_id = p_account_id;

  return jsonb_build_object('passed', v_passed, 'diffs', v_diffs, 'actual', v_actual, 'expected', v_expected);
end;
$function$;

-- ==========================================================
-- 2. recompute_account() : ne garde que following_states (le seul calcul
--    qui reste). follower_states, reconciliation et tout le bloc
--    v_deep_analytics (cohortes/survie/hazard/pics/attribution/cross_
--    analyses/inflow_geo) disparaissent — remplacés par les vues ci-dessus
--    ou déjà morts depuis 0051.
-- ==========================================================
create or replace function public.recompute_account(p_account_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_has_imports boolean;
  v_latest_import uuid;
begin
  delete from public.following_states where account_id = p_account_id;

  select exists(
    select 1 from public.imports where account_id = p_account_id and status in ('completed', 'computing')
  ) into v_has_imports;

  if not v_has_imports then
    return;
  end if;

  drop table if exists tmp_imports;
  create temporary table tmp_imports on commit drop as
  select
    id, exported_at,
    lead(id) over (w) as next_import_id,
    lead(exported_at) over (w) as next_exported_at
  from public.imports
  where account_id = p_account_id and status in ('completed', 'computing')
  window w as (order by exported_at);

  select id into v_latest_import from tmp_imports where next_import_id is null;

  drop table if exists tmp_following_latest;
  create temporary table tmp_following_latest on commit drop as
  select distinct on (fo.profile_id)
    fo.profile_id, fo.followed_at, ti.exported_at, ti.next_import_id, ti.next_exported_at
  from public.following_observations fo
  join tmp_imports ti on ti.id = fo.import_id
  where fo.account_id = p_account_id
  order by fo.profile_id, ti.exported_at desc;

  insert into public.following_states (account_id, profile_id, followed_at, status, removed_between_start, removed_between_end, is_mutual)
  select
    p_account_id, l.profile_id, l.followed_at,
    case when l.next_import_id is null then 'present' else 'removed' end,
    case when l.next_import_id is not null then l.exported_at end,
    case when l.next_import_id is not null then l.next_exported_at end,
    exists (
      select 1 from public.follower_observations fo2
      where fo2.account_id = p_account_id and fo2.profile_id = l.profile_id and fo2.import_id = v_latest_import
    )
  from tmp_following_latest l;
end;
$function$;

-- ==========================================================
-- 3. Suppression des vues/fonctions/tables mortes.
-- ==========================================================

drop view if exists public.v_likely_renames;
drop view if exists public.v_growth_by_cohort;
drop view if exists public.v_cohort_totals;
drop view if exists public.v_segments;
drop view if exists public.v_recent_arrival_risk;

drop function if exists public.cohort_rate_at_horizon(uuid, date, int);
drop function if exists public.custom_window_stats(uuid, date, date);

drop table if exists public.acquisition_spikes cascade;
drop table if exists public.content_attribution cascade;
drop table if exists public.cross_analyses cascade;
drop table if exists public.inflow_geo_estimate cascade;
drop table if exists public.hazard_curve cascade;
drop table if exists public.cohort_survival cascade;
drop table if exists public.cohorts cascade;
drop table if exists public.custom_acquisition_windows cascade;
drop table if exists public.reconciliation cascade;
drop table if exists public.follower_states cascade;
drop type if exists public.follower_status;
