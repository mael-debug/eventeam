-- Community Intelligence — Lot 3 — correctif
-- Bug détecté en testant le réabonnement : cohort_survival recalculait le
-- statut "remaining" à chaque point de mesure en comparant directement la
-- dernière observation brute à la fenêtre de CE point de mesure. Pour un
-- profil absent depuis 2 imports ou plus, la fenêtre de recouvrement finit
-- par glisser au-delà de son followed_at d'origine, et son statut repasse
-- de "gone" (confirmé) à "out_of_window" (indéterminé) — un départ déjà
-- confirmé ne doit jamais redevenir "remaining" a posteriori.
--
-- Correctif : cohort_survival réutilise désormais les follower_states déjà
-- calculés (définitifs, par épisode) plutôt que de re-dériver la fenêtre de
-- recouvrement à chaque mesure. Pour chaque profil et chaque import de
-- mesure M, on prend l'épisode le plus récent dont le premier import est
-- <= M, et on regarde son statut :
--   - present         -> remaining (l'épisode va jusqu'au dernier import)
--   - out_of_window    -> remaining (jamais de départ confirmé, optimiste)
--   - gone             -> remaining seulement si M précède departure_window_end
-- Cela gère aussi correctement le réabonnement : l'épisode actif à M peut
-- changer d'un point de mesure à l'autre (gone puis, plus tard, present).

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

  -- cohort_survival : réutilise les follower_states définitifs (voir note
  -- de migration) plutôt que de re-dériver le chevauchement par mesure.
  with cohort_membership as (
    select profile_id, cohort_week, first_import_id as origin_import_id
    from public.follower_states
    where account_id = p_account_id and episode = 1 and status <> 'likely_rename'
  ),
  pairs as (
    select
      cm.profile_id, cm.cohort_week,
      mi.id as measured_import_id, mi.exported_at as measured_at
    from cohort_membership cm
    join tmp_imports origin on origin.id = cm.origin_import_id
    join tmp_imports mi on mi.exported_at >= origin.exported_at
  ),
  active_episode as (
    select
      p.*,
      fs.status,
      fs.departure_window_end
    from pairs p
    join lateral (
      select fs2.status, fs2.departure_window_end
        from public.follower_states fs2
        join tmp_imports fi on fi.id = fs2.first_import_id
       where fs2.account_id = p_account_id and fs2.profile_id = p.profile_id
         and fi.exported_at <= p.measured_at
       order by fi.exported_at desc
       limit 1
    ) fs on true
  ),
  remaining_flag as (
    select
      profile_id, cohort_week, measured_import_id, measured_at,
      (case
        when status = 'gone' then measured_at < departure_window_end
        else true -- present ou out_of_window : compté remaining (§4.2)
      end) as is_remaining
    from active_episode
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
    select
      d.day,
      d.arrivals,
      (select percentile_cont(0.5) within group (order by d2.arrivals)
         from daily d2
        where d2.day between d.day - 13 and d.day) as rolling_median
    from daily d
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
