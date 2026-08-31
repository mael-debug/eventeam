-- Community Intelligence — Lot 1 — Cloisonnement des identités
-- PRD §6.3 (private_identity), §6.11 (audit_log, dépendance de reveal_usernames).

create schema if not exists private_identity;

create table private_identity.profiles (
  profile_id     bigserial primary key,
  username       text not null,
  username_hmac  text not null unique,
  first_seen_at  timestamptz not null default now(),
  erased_at      timestamptz
);

create index on private_identity.profiles (username);

-- Aucune policy : RLS active, donc inaccessible hors service_role.
alter table private_identity.profiles enable row level security;

create or replace function private_identity.hmac_username(p_username text)
returns text language plpgsql stable security definer as $$
declare k text;
begin
  select decrypted_secret into k
    from vault.decrypted_secrets where name = 'username_hmac_key';
  if k is null then raise exception 'username_hmac_key absent du Vault'; end if;
  return encode(hmac(lower(trim(p_username)), k, 'sha256'), 'hex');
end $$;

-- Résout ou crée un profile_id. Seul point d'entrée depuis l'ingestion.
create or replace function private_identity.resolve(p_username text)
returns bigint language plpgsql security definer as $$
declare v_hmac text; v_id bigint;
begin
  v_hmac := private_identity.hmac_username(p_username);
  insert into private_identity.profiles (username, username_hmac)
       values (lower(trim(p_username)), v_hmac)
  on conflict (username_hmac) do nothing;
  select profile_id into v_id
    from private_identity.profiles where username_hmac = v_hmac;
  return v_id;
end $$;

-- Journal des actions sensibles (§6.11), dépendance de reveal_usernames.
create table public.audit_log (
  id           bigserial primary key,
  user_id      uuid references auth.users(id),
  account_id   uuid references public.instagram_accounts(id),
  action       text not null,
  target_count int,
  metadata     jsonb,
  created_at   timestamptz not null default now()
);

alter table public.audit_log enable row level security;

-- Chacun ne consulte que le journal des comptes auxquels il a accès.
create policy "audit_log_read" on public.audit_log
  for select using (account_id in (select public.user_account_ids()));

-- Résolution inverse, journalisée, réservée à l'export nominatif (§6.3/§8.6).
create or replace function public.reveal_usernames(p_account uuid, p_ids bigint[])
returns table (profile_id bigint, username text)
language plpgsql security definer set search_path = public as $$
begin
  if p_account not in (select public.user_account_ids()) then
    raise exception 'Accès refusé';
  end if;

  insert into public.audit_log (user_id, account_id, action, target_count)
       values (auth.uid(), p_account, 'reveal_usernames', array_length(p_ids,1));

  return query
    select p.profile_id, p.username
      from private_identity.profiles p
     where p.profile_id = any(p_ids) and p.erased_at is null;
end $$;
