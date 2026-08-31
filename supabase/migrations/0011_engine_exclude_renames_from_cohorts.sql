-- Community Intelligence — Lot 3 — correctif
-- Un profil détecté comme renommage présumé (§4.6) n'est pas une nouvelle
-- acquisition : il ne doit pas gonfler la taille d'une cohorte ni la série
-- quotidienne d'arrivées utilisée pour la détection de pics (§4.9). La
-- fonction initiale oubliait d'exclure le statut 'likely_rename' de ces
-- deux agrégations (uniquement de episode = 1, ce qui n'exclut pas les
-- renommages, détectés après coup sur des lignes episode = 1).

create or replace function public.recompute_account(p_account_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_has_imports boolean;
begin
  delete from public.follower_states where account_id = p_account_id;
  delete from public.following_states where account_id = p_account_id;
  delete from public.cohort_survival where account_id = p_account_id;
  delete from public.cohorts where account_id = p_account_id;

  select exists(
    select 1 from public.imports where account_id = p_account_id and status = 'completed'
  ) into v_has_imports;

  if not v_has_imports then
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
    (lead(id) over (w) is null) as is_latest
  from public.imports
  where account_id = p_account_id and status = 'completed'
  window w as (order by exported_at);

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
    profile_id,
    episode,
    followed_at,
    (array_agg(import_id order by exported_at asc))[1] as first_import_id,
    (array_agg(import_id order by exported_at desc))[1] as last_present_import_id
  from tmp_follower_episodes
  group by profile_id, episode, followed_at;

  insert into public.follower_states (
    account_id, profile_id, episode, followed_at, cohort_week,
    first_import_id, last_present_import_id, status,
    departure_window_start, departure_window_end, tenure_days,
    sig_digit_suffix, sig_many_underscores, sig_long_handle
  )
  select
    p_account_id,
    eb.profile_id,
    eb.episode,
    eb.followed_at,
    date_trunc('week', eb.followed_at at time zone 'UTC')::date,
    eb.first_import_id,
    eb.last_present_import_id,
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
    coalesce(pi.sig_digit_suffix, false),
    coalesce(pi.sig_many_underscores, false),
    coalesce(pi.sig_long_handle, false)
  from tmp_episode_bounds eb
  join tmp_imports a on a.id = eb.last_present_import_id
  left join private_identity.profiles pi on pi.profile_id = eb.profile_id;

  with renames as (
    select
      new_fs.profile_id as new_profile_id,
      new_fs.episode as new_episode,
      old_fs.profile_id as old_profile_id
    from public.follower_states new_fs
    join public.follower_states old_fs
      on old_fs.account_id = new_fs.account_id
     and old_fs.status = 'gone'
     and old_fs.followed_at = new_fs.followed_at
     and old_fs.departure_window_end = (
           select exported_at from tmp_imports where id = new_fs.first_import_id
         )
    where new_fs.account_id = p_account_id
      and new_fs.episode = 1
      and new_fs.status = 'present'
  )
  update public.follower_states fs
     set status = 'likely_rename', rename_candidate_of = r.old_profile_id
    from renames r
   where fs.account_id = p_account_id
     and fs.profile_id = r.new_profile_id
     and fs.episode = r.new_episode;

  drop table if exists tmp_following_latest;
  create temporary table tmp_following_latest on commit drop as
  select distinct on (fo.profile_id)
    fo.profile_id, fo.followed_at, ti.exported_at, ti.next_import_id, ti.next_exported_at
  from public.following_observations fo
  join tmp_imports ti on ti.id = fo.import_id
  where fo.account_id = p_account_id
  order by fo.profile_id, ti.exported_at desc;

  insert into public.following_states (
    account_id, profile_id, followed_at, status,
    removed_between_start, removed_between_end, is_mutual
  )
  select
    p_account_id, l.profile_id, l.followed_at,
    case when l.next_import_id is null then 'present' else 'removed' end,
    case when l.next_import_id is not null then l.exported_at end,
    case when l.next_import_id is not null then l.next_exported_at end,
    exists (
      select 1 from public.follower_states fs
       where fs.account_id = p_account_id and fs.profile_id = l.profile_id and fs.status = 'present'
    )
  from tmp_following_latest l;

  -- Un renommage présumé n'est pas une nouvelle acquisition : exclu des
  -- cohortes comme de la série d'arrivées quotidiennes (§4.6, §4.9).
  insert into public.cohorts (account_id, cohort_week, size, origin_import_id, is_spike_period)
  select
    p_account_id,
    fs.cohort_week,
    count(*),
    (array_agg(fs.first_import_id order by ti.exported_at asc))[1],
    false
  from public.follower_states fs
  join tmp_imports ti on ti.id = fs.first_import_id
  where fs.account_id = p_account_id and fs.episode = 1 and fs.status <> 'likely_rename'
  group by fs.cohort_week;

  with cohort_membership as (
    select profile_id, cohort_week, first_import_id as origin_import_id
    from public.follower_states
    where account_id = p_account_id and episode = 1 and status <> 'likely_rename'
  ),
  pairs as (
    select
      cm.profile_id, cm.cohort_week,
      mi.id as measured_import_id, mi.exported_at as measured_at,
      mi.window_start as m_window_start, mi.window_end as m_window_end
    from cohort_membership cm
    join tmp_imports origin on origin.id = cm.origin_import_id
    join tmp_imports mi on mi.exported_at >= origin.exported_at
  ),
  resolved as (
    select
      p.*,
      lp.import_id as last_present_import_id,
      lp.followed_at as last_followed_at,
      lp.window_start as last_window_start,
      lp.window_end as last_window_end,
      (p.measured_import_id = lp.import_id) as directly_present
    from pairs p
    left join lateral (
      select fo.import_id, fo.followed_at, ti2.window_start, ti2.window_end
        from public.follower_observations fo
        join tmp_imports ti2 on ti2.id = fo.import_id
       where fo.account_id = p_account_id and fo.profile_id = p.profile_id
         and ti2.exported_at <= p.measured_at
       order by ti2.exported_at desc
       limit 1
    ) lp on true
  ),
  remaining_flag as (
    select
      profile_id, cohort_week, measured_import_id, measured_at,
      (case
        when directly_present then true
        when last_present_import_id is null then false
        when last_followed_at between greatest(last_window_start, m_window_start)
                                    and least(last_window_end, m_window_end)
          then false
        else true
      end) as is_remaining
    from resolved
  )
  insert into public.cohort_survival (
    account_id, cohort_week, measured_import_id, measured_at,
    remaining, departed, survival_rate, exposure_days
  )
  select
    p_account_id, cohort_week, measured_import_id, measured_at,
    count(*) filter (where is_remaining),
    count(*) filter (where not is_remaining),
    round(count(*) filter (where is_remaining)::numeric / count(*), 4),
    extract(day from measured_at - cohort_week::timestamptz)::int
  from remaining_flag
  group by cohort_week, measured_import_id, measured_at;

  with daily as (
    select (followed_at at time zone 'UTC')::date as day, count(distinct profile_id) as arrivals
    from public.follower_states
    where account_id = p_account_id and episode = 1 and status <> 'likely_rename'
    group by (followed_at at time zone 'UTC')::date
  ),
  with_median as (
    select day, arrivals,
      percentile_cont(0.5) within group (order by arrivals)
        over (order by day rows between 13 preceding and current row) as rolling_median
    from daily
  ),
  spike_weeks as (
    select distinct date_trunc('week', day::timestamp)::date as cohort_week
    from with_median
    where rolling_median > 0 and arrivals > 3 * rolling_median
  )
  update public.cohorts c
     set is_spike_period = true
    from spike_weeks sw
   where c.account_id = p_account_id and c.cohort_week = sw.cohort_week;

end;
$$;
