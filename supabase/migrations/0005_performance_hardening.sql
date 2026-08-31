-- Community Intelligence — Lot 1 — Durcissement suite aux advisors Supabase
-- (performance). Index de clés étrangères manquants, et policies "for all"
-- qui dupliquaient l'évaluation du SELECT avec la policy *_read dédiée.

create index on public.audit_log (account_id);
create index on public.audit_log (user_id);
create index on public.brand_members (user_id);
create index on public.organization_members (user_id);

drop policy "brands_write" on public.brands;
create policy "brands_insert" on public.brands
  for insert with check (public.can_manage_org(org_id));
create policy "brands_update" on public.brands
  for update using (public.can_manage_org(org_id)) with check (public.can_manage_org(org_id));
create policy "brands_delete" on public.brands
  for delete using (public.can_manage_org(org_id));

drop policy "brand_members_write" on public.brand_members;
create policy "brand_members_insert" on public.brand_members
  for insert with check (
    exists (select 1 from public.brands b where b.id = brand_id and public.can_manage_org(b.org_id))
  );
create policy "brand_members_update" on public.brand_members
  for update using (
    exists (select 1 from public.brands b where b.id = brand_id and public.can_manage_org(b.org_id))
  ) with check (
    exists (select 1 from public.brands b where b.id = brand_id and public.can_manage_org(b.org_id))
  );
create policy "brand_members_delete" on public.brand_members
  for delete using (
    exists (select 1 from public.brands b where b.id = brand_id and public.can_manage_org(b.org_id))
  );

drop policy "instagram_accounts_write" on public.instagram_accounts;
create policy "instagram_accounts_insert" on public.instagram_accounts
  for insert with check (public.can_write(brand_id));
create policy "instagram_accounts_update" on public.instagram_accounts
  for update using (public.can_write(brand_id)) with check (public.can_write(brand_id));
create policy "instagram_accounts_delete" on public.instagram_accounts
  for delete using (public.can_write(brand_id));
