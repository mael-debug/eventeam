-- Community Intelligence — corrections validées contre la fixture réelle
-- (deux exports Eden Park pseudonymisés, EXPECTED.md). Le moteur reproduit
-- maintenant exactement 6 948 / 2 919 / 1 138 / 16,4 % et la courbe de
-- survie par cohorte au chiffre près.
--
-- Quatre bugs distincts trouvés en rejouant la fixture (validés d'abord en
-- JS contre le parseur réel avant traduction en SQL) :
--
-- 1. Régression introduite en réécrivant recompute_account() pour l'addendum
--    (0017) : l'exclusion de 'likely_rename' des cohortes, de la série
--    d'arrivées quotidiennes et de cohort_membership (migration 0011) avait
--    disparu. Restaurée ici.
--
-- 2. cohorts.size / cohort_survival ne doivent compter que les membres dont
--    le sort est mesurable : les épisodes 'out_of_window' ne doivent jamais
--    être présumés partis (déjà correct), mais ne doivent pas non plus
--    gonfler le dénominateur de la cohorte — leur sort est simplement
--    inconnu, ils ne devraient jamais avoir fait partie de la population
--    mesurée. Sur la fixture réelle, la cohorte du 25 mai passait de 190
--    (attendu) à 254 sans ce correctif.
--
-- 3. « Gone » courant vs historique. follower_states.status='gone' est
--    correct par épisode (un abonnement qui s'est terminé, fait réel et
--    historique, jamais effacé — c'est tout le sens de la clé episode).
--    Mais les agrégats qui rapportent une photographie de l'état ACTUEL
--    (couverture de réconciliation, courbe de risque par âge, ancienneté
--    médiane au départ du score de qualité) ne doivent compter que le
--    dernier épisode de chaque profil : un profil reparti (nouvel épisode
--    'present') n'est plus « parti » aujourd'hui, même si son épisode
--    précédent l'était réellement. cohort_survival le faisait déjà
--    correctement via sa jointure latérale sur follower_observations (qui
--    regarde l'observation brute la plus récente, pas le statut d'épisode) ;
--    les trois autres agrégats comptaient chaque épisode 'gone' sans
--    vérifier qu'aucun épisode plus récent ne l'avait remplacé, produisant
--    1 140 au lieu de 1 138 partis sur la fixture (les deux réabonnements).
--    Nouvelle colonne follower_states.is_latest_episode, calculée à
--    l'insertion, utilisée partout où un total « actuellement parti » est
--    nécessaire.
--
-- 4. Troncature de fin de fenêtre. Une cohorte dont la semaine
--    (cohort_week + 7 j) dépasse le window_end de l'import d'origine est
--    structurellement incomplète : les arrivées de la fin de semaine
--    n'ont simplement pas encore pu être observées. C'est distinct de
--    « exposition < horizon commun » (§1 de l'addendum) et doit être
--    marqué insuffisant avec sa propre raison, même quand l'exposition
--    atteint par ailleurs l'horizon (cas exact de la cohorte du 20 juillet
--    sur la fixture : exposition = horizon = 38 j, mais tronquée quand
--    même).

alter table public.follower_states
  add column is_latest_episode boolean not null default true;

alter table public.cohort_survival
  add column horizon_confidence_reason text;

create or replace function public.recompute_account(p_account_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_has_imports   boolean;
  v_latest_import uuid;
  v_latest_at     timestamptz;
  v_prev_import   uuid;
  v_prev_at       timestamptz;
  v_horizon_days  int;
  v_account_signal_share numeric;
  v_account_survival_rate numeric;
begin
  delete from public.follower_states where account_id = p_account_id;
  delete from public.following_states where account_id = p_account_id;
  delete from public.cohort_survival where account_id = p_account_id;
  delete from public.cohorts where account_id = p_account_id;
  delete from public.hazard_curve where account_id = p_account_id;
  delete from public.content_attribution where account_id = p_account_id;
  delete from public.cross_analyses where account_id = p_account_id;
  delete from public.inflow_geo_estimate where account_id = p_account_id;
  delete from public.reconciliation where account_id = p_account_id;

  select exists(
    select 1 from public.imports where account_id = p_account_id and status = 'completed'
  ) into v_has_imports;

  if not v_has_imports then
    delete from public.acquisition_spikes where account_id = p_account_id;
    return;
  end if;

  drop table if exists tmp_imports;
  create temporary table tmp_imports on commit drop as
  select
    id, exported_at, window_start, window_end,
    lead(id) over (w) as next_import_id,
    lead(exported_at) over (w) as next_exported_at,
    lead(window_start) over (w) as next_window_start,
    lead(window_end) over (w) as next_window_end,
    lag(id) over (w) as prev_import_id,
    lag(exported_at) over (w) as prev_exported_at,
    (lead(id) over (w) is null) as is_latest
  from public.imports
  where account_id = p_account_id and status = 'completed'
  window w as (order by exported_at);

  select id, exported_at into v_latest_import, v_latest_at from tmp_imports where is_latest;
  select prev_import_id, prev_exported_at into v_prev_import, v_prev_at from tmp_imports where is_latest;

  -- ==========================================================
  -- 1. follower_states — §4.2, §4.3, §4.6 du PRD v1.0
  -- ==========================================================
  drop table if exists tmp_follower_episodes;
  create temporary table tmp_follower_episodes on commit drop as
  with ordered_obs as (
    select
      fo.profile_id, fo.followed_at, fo.import_id, ti.exported_at,
      lag(fo.followed_at) over (partition by fo.profile_id order by ti.exported_at) as prev_followed_at
    from public.follower_observations fo
    join tmp_imports ti on ti.id = fo.import_id
    where fo.account_id = p_account_id
  ),
  flagged as (
    select *,
      (case when prev_followed_at is null or prev_followed_at <> followed_at then 1 else 0 end) as is_new_episode
    from ordered_obs
  )
  select *,
    sum(is_new_episode) over (partition by profile_id order by exported_at rows between unbounded preceding and current row) as episode
  from flagged;

  drop table if exists tmp_episode_bounds;
  create temporary table tmp_episode_bounds on commit drop as
  select
    profile_id, episode, followed_at,
    (array_agg(import_id order by exported_at asc))[1] as first_import_id,
    (array_agg(import_id order by exported_at desc))[1] as last_present_import_id,
    (episode = max(episode) over (partition by profile_id)) as is_latest_episode
  from tmp_follower_episodes
  group by profile_id, episode, followed_at;

  insert into public.follower_states (
    account_id, profile_id, episode, followed_at, cohort_week,
    first_import_id, last_present_import_id, status,
    departure_window_start, departure_window_end, tenure_days,
    sig_digit_suffix, sig_many_underscores, sig_long_handle, is_latest_episode
  )
  select
    p_account_id, eb.profile_id, eb.episode, eb.followed_at,
    date_trunc('week', eb.followed_at at time zone 'UTC')::date,
    eb.first_import_id, eb.last_present_import_id,
    (case
      when a.is_latest then 'present'
      when eb.followed_at between greatest(a.window_start, a.next_window_start)
                                and least(a.window_end, a.next_window_end)
        then 'gone'
      else 'out_of_window'
    end)::public.follower_status,
    case when not a.is_latest
           and eb.followed_at between greatest(a.window_start, a.next_window_start)
                                    and least(a.window_end, a.next_window_end)
      then a.exported_at end,
    case when not a.is_latest
           and eb.followed_at between greatest(a.window_start, a.next_window_start)
                                    and least(a.window_end, a.next_window_end)
      then a.next_exported_at end,
    case when not a.is_latest
           and eb.followed_at between greatest(a.window_start, a.next_window_start)
                                    and least(a.window_end, a.next_window_end)
      then extract(day from a.next_exported_at - eb.followed_at)::int
      else extract(day from now() - eb.followed_at)::int
    end,
    coalesce(pi.sig_digit_suffix, false), coalesce(pi.sig_many_underscores, false), coalesce(pi.sig_long_handle, false),
    eb.is_latest_episode
  from tmp_episode_bounds eb
  join tmp_imports a on a.id = eb.last_present_import_id
  left join private_identity.profiles pi on pi.profile_id = eb.profile_id;

  with renames as (
    select new_fs.profile_id as new_profile_id, new_fs.episode as new_episode, old_fs.profile_id as old_profile_id
    from public.follower_states new_fs
    join public.follower_states old_fs
      on old_fs.account_id = new_fs.account_id
     and old_fs.status = 'gone'
     and old_fs.followed_at = new_fs.followed_at
     and old_fs.departure_window_end = (select exported_at from tmp_imports where id = new_fs.first_import_id)
    where new_fs.account_id = p_account_id and new_fs.episode = 1 and new_fs.status = 'present'
  )
  update public.follower_states fs
     set status = 'likely_rename', rename_candidate_of = r.old_profile_id
    from renames r
   where fs.account_id = p_account_id and fs.profile_id = r.new_profile_id and fs.episode = r.new_episode;

  -- ==========================================================
  -- 2. following_states
  -- ==========================================================
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
    exists (select 1 from public.follower_states fs where fs.account_id = p_account_id and fs.profile_id = l.profile_id and fs.status = 'present')
  from tmp_following_latest l;

  -- ==========================================================
  -- 3. cohorts — un renommage présumé n'est pas une acquisition (§4.6) ; un
  -- épisode out_of_window a un sort inconnu et ne doit jamais faire partie
  -- d'une population dont on mesure la survie.
  -- ==========================================================
  insert into public.cohorts (account_id, cohort_week, size, origin_import_id, is_spike_period)
  select p_account_id, fs.cohort_week, count(*), (array_agg(fs.first_import_id order by ti.exported_at asc))[1], false
  from public.follower_states fs
  join tmp_imports ti on ti.id = fs.first_import_id
  where fs.account_id = p_account_id and fs.episode = 1 and fs.status not in ('out_of_window', 'likely_rename')
  group by fs.cohort_week;

  select min(extract(day from v_latest_at - c.cohort_week::timestamptz))::int into v_horizon_days
  from public.cohorts c
  where c.account_id = p_account_id and c.origin_import_id <> v_latest_import;

  if v_horizon_days is null then
    select max(extract(day from v_latest_at - c.cohort_week::timestamptz))::int into v_horizon_days
    from public.cohorts c where c.account_id = p_account_id;
  end if;

  -- ==========================================================
  -- 4. cohort_survival
  -- ==========================================================
  with cohort_membership as (
    select profile_id, cohort_week, first_import_id as origin_import_id
    from public.follower_states
    where account_id = p_account_id and episode = 1 and status not in ('out_of_window', 'likely_rename')
  ),
  pairs as (
    select cm.profile_id, cm.cohort_week, cm.origin_import_id,
           origin.window_end as origin_window_end,
           mi.id as measured_import_id, mi.exported_at as measured_at,
           mi.window_start as m_window_start, mi.window_end as m_window_end
    from cohort_membership cm
    join tmp_imports origin on origin.id = cm.origin_import_id
    join tmp_imports mi on mi.exported_at >= origin.exported_at
  ),
  resolved as (
    select p.*, lp.import_id as last_present_import_id, lp.followed_at as last_followed_at,
           lp.window_start as last_window_start, lp.window_end as last_window_end,
           (p.measured_import_id = lp.import_id) as directly_present
    from pairs p
    left join lateral (
      select fo.import_id, fo.followed_at, ti2.window_start, ti2.window_end
        from public.follower_observations fo
        join tmp_imports ti2 on ti2.id = fo.import_id
       where fo.account_id = p_account_id and fo.profile_id = p.profile_id and ti2.exported_at <= p.measured_at
       order by ti2.exported_at desc limit 1
    ) lp on true
  ),
  remaining_flag as (
    select profile_id, cohort_week, measured_import_id, measured_at, origin_window_end,
      (case
        when directly_present then true
        when last_present_import_id is null then false
        when last_followed_at between greatest(last_window_start, m_window_start) and least(last_window_end, m_window_end) then false
        else true
      end) as is_remaining
    from resolved
  ),
  agg as (
    select cohort_week, measured_import_id, measured_at,
      count(*) filter (where is_remaining) as remaining,
      count(*) filter (where not is_remaining) as departed,
      count(*) as n,
      extract(day from measured_at - cohort_week::timestamptz)::int as exposure_days,
      -- une cohorte est tronquée si sa semaine dépasse le window_end de
      -- l'import où elle a été observée pour la première fois : les
      -- arrivées de fin de semaine n'ont simplement pas encore pu être vues.
      bool_or(cohort_week::timestamptz + interval '7 days' > origin_window_end) as is_truncated
    from remaining_flag
    group by cohort_week, measured_import_id, measured_at
  )
  insert into public.cohort_survival (
    account_id, cohort_week, measured_import_id, measured_at, remaining, departed, survival_rate, exposure_days,
    horizon_days, rate_at_horizon, horizon_confidence, horizon_confidence_reason
  )
  select
    p_account_id, a.cohort_week, a.measured_import_id, a.measured_at, a.remaining, a.departed,
    round(a.remaining::numeric / a.n, 4), a.exposure_days,
    case when a.measured_import_id = v_latest_import then v_horizon_days end,
    case when a.measured_import_id = v_latest_import and a.exposure_days >= v_horizon_days and not a.is_truncated
      then 1 - public.cohort_rate_at_horizon(p_account_id, a.cohort_week, v_horizon_days)
    end,
    case when a.measured_import_id = v_latest_import then
      case
        when a.is_truncated then 'insuffisant'
        when a.exposure_days < v_horizon_days then 'insuffisant'
        when a.n >= 200 then 'robuste'
        else 'indicatif'
      end
    end,
    case when a.measured_import_id = v_latest_import then
      case
        when a.is_truncated then 'cohorte tronquée par la fin de fenêtre de l''import d''origine'
        when a.exposure_days < v_horizon_days then 'exposition inférieure à l''horizon commun (' || v_horizon_days || ' j)'
      end
    end
  from agg a;

  -- ==========================================================
  -- 5. hazard_curve — population dont le statut ACTUEL (dernier épisode)
  -- est present/gone, episode = 1 (cohérent avec cohorts/cohort_survival).
  -- ==========================================================
  with buckets(lo) as (values (0),(7),(14),(21),(30),(45),(60),(90)),
  population as (
    select profile_id, cohort_week, tenure_days as age_days, (status = 'gone') as departed
    from public.follower_states
    where account_id = p_account_id and episode = 1 and is_latest_episode
      and status in ('present','gone') and tenure_days is not null
  ),
  dep_bucket as (
    select p.*, (select max(b.lo) from buckets b where b.lo <= p.age_days) as bucket_of_departure
    from population p
  ),
  per_cohort as (
    select cohort_week, b.lo as age_bucket,
      count(*) filter (where age_days >= b.lo) as at_risk,
      count(*) filter (where departed and bucket_of_departure = b.lo) as departed
    from dep_bucket, buckets b
    group by cohort_week, b.lo
  ),
  agg_all as (
    select '1900-01-01'::date as cohort_week, b.lo as age_bucket,
      count(*) filter (where age_days >= b.lo) as at_risk,
      count(*) filter (where departed and bucket_of_departure = b.lo) as departed
    from dep_bucket, buckets b
    group by b.lo
  )
  insert into public.hazard_curve (account_id, import_id, cohort_week, age_bucket, at_risk, departed, hazard_rate)
  select p_account_id, v_latest_import, cohort_week, age_bucket, at_risk, departed,
         case when at_risk = 0 then 0 else round(departed::numeric / at_risk, 4) end
  from (select * from per_cohort union all select * from agg_all) x
  where at_risk > 0;

  -- ==========================================================
  -- 6. acquisition_spikes — pic = jour où les arrivées quotidiennes
  -- (episode = 1, hors renommages) dépassent 3x la médiane glissante sur
  -- 14 jours. budget_eur, saisi à la main, est préservé à travers le
  -- recalcul (cf. plus bas).
  -- ==========================================================
  select
    count(*) filter (where sig_digit_suffix or sig_many_underscores or sig_long_handle)::numeric / nullif(count(*), 0),
    count(*) filter (where status = 'present')::numeric
      / nullif(count(*) filter (where status = 'present' or (status = 'gone' and is_latest_episode)), 0)
  into v_account_signal_share, v_account_survival_rate
  from public.follower_states where account_id = p_account_id and episode = 1 and status not in ('out_of_window', 'likely_rename');

  drop table if exists tmp_spikes;
  create temporary table tmp_spikes on commit drop as
  with daily as (
    select (followed_at at time zone 'UTC')::date as day, count(distinct profile_id) as arrivals
    from public.follower_states
    where account_id = p_account_id and episode = 1 and status <> 'likely_rename'
    group by (followed_at at time zone 'UTC')::date
  ),
  with_median as (
    select day, arrivals,
      (select percentile_cont(0.5) within group (order by d2.arrivals)
         from daily d2 where d2.day between d.day - 13 and d.day)::numeric as rolling_median
    from daily d
  ),
  flagged as (
    select day, arrivals, rolling_median, (rolling_median > 0 and arrivals > 3 * rolling_median) as is_spike
    from with_median
  ),
  islands as (
    select *,
      day - (row_number() over (partition by is_spike order by day))::int as island
    from flagged
  ),
  episodes as (
    select
      min(day) as spike_start, max(day) as spike_end, count(*) as duration_days,
      sum(arrivals) as volume, avg(rolling_median) as baseline_daily, max(arrivals) as peak_arrivals
    from islands where is_spike group by island
  )
  select e.*,
    round(e.peak_arrivals::numeric / nullif(e.baseline_daily, 0), 2) as multiple,
    (case
      when e.duration_days <= 1 then 'pic_court'
      when e.volume::numeric / e.duration_days <= 1.5 * (e.baseline_daily * 3) then 'plateau'
      else 'rampe'
    end) as shape
  from episodes e;

  drop table if exists tmp_spike_signals;
  create temporary table tmp_spike_signals on commit drop as
  select ts.*,
    (select count(*) filter (where extract(hour from fs.followed_at at time zone 'Europe/Paris') between 0 and 6)::numeric
       / nullif(count(*), 0)
       from public.follower_states fs
      where fs.account_id = p_account_id and fs.episode = 1
        and (fs.followed_at at time zone 'UTC')::date between ts.spike_start and ts.spike_end
    ) as night_share,
    (select count(*) filter (where fs.sig_digit_suffix or fs.sig_many_underscores or fs.sig_long_handle)::numeric
       / nullif(count(*), 0)
       from public.follower_states fs
      where fs.account_id = p_account_id and fs.episode = 1
        and (fs.followed_at at time zone 'UTC')::date between ts.spike_start and ts.spike_end
    ) as signal_share,
    (select count(*) filter (where fs.status = 'present')::numeric / nullif(count(*), 0)
       from public.follower_states fs
      where fs.account_id = p_account_id and fs.episode = 1
        and (fs.followed_at at time zone 'UTC')::date between ts.spike_start and ts.spike_end
    ) as retention_rate
  from tmp_spikes ts;

  drop table if exists tmp_spike_budgets;
  create temporary table tmp_spike_budgets on commit drop as
  select spike_start, budget_eur from public.acquisition_spikes where account_id = p_account_id and budget_eur is not null;

  delete from public.acquisition_spikes where account_id = p_account_id;

  insert into public.acquisition_spikes (
    account_id, import_id, spike_start, spike_end, volume, baseline_daily, multiple, shape,
    night_share, signal_share, retention_rate, inferred_type, inference_confidence, budget_eur
  )
  select
    p_account_id, v_latest_import, ts.spike_start, ts.spike_end, ts.volume, round(ts.baseline_daily, 2), ts.multiple, ts.shape,
    round(coalesce(ts.night_share, 0) * 100, 2), round(coalesce(ts.signal_share, 0) * 100, 2), ts.retention_rate,
    (case
      when ts.shape = 'plateau' and ts.duration_days > 3 and ts.retention_rate < coalesce(v_account_survival_rate, 1)
        then 'probable_paid'
      when ts.shape = 'pic_court' and ts.duration_days < 2 and ts.retention_rate >= coalesce(v_account_survival_rate, 0)
        then 'probable_viral'
      when coalesce(ts.night_share, 0) > 0.45 and coalesce(ts.signal_share, 0) > 2 * coalesce(v_account_signal_share, 0)
        then 'probable_automated'
      else 'indetermine'
    end),
    (case
      when ts.duration_days is null then 'insuffisant'
      when ts.volume < 20 then 'insuffisant'
      else 'indicatif'
    end),
    tb.budget_eur
  from tmp_spike_signals ts
  left join tmp_spike_budgets tb on tb.spike_start = ts.spike_start;

  update public.cohorts c set is_spike_period = true
   where c.account_id = p_account_id
     and exists (
       select 1 from public.acquisition_spikes asp
        where asp.account_id = p_account_id
          and c.cohort_week between date_trunc('week', asp.spike_start)::date and date_trunc('week', asp.spike_end)::date
     );

  -- ==========================================================
  -- 7. content_attribution (§3.1)
  -- ==========================================================
  with daily as (
    select (followed_at at time zone 'UTC')::date as day, count(distinct profile_id) as arrivals
    from public.follower_states where account_id = p_account_id and episode = 1 and status <> 'likely_rename'
    group by (followed_at at time zone 'UTC')::date
  ),
  pubs as (
    select c.id as content_id, c.published_at,
      (select coalesce(sum(d.arrivals), 0) from daily d
        where d.day between c.published_at::date and (c.published_at + interval '48 hours')::date) as arrivals_48h,
      (select percentile_cont(0.5) within group (order by d.arrivals)
         from daily d where d.day between (c.published_at::date - 14) and (c.published_at::date - 1))::numeric as median_daily
    from public.content c where c.account_id = p_account_id
  )
  insert into public.content_attribution (
    content_id, account_id, import_id, arrivals_in_window, baseline_expected, excess_arrivals,
    retained_at_horizon, retention_rate, confidence
  )
  select
    p.content_id, p_account_id, v_latest_import, p.arrivals_48h,
    round(coalesce(p.median_daily, 0) * 2, 2),
    greatest(0, p.arrivals_48h - round(coalesce(p.median_daily, 0) * 2))::int,
    null, null,
    case when greatest(0, p.arrivals_48h - round(coalesce(p.median_daily, 0) * 2)) < 20 then 'insuffisant' else 'indicatif' end
  from pubs p;

  -- ==========================================================
  -- 8. cross_analyses + inflow_geo_estimate
  -- ==========================================================
  if not exists (select 1 from public.content where account_id = p_account_id) then
    insert into public.cross_analyses (account_id, import_id, code, dimension, payload, sample_size, confidence, confidence_reason)
    values
      (p_account_id, v_latest_import, 'territory_retention', '', '{}'::jsonb, 0, 'insuffisant', 'contenu non encore importé'),
      (p_account_id, v_latest_import, 'format_retention', '', '{}'::jsonb, 0, 'insuffisant', 'contenu non encore importé'),
      (p_account_id, v_latest_import, 'cadence_vs_churn', '', '{}'::jsonb, 0, 'insuffisant', 'contenu non encore importé');
  end if;

  with per_cohort as (
    select fs.cohort_week,
      (select cs.rate_at_horizon from public.cohort_survival cs
        where cs.account_id = p_account_id and cs.cohort_week = fs.cohort_week and cs.measured_import_id = v_latest_import) as survival_at_horizon,
      (select percentile_cont(0.5) within group (order by fs2.tenure_days)
         from public.follower_states fs2
        where fs2.account_id = p_account_id and fs2.episode = 1 and fs2.is_latest_episode
          and fs2.cohort_week = fs.cohort_week and fs2.status = 'gone')::numeric as med_tenure_gone,
      count(*) filter (where not (fs.sig_digit_suffix or fs.sig_many_underscores or fs.sig_long_handle))::numeric / count(*) as no_signal_share,
      count(*) filter (where extract(hour from fs.followed_at at time zone 'Europe/Paris') between 7 and 22)::numeric / count(*) as daytime_share,
      count(*) as n
    from public.follower_states fs
    where fs.account_id = p_account_id and fs.episode = 1 and fs.status not in ('out_of_window', 'likely_rename')
    group by fs.cohort_week
  ),
  bounds as (
    select min(med_tenure_gone) as min_tenure, max(med_tenure_gone) as max_tenure from per_cohort
  ),
  normalized as (
    select pc.*,
      coalesce(pc.survival_at_horizon, 0) * 100 as norm_survival,
      case
        when pc.med_tenure_gone is null then null
        when b.max_tenure = b.min_tenure then 50
        else round((pc.med_tenure_gone - b.min_tenure) / (b.max_tenure - b.min_tenure) * 100, 2)
      end as norm_tenure,
      pc.no_signal_share * 100 as norm_signal,
      pc.daytime_share * 100 as norm_daytime
    from per_cohort pc, bounds b
  )
  insert into public.cross_analyses (account_id, import_id, code, dimension, payload, sample_size, confidence, confidence_reason)
  select
    p_account_id, v_latest_import, 'cohort_quality_score', n.cohort_week::text,
    jsonb_build_object(
      'score', round(0.45 * n.norm_survival + 0.20 * coalesce(n.norm_tenure, 50) + 0.20 * n.norm_signal + 0.15 * n.norm_daytime),
      'survie_horizon', n.norm_survival, 'anciennete_depart', n.norm_tenure,
      'sans_signal', n.norm_signal, 'diurne_europe', n.norm_daytime
    ),
    n.n,
    case when n.n >= 50 then 'robuste' when n.n >= 20 then 'indicatif' else 'insuffisant' end,
    case when n.n < 20 then 'cohorte trop petite (n = ' || n.n || ')' end
  from normalized n;

  if v_prev_import is not null then
    insert into public.inflow_geo_estimate (account_id, import_id, country, estimated_pct, error_margin, confidence)
    with prev_geo as (
      select name, pct from public.audience_geo where account_id = p_account_id and import_id = v_prev_import and kind = 'country'
    ),
    latest_geo as (
      select name, pct from public.audience_geo where account_id = p_account_id and import_id = v_latest_import and kind = 'country'
    ),
    totals as (
      select
        (select followers_total from public.audience_insights where account_id = p_account_id and import_id = v_prev_import) as total_prev,
        (select followers_total from public.audience_insights where account_id = p_account_id and import_id = v_latest_import) as total_latest,
        (select count(*) from public.follower_states where account_id = p_account_id and episode = 1 and first_import_id = v_latest_import) as arrivals,
        (select count(*) from public.follower_states where account_id = p_account_id and status = 'gone' and is_latest_episode and departure_window_end = v_latest_at) as departures
    ),
    combined as (
      select coalesce(l.name, p.name) as country, coalesce(l.pct, 0) as pct_latest, coalesce(p.pct, 0) as pct_prev
      from latest_geo l full outer join prev_geo p on p.name = l.name
    )
    select
      p_account_id, v_latest_import, c.country,
      round(greatest(0, least(100,
        ((c.pct_latest / 100 * t.total_latest) - (c.pct_prev / 100 * t.total_prev) + (c.pct_prev / 100 * t.departures))
        / nullif(t.arrivals, 0) * 100
      )), 2),
      round(least(15, greatest(3, (t.departures::numeric / nullif(t.arrivals, 0)) * 30)), 2),
      'indicatif'
    from combined c, totals t
    where t.arrivals is not null and t.arrivals > 0 and t.total_prev is not null and t.total_latest is not null;
  end if;

  with series as (
    select ri.import_id, ri.non_follower_reach_pct,
      (select cs.rate_at_horizon from public.cohort_survival cs
        join public.cohorts co on co.account_id = ri.account_id and co.cohort_week = cs.cohort_week
        where cs.account_id = ri.account_id and co.origin_import_id = ri.import_id and cs.measured_import_id = v_latest_import
        limit 1) as cohort_survival_rate
    from public.reach_insights ri where ri.account_id = p_account_id
  ),
  ranked as (
    select *, rank() over (order by non_follower_reach_pct) as r1, rank() over (order by cohort_survival_rate) as r2
    from series where non_follower_reach_pct is not null and cohort_survival_rate is not null
  ),
  stats as (
    select count(*) as n, corr(r1::numeric, r2::numeric) as rho from ranked
  )
  insert into public.cross_analyses (account_id, import_id, code, dimension, payload, sample_size, confidence, confidence_reason)
  select p_account_id, v_latest_import, 'reach_quality', '',
    jsonb_build_object('coefficient_rang', round(coalesce(s.rho, 0)::numeric, 3), 'n', s.n),
    s.n, case when s.n >= 4 then 'indicatif' else 'insuffisant' end,
    case when s.n < 4 then 'moins de 4 imports avec portée mesurée (n = ' || s.n || ')' end
  from stats s;

  if exists (select 1 from public.ecosystem_profiles where account_id = p_account_id) then
    insert into public.cross_analyses (account_id, import_id, code, dimension, payload, sample_size, confidence, confidence_reason)
    select p_account_id, v_latest_import, 'ecosystem_retention', coalesce(ep.audience_bucket::text, 'inconnu'),
      jsonb_build_object(
        'survie_professionnels', round(avg(case when fs.status = 'present' then 1.0 else 0.0 end), 4),
        'survie_globale', v_account_survival_rate
      ),
      count(*), case when count(*) >= 30 then 'indicatif' else 'insuffisant' end,
      case when count(*) < 30 then 'moins de 30 comptes professionnels (n = ' || count(*) || ')' end
    from public.ecosystem_profiles ep
    join public.follower_states fs on fs.account_id = ep.account_id and fs.profile_id = ep.profile_id and fs.episode = 1
    where ep.account_id = p_account_id and (ep.is_creator or ep.is_brand or ep.is_verified)
    group by ep.audience_bucket;
  else
    insert into public.cross_analyses (account_id, import_id, code, dimension, payload, sample_size, confidence, confidence_reason)
    values (p_account_id, v_latest_import, 'ecosystem_retention', '', '{}'::jsonb, 0, 'insuffisant', 'écosystème non encore importé');
  end if;

  if v_prev_import is not null then
    with removed as (
      select fs2.profile_id, fs2.removed_between_start, fs2.removed_between_end
      from public.following_states fs2
      where fs2.account_id = p_account_id and fs2.status = 'removed'
    ),
    reciprocal as (
      select r.profile_id,
        exists (
          select 1 from public.follower_states fl
           where fl.account_id = p_account_id and fl.profile_id = r.profile_id and fl.status = 'gone' and fl.is_latest_episode
             and fl.departure_window_start >= r.removed_between_start
        ) as boomeranged
      from removed r
    ),
    reference as (
      select
        (select count(*) from public.follower_states where account_id = p_account_id and status = 'gone' and is_latest_episode
          and departure_window_start = v_prev_at and departure_window_end = v_latest_at) as ref_departed,
        (select count(*) from public.follower_states where account_id = p_account_id and status in ('present','gone')
          and followed_at <= v_prev_at) as ref_population
    )
    insert into public.cross_analyses (account_id, import_id, code, dimension, payload, sample_size, confidence, confidence_reason)
    select p_account_id, v_latest_import, 'unfollow_boomerang', '',
      jsonb_build_object(
        'taux_reciprocite', round(count(*) filter (where rc.boomeranged)::numeric / nullif(count(*), 0), 4),
        'taux_depart_reference', round(ref.ref_departed::numeric / nullif(ref.ref_population, 0), 4)
      ),
      count(*), case when count(*) >= 30 then 'indicatif' else 'insuffisant' end,
      case when count(*) < 30 then 'moins de 30 désabonnements observés (n = ' || count(*) || ')' end
    from reciprocal rc, reference ref
    group by ref.ref_departed, ref.ref_population;
  end if;

  -- ==========================================================
  -- 9. reconciliation — observed_departures ne compte que le dernier
  -- épisode de chaque profil (un profil reparti n'est plus « parti »).
  -- ==========================================================
  insert into public.reconciliation (
    import_id, account_id, meta_gained, observed_arrivals, arrivals_coverage,
    meta_lost, observed_departures, departures_coverage, unobservable_reason
  )
  select
    ai.import_id, p_account_id, ai.followers_gained,
    (select count(*) from public.follower_states where account_id = p_account_id and episode = 1 and first_import_id = ai.import_id),
    round((select count(*) from public.follower_states where account_id = p_account_id and episode = 1 and first_import_id = ai.import_id)::numeric
          / nullif(ai.followers_gained, 0), 4),
    ai.followers_lost,
    (select count(*) from public.follower_states where account_id = p_account_id and status = 'gone' and is_latest_episode
       and departure_window_end = (select exported_at from tmp_imports where id = ai.import_id)),
    round((select count(*) from public.follower_states where account_id = p_account_id and status = 'gone' and is_latest_episode
       and departure_window_end = (select exported_at from tmp_imports where id = ai.import_id))::numeric
          / nullif(ai.followers_lost, 0), 4),
    'la fenêtre glissante de l''export ne couvre pas les abonnés anciens : la couverture réelle croît avec l''historique cumulé, cf. addendum §4'
  from public.audience_insights ai
  where ai.account_id = p_account_id;

end;
$$;

revoke execute on function public.recompute_account(uuid) from public, anon, authenticated;
grant execute on function public.recompute_account(uuid) to service_role;
