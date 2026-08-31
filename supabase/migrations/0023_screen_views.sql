-- Community Intelligence — vues nommées par écran (Vue d'ensemble,
-- Acquisition, Diagnostic aujourd'hui, les suivantes au fil des écrans).
--
-- Principe posé ce soir : chaque écran lit une vue ou une fonction dédiée,
-- jamais une agrégation refaite dans le composant. Deux pages calculaient
-- déjà le même total de cohortes chacune de son côté avant cette migration
-- (Vue d'ensemble et Acquisition) — exactement le risque de divergence que
-- ce principe évite. security_invoker sur chaque vue pour que la RLS des
-- tables sous-jacentes s'applique à l'appelant, jamais au propriétaire de
-- la vue (même motif que acquisition_spikes_with_budget, 0019).

-- Dernier import 'completed' par compte, et le précédent — point de
-- jonction unique pour tous les écrans, et détection des trois états à ne
-- jamais sauter : aucun import, un seul import (rien à comparer), fenêtres
-- trop recouvrantes pour être comparées.
-- DISTINCT ON + OFFSET ne composent pas comme il faudrait ici (l'OFFSET
-- s'appliquerait à l'ensemble dédupliqué, pas par compte) : row_number()
-- partitionné par compte est la seule façon correcte d'obtenir le
-- "précédent" par compte, pas globalement.
create view public.latest_completed_import as
select account_id, import_id, window_start, window_end, exported_at, completed_at
from (
  select id as import_id, account_id, window_start, window_end, exported_at, completed_at,
    row_number() over (partition by account_id order by completed_at desc) as rn
  from public.imports
  where status = 'completed'
) ranked
where rn = 1;

create view public.previous_completed_import as
select account_id, import_id, window_start, window_end, exported_at, completed_at
from (
  select id as import_id, account_id, window_start, window_end, exported_at, completed_at,
    row_number() over (partition by account_id order by completed_at desc) as rn
  from public.imports
  where status = 'completed'
) ranked
where rn = 2;

alter view public.latest_completed_import set (security_invoker = true);
alter view public.previous_completed_import set (security_invoker = true);

-- État de comparabilité entre les deux derniers imports d'un compte. Ne
-- masque jamais un résultat (§0 du moteur) : signale seulement, à charge
-- pour l'écran d'afficher l'avertissement à côté des chiffres, pas à la
-- place.
create view public.import_comparability as
select
  l.account_id, l.import_id as latest_import_id, p.import_id as previous_import_id,
  (p.import_id is null) as is_single_import,
  case when p.import_id is not null then
    greatest(0, extract(epoch from (least(l.window_end, p.window_end) - greatest(l.window_start, p.window_start))) / 86400)
  end as overlap_days,
  case when p.import_id is not null and l.window_end > l.window_start and p.window_end > p.window_start then
    round((
      greatest(0, extract(epoch from (least(l.window_end, p.window_end) - greatest(l.window_start, p.window_start))) / 86400)
      / least(
          extract(epoch from (l.window_end - l.window_start)) / 86400,
          extract(epoch from (p.window_end - p.window_start)) / 86400
        )
    )::numeric, 4)
  end as overlap_ratio,
  case
    when p.import_id is null then false
    when l.window_end > l.window_start and p.window_end > p.window_start
      and (
        greatest(0, extract(epoch from (least(l.window_end, p.window_end) - greatest(l.window_start, p.window_start))) / 86400)
        / least(extract(epoch from (l.window_end - l.window_start)) / 86400, extract(epoch from (p.window_end - p.window_start)) / 86400)
      ) >= 0.95
    then false
    else true
  end as comparable,
  case
    when p.import_id is null then 'un seul import disponible'
    when l.window_end > l.window_start and p.window_end > p.window_start
      and (
        greatest(0, extract(epoch from (least(l.window_end, p.window_end) - greatest(l.window_start, p.window_start))) / 86400)
        / least(extract(epoch from (l.window_end - l.window_start)) / 86400, extract(epoch from (p.window_end - p.window_start)) / 86400)
      ) >= 0.95
    then 'fenêtres quasi identiques — trop peu de nouvelle observation entre les deux imports pour comparer'
  end as comparability_reason
from public.latest_completed_import l
left join public.previous_completed_import p on p.account_id = l.account_id;

alter view public.import_comparability set (security_invoker = true);

-- Totaux de cohortes mesurés au dernier import — lus identiquement par Vue
-- d'ensemble et Acquisition (avant cette vue, chacune recalculait sa
-- propre somme en JS : la source d'un futur écart entre les deux écrans).
create view public.v_cohort_totals as
select
  li.account_id, li.import_id,
  coalesce(sum(cs.remaining), 0)::int as total_remaining,
  coalesce(sum(cs.departed), 0)::int as total_departed,
  coalesce(sum(cs.remaining), 0)::int + coalesce(sum(cs.departed), 0)::int as total_measurable,
  case when coalesce(sum(cs.remaining), 0) + coalesce(sum(cs.departed), 0) > 0
    then round(sum(cs.departed)::numeric / (sum(cs.remaining) + sum(cs.departed)), 4)
  end as departure_rate
from public.latest_completed_import li
left join public.cohort_survival cs on cs.account_id = li.account_id and cs.measured_import_id = li.import_id
group by li.account_id, li.import_id;

alter view public.v_cohort_totals set (security_invoker = true);

-- Part organique mesurée au dernier import (somme de content_metrics.
-- follows_gained rattachés à ce même import).
create view public.v_organic_gained as
select li.account_id, li.import_id, coalesce(sum(cm.follows_gained), 0)::int as organic_gained
from public.latest_completed_import li
left join public.content_metrics cm on cm.account_id = li.account_id and cm.import_id = li.import_id
group by li.account_id, li.import_id;

alter view public.v_organic_gained set (security_invoker = true);

-- Vue d'ensemble — une ligne par compte, tous les chiffres des 4 cartes
-- KPI déjà joints et calculés une seule fois.
create view public.v_overview as
select
  li.account_id, li.import_id,
  li.window_start, li.window_end, li.completed_at,
  ai.period_start as insights_period_start, ai.period_end as insights_period_end,
  ai.followers_total, ai.followers_gained, ai.followers_lost, ai.followers_net, ai.growth_pct,
  ct.total_remaining, ct.total_departed, ct.total_measurable, ct.departure_rate,
  og.organic_gained,
  case when ai.followers_gained is not null and ai.followers_gained > 0
    then round(og.organic_gained::numeric / ai.followers_gained, 4)
  end as organic_share
from public.latest_completed_import li
left join public.audience_insights ai on ai.account_id = li.account_id and ai.import_id = li.import_id
left join public.v_cohort_totals ct on ct.account_id = li.account_id
left join public.v_organic_gained og on og.account_id = li.account_id;

alter view public.v_overview set (security_invoker = true);
