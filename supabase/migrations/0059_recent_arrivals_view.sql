-- Fusion des écrans Vue d'ensemble/Audience/Croissance/Contenu/Écosystème
-- dans la page Analyse ("Import / API", 2026-09-08) : l'exemple de listing
-- nominatif y montre désormais aussi les arrivées (nouveaux + revenus), pas
-- seulement les départs. Miroir exact de v_recent_departures (0058) — même
-- motif de comparaison directe entre les deux derniers imports de
-- follower_observations, aucune table à maintenir.
create view public.v_recent_arrivals as
select
  m.account_id,
  m.profile_id,
  m.followed_at,
  date_trunc('week', m.followed_at at time zone 'UTC')::date as cohort_week,
  m.movement,
  p.exported_at as arrival_window_start,
  l.exported_at as arrival_window_end
from public.v_follower_movements m
join public.v_latest_two_imports l on l.account_id = m.account_id and l.rn = 1
join public.v_latest_two_imports p on p.account_id = m.account_id and p.rn = 2
where m.movement in ('nouveau', 'revenu')
order by arrival_window_end desc nulls last, followed_at desc;
