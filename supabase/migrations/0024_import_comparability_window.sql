-- Diagnostic et Acquisition ont besoin de la fenêtre du dernier import pour
-- leur sous-titre — ajout en fin de liste de colonnes (create or replace
-- view l'autorise sans casser les colonnes existantes).
create or replace view public.import_comparability as
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
  end as comparability_reason,
  l.window_start as latest_window_start, l.window_end as latest_window_end
from public.latest_completed_import l
left join public.previous_completed_import p on p.account_id = l.account_id;

alter view public.import_comparability set (security_invoker = true);
