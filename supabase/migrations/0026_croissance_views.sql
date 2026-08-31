-- Community Intelligence — vues nommées pour l'écran Croissance.

-- Arrivées (cohorts.size) et départs mesurés (cohort_survival.departed,
-- au dernier import) par cohorte, sur deux échelles distinctes comme le
-- veut le gabarit de design (à l'échelle des arrivées, les départs
-- seraient invisibles).
create view public.v_growth_by_cohort as
select
  co.account_id, co.cohort_week, co.size as arrivals, co.is_spike_period,
  coalesce(cs.departed, 0) as departed
from public.cohorts co
join public.latest_completed_import li on li.account_id = co.account_id
left join public.cohort_survival cs
  on cs.account_id = co.account_id and cs.cohort_week = co.cohort_week and cs.measured_import_id = li.import_id
order by co.cohort_week;

alter view public.v_growth_by_cohort set (security_invoker = true);

-- Derniers départs mesurés — épisode le plus récent de chaque profil,
-- actuellement 'gone'. profile_id est un surrogate bigserial interne
-- (private_identity.profiles), jamais l'identifiant Instagram réel : sûr à
-- afficher en clair, seul reveal_usernames() (désormais gardé par
-- can_view_identities, 0025) résout le pseudonyme.
create view public.v_recent_departures as
select
  fs.account_id, fs.profile_id, fs.followed_at, fs.cohort_week,
  fs.departure_window_start, fs.departure_window_end, fs.tenure_days
from public.follower_states fs
where fs.status = 'gone' and fs.is_latest_episode
order by fs.departure_window_end desc nulls last, fs.tenure_days desc;

alter view public.v_recent_departures set (security_invoker = true);

-- Renommages présumés au dernier import — compte réel, plutôt que la
-- mention "non distingués" du gabarit de design (l'exclusion existe déjà
-- dans le moteur depuis 0018, elle n'était simplement jamais comptée pour
-- l'écran).
create view public.v_likely_renames as
select account_id, count(*) as likely_rename_count
from public.follower_states
where status = 'likely_rename' and is_latest_episode
group by account_id;

alter view public.v_likely_renames set (security_invoker = true);
