-- Community Intelligence — écran Journal de consultation. audit_log a déjà
-- sa policy de lecture scoped par compte (0002), mais afficher "qui" a
-- consulté suppose de résoudre user_id → email, et auth.users n'est pas
-- lisible par le rôle authenticated. Une fonction security definer,
-- suivant exactement le motif déjà établi par reveal_usernames : elle
-- revérifie elle-même l'appartenance au compte (jamais confiance dans une
-- vue security_invoker=false qui contournerait silencieusement la RLS
-- d'audit_log en s'exécutant avec les droits du propriétaire).
create or replace function public.audit_log_for_account(p_account uuid)
returns table (created_at timestamptz, user_email text, action text, target_count int)
language plpgsql security definer set search_path = public as $$
begin
  if p_account not in (select public.user_account_ids()) then
    raise exception 'Accès refusé';
  end if;

  return query
    select al.created_at, u.email::text, al.action, al.target_count
      from public.audit_log al
      left join auth.users u on u.id = al.user_id
     where al.account_id = p_account
     order by al.created_at desc
     limit 200;
end $$;

revoke execute on function public.audit_log_for_account(uuid) from public, anon;
grant execute on function public.audit_log_for_account(uuid) to authenticated;
