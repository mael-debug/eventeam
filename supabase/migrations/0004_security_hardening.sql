-- Community Intelligence — Lot 1 — Durcissement suite aux advisors Supabase
-- Corrige : search_path mutable sur les fonctions private_identity, et
-- exécution des fonctions internes ouverte au rôle anon (non authentifié).
--
-- Note : Postgres accorde EXECUTE à PUBLIC par défaut à la création d'une
-- fonction, et le rôle anon en hérite. Il faut donc révoquer PUBLIC (pas
-- seulement anon) puis regrant explicitement authenticated.

alter function private_identity.hmac_username(text)
  set search_path = extensions, private_identity, pg_temp;

alter function private_identity.resolve(text)
  set search_path = extensions, private_identity, pg_temp;

revoke execute on function public.is_platform_admin() from public;
revoke execute on function public.user_org_ids() from public;
revoke execute on function public.user_brand_ids() from public;
revoke execute on function public.user_account_ids() from public;
revoke execute on function public.can_manage_org(uuid) from public;
revoke execute on function public.can_write(uuid) from public;
revoke execute on function public.can_write_account(uuid) from public;
revoke execute on function public.create_organization(text, text) from public;
revoke execute on function public.reveal_usernames(uuid, bigint[]) from public;

grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.user_org_ids() to authenticated;
grant execute on function public.user_brand_ids() to authenticated;
grant execute on function public.user_account_ids() to authenticated;
grant execute on function public.can_manage_org(uuid) to authenticated;
grant execute on function public.can_write(uuid) to authenticated;
grant execute on function public.can_write_account(uuid) to authenticated;
grant execute on function public.create_organization(text, text) to authenticated;
grant execute on function public.reveal_usernames(uuid, bigint[]) to authenticated;
