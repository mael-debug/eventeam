-- Écran Segments (addendum §7.2). Deux vues nommées (décision architecturale :
-- chaque écran lit une vue/fonction Postgres nommée, jamais de requête ad hoc
-- de composant), toutes deux security_invoker pour que la RLS de l'appelant
-- s'applique, jamais celle du propriétaire de la vue.
--
-- v_segments agrège acquisition_spikes par inferred_type : ce ne sont PAS des
-- clusters recalculés, mais un regroupement des pics déjà classés par le
-- moteur (0019, étape 6). C'est la seule base pour "Segments" qui ne fabrique
-- aucune catégorie narrative absente des données — probable_paid /
-- probable_viral / probable_automated / indetermine sont exactement le
-- vocabulaire d'inférence déjà utilisé dans Diagnostic et Acquisition.
create or replace view public.v_segments
with (security_invoker = true) as
select
  s.account_id,
  s.import_id,
  s.inferred_type,
  count(*) as n_spikes,
  sum(s.volume) as volume_total,
  (
    sum(s.volume * s.retention_rate) filter (where s.retention_rate is not null)
    / nullif(sum(s.volume) filter (where s.retention_rate is not null), 0)
  ) as retention_rate_weighted,
  avg(s.night_share) as night_share_avg,
  avg(s.signal_share) as signal_share_avg,
  avg(s.duration_days_computed) as duration_days_avg,
  min(s.spike_start) as window_start,
  max(s.spike_end) as window_end,
  (case
    when count(*) filter (where s.inference_confidence != 'insuffisant') = 0 then 'insuffisant'
    when count(*) filter (where s.inference_confidence = 'indicatif') > 0 then 'indicatif'
    else 'robuste'
  end) as segment_confidence
from (
  select *, (spike_end - spike_start + 1) as duration_days_computed
  from public.acquisition_spikes
) s
group by s.account_id, s.import_id, s.inferred_type;

comment on view public.v_segments is
  'Regroupement des pics acquisition_spikes déjà classés par recompute_account, un par inferred_type. Pas un recalcul, un agrégat.';

-- v_recent_arrival_risk : tercile de hazard_rate (hazard_curve, agrégat
-- cohort_week = 1900-01-01) appliqué à la tranche d'âge courante des abonnés
-- présents arrivés dans les 30 derniers jours. Hétérogénéité assumée comme
-- "indicatif" côté écran : un tercile n'est pas un modèle de risque validé,
-- seulement un classement relatif des tranches d'âge déjà mesurées par le
-- moteur.
create or replace view public.v_recent_arrival_risk
with (security_invoker = true) as
with latest_import as (
  select distinct on (account_id) account_id, id as import_id
  from public.imports
  where status = 'completed'
  order by account_id, exported_at desc
),
hc_tiers as (
  select account_id, import_id, age_bucket, hazard_rate,
    ntile(3) over (partition by account_id, import_id order by hazard_rate) as risk_tier
  from public.hazard_curve
  where cohort_week = '1900-01-01'
),
buckets(lo) as (values (0),(7),(14),(21),(30),(45),(60),(90)),
recent_arrivals as (
  select fs.account_id,
    li.import_id,
    (select max(b.lo) from buckets b where b.lo <= fs.tenure_days) as age_bucket
  from public.follower_states fs
  join latest_import li on li.account_id = fs.account_id
  where fs.episode = 1 and fs.is_latest_episode and fs.status = 'present'
    and fs.tenure_days is not null and fs.tenure_days <= 30
)
select
  r.account_id,
  r.import_id,
  t.risk_tier,
  count(*) as n
from recent_arrivals r
join hc_tiers t on t.account_id = r.account_id and t.import_id = r.import_id and t.age_bucket = r.age_bucket
group by r.account_id, r.import_id, t.risk_tier;

comment on view public.v_recent_arrival_risk is
  'Comptes présents arrivés <=30j, classés par tercile du hazard_rate (hazard_curve) de leur tranche d''âge courante. risk_tier 1 = tercile le plus bas (risque faible), 3 = le plus haut (risque élevé).';
