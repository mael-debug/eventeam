-- Écran Paramètres. brand_members_for_settings résout user_id -> email
-- (auth.users n'est pas lisible par authenticated), même motif que
-- audit_log_for_account (0028) : la fonction revérifie elle-même
-- l'appartenance, jamais confiance dans une vue security_invoker=false.
-- Combine organization_members (agence, accès à l'org entière) et
-- brand_members (marque, scoping par marque) — les deux tables réelles
-- listées dans la maquette ("Agence · accès complet" / "Marque · lecture
-- seule").
create or replace function public.brand_members_for_settings(p_brand_id uuid)
returns table (user_id uuid, email text, role public.member_role, can_view_identities boolean, scope text)
language plpgsql security definer set search_path = public as $$
declare
  v_org_id uuid;
begin
  select org_id into v_org_id from public.brands where id = p_brand_id;
  if v_org_id is null or p_brand_id not in (select public.user_brand_ids()) then
    raise exception 'Accès refusé';
  end if;

  return query
    select om.user_id, u.email::text, om.role, true as can_view_identities, 'org'::text as scope
      from public.organization_members om
      join auth.users u on u.id = om.user_id
     where om.org_id = v_org_id
    union all
    select bm.user_id, u.email::text, bm.role, bm.can_view_identities, 'brand'::text as scope
      from public.brand_members bm
      join auth.users u on u.id = bm.user_id
     where bm.brand_id = p_brand_id
    order by scope, email;
end $$;

revoke execute on function public.brand_members_for_settings(uuid) from public, anon;
grant execute on function public.brand_members_for_settings(uuid) to authenticated;

-- set_brand_identity_access : bascule can_view_identities pour un
-- brand_member. Réservé à l'agence (can_write) — c'est elle qui autorise
-- ou révoque l'accès aux identités pour le compte client, jamais la marque
-- elle-même.
create or replace function public.set_brand_identity_access(p_brand_id uuid, p_user_id uuid, p_enabled boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_write(p_brand_id) then
    raise exception 'Accès refusé';
  end if;
  update public.brand_members
     set can_view_identities = p_enabled
   where brand_id = p_brand_id and user_id = p_user_id;
end $$;

revoke execute on function public.set_brand_identity_access(uuid, uuid, boolean) from public, anon;
grant execute on function public.set_brand_identity_access(uuid, uuid, boolean) to authenticated;
