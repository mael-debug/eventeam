-- Community Intelligence — Lot 2 — Résolution d'identité côté ingestion
-- PRD §6.3, §7.2 étape 4 : les signaux structurels du pseudo doivent être
-- calculés à l'ingestion, avant que le pseudo ne soit abandonné. Comme
-- follower_states (qui les affiche, §6.5) n'existe qu'au Lot 3, ils sont
-- calculés une fois ici, à la première apparition du profil, et stockés
-- dans private_identity.profiles (propriété typographique stable du pseudo,
-- pas l'identité elle-même — autorisé par §9.2). recompute_account (Lot 3)
-- les recopiera dans follower_states sans jamais lire le pseudo.

alter table private_identity.profiles
  add column sig_digit_suffix     boolean not null default false,
  add column sig_many_underscores boolean not null default false,
  add column sig_long_handle      boolean not null default false;

create or replace function private_identity.resolve(p_username text)
returns bigint language plpgsql security definer as $$
declare v_hmac text; v_id bigint; v_clean text;
begin
  v_clean := lower(trim(p_username));
  v_hmac := private_identity.hmac_username(v_clean);

  insert into private_identity.profiles (
    username, username_hmac, sig_digit_suffix, sig_many_underscores, sig_long_handle
  ) values (
    v_clean, v_hmac,
    v_clean ~ '[0-9]{2,}$',
    (length(v_clean) - length(replace(v_clean, '_', ''))) >= 2,
    length(v_clean) >= 20
  )
  on conflict (username_hmac) do nothing;

  select profile_id into v_id
    from private_identity.profiles where username_hmac = v_hmac;
  return v_id;
end $$;

alter function private_identity.resolve(text)
  set search_path = extensions, private_identity, pg_temp;

-- Seul point d'entrée exposé à l'ingestion (service_role) : résout en masse
-- une liste de pseudos sans jamais exposer tout le schéma private_identity
-- via l'API REST. Dédoublonne côté appelant.
create or replace function public.ingest_resolve_usernames(p_usernames text[])
returns table (username text, profile_id bigint)
language plpgsql security definer set search_path = public as $$
begin
  return query
    select u, private_identity.resolve(u)
      from unnest(p_usernames) as u;
end $$;

revoke execute on function public.ingest_resolve_usernames(text[]) from public;
grant execute on function public.ingest_resolve_usernames(text[]) to service_role;
