-- Community Intelligence — reveal_usernames() ne vérifiait que
-- l'appartenance au compte (user_account_ids()), pas can_view_identities.
-- Un brand_viewer sans autorisation explicite pouvait donc déjà appeler la
-- fonction et obtenir de vrais pseudonymes — trouvé en câblant l'écran
-- Croissance ("Derniers départs") sur cette fonction, corrigé avant tout
-- branchement d'UI dessus plutôt qu'après.
--
-- Règle : le personnel agence (platform_admin/agency_admin/agency_member)
-- voit toujours les identités des comptes auxquels il a accès. Un
-- brand_viewer ne les voit que si can_view_identities est explicitement
-- activé pour lui sur cette marque (cf. le bouton "Autoriser l'accès aux
-- identités" du gabarit de design, Community Intelligence.dc.html ~L1031).

create or replace function public.can_view_identities(p_account uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.instagram_accounts a
      join public.brands b on b.id = a.brand_id
      join public.organization_members om on om.org_id = b.org_id
     where a.id = p_account and om.user_id = auth.uid()
       and om.role in ('platform_admin', 'agency_admin', 'agency_member')
  ) or exists (
    select 1 from public.instagram_accounts a
      join public.brand_members bm on bm.brand_id = a.brand_id
     where a.id = p_account and bm.user_id = auth.uid() and bm.can_view_identities
  );
$$;

create or replace function public.reveal_usernames(p_account uuid, p_ids bigint[])
returns table (profile_id bigint, username text)
language plpgsql security definer set search_path = public as $$
begin
  if p_account not in (select public.user_account_ids()) then
    raise exception 'Accès refusé';
  end if;
  if not public.can_view_identities(p_account) then
    raise exception 'Accès aux identités non autorisé pour ce rôle';
  end if;

  insert into public.audit_log (user_id, account_id, action, target_count)
       values (auth.uid(), p_account, 'reveal_usernames', array_length(p_ids,1));

  return query
    select p.profile_id, p.username
      from private_identity.profiles p
     where p.profile_id = any(p_ids) and p.erased_at is null;
end $$;
