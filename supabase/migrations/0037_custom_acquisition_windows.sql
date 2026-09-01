-- Community Intelligence — Acquisition : périodes personnalisées.
--
-- Les pics d'acquisition (acquisition_spikes) sont détectés par le moteur
-- (jamais saisis) : c'est le mode par défaut, sans extrapolation. Cette
-- table ajoute un second mode, explicitement manuel, pour l'agence qui
-- veut chiffrer une campagne dont elle connaît les dates exactes même si
-- le moteur n'y a pas détecté de pic statistique (montée trop lente,
-- volume trop faible pour franchir le seuil de détection, etc.).
create table public.custom_acquisition_windows (
  id            uuid primary key default gen_random_uuid(),
  account_id    uuid not null references public.instagram_accounts(id) on delete cascade,
  label         text,
  window_start  date not null,
  window_end    date not null,
  budget_eur    numeric,
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  check (window_end >= window_start)
);

create index on public.custom_acquisition_windows (account_id, window_start);

alter table public.custom_acquisition_windows enable row level security;

create policy "custom_acquisition_windows_read" on public.custom_acquisition_windows
  for select using (account_id in (select public.user_account_ids()));
create policy "custom_acquisition_windows_insert" on public.custom_acquisition_windows
  for insert with check (public.can_write_account(account_id));
create policy "custom_acquisition_windows_update" on public.custom_acquisition_windows
  for update using (public.can_write_account(account_id)) with check (public.can_write_account(account_id));
create policy "custom_acquisition_windows_delete" on public.custom_acquisition_windows
  for delete using (public.can_write_account(account_id));

-- Volume et rétention sur la période, avec la même méthode que
-- acquisition_spikes.retention_rate (0017/0018/0019) : statut 'present'
-- au moment du dernier recalcul, jamais projeté au-delà. episode = 1 et
-- l'exclusion out_of_window/likely_rename reprennent exactement le
-- filtre déjà utilisé pour les cohortes (0009+).
create or replace function public.custom_window_stats(p_account_id uuid, p_window_start date, p_window_end date)
returns table (volume bigint, retained bigint)
language sql stable set search_path = public as $$
  select count(*) as volume,
         count(*) filter (where status = 'present') as retained
    from public.follower_states
   where account_id = p_account_id
     and episode = 1
     and status not in ('out_of_window', 'likely_rename')
     and (followed_at at time zone 'UTC')::date between p_window_start and p_window_end;
$$;

revoke execute on function public.custom_window_stats(uuid, date, date) from public, anon;
grant execute on function public.custom_window_stats(uuid, date, date) to authenticated;
