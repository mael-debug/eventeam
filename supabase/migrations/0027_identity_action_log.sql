-- Community Intelligence — écran Listes : export CSV et demande
-- d'effacement journalisés, même garde que reveal_usernames (0025). Ne
-- fait PAS l'effacement lui-même : private_identity.profiles peut être
-- partagé entre plusieurs comptes (résolution de pseudo par nom
-- d'utilisateur), une suppression immédiate depuis un seul écran de
-- compte n'a pas la portée nécessaire pour être sûre. La demande est
-- journalisée pour traitement humain, pas exécutée automatiquement.
create or replace function public.log_identity_action(p_account uuid, p_action text, p_profile_ids bigint[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_account not in (select public.user_account_ids()) then
    raise exception 'Accès refusé';
  end if;
  if not public.can_view_identities(p_account) then
    raise exception 'Accès aux identités non autorisé pour ce rôle';
  end if;
  if p_action not in ('export_csv', 'erasure_requested') then
    raise exception 'Action inconnue';
  end if;

  insert into public.audit_log (user_id, account_id, action, target_count, metadata)
       values (auth.uid(), p_account, p_action, array_length(p_profile_ids, 1), jsonb_build_object('profile_ids', p_profile_ids));
end $$;

revoke execute on function public.log_identity_action(uuid, text, bigint[]) from public, anon;
grant execute on function public.log_identity_action(uuid, text, bigint[]) to authenticated;
