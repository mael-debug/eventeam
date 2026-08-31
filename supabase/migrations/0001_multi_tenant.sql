-- Community Intelligence — Lot 1 — Socle multi-tenant
-- PRD §6.2. Organisations, marques, comptes Instagram, appartenances, RLS.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  created_at  timestamptz not null default now()
);

create table public.brands (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  name        text not null,
  slug        text not null,
  created_at  timestamptz not null default now(),
  unique (org_id, slug)
);

create table public.instagram_accounts (
  id            uuid primary key default gen_random_uuid(),
  brand_id      uuid not null references public.brands(id) on delete cascade,
  handle        text not null,
  display_name  text,
  ig_fbid       text,
  import_cadence text not null default 'monthly'
                 check (import_cadence in ('weekly','monthly','quarterly')),
  created_at    timestamptz not null default now(),
  unique (brand_id, handle)
);

create type public.member_role as enum
  ('platform_admin','agency_admin','agency_member','brand_viewer');

create table public.organization_members (
  org_id      uuid not null references public.organizations(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        public.member_role not null,
  created_at  timestamptz not null default now(),
  primary key (org_id, user_id)
);

create table public.brand_members (
  brand_id             uuid not null references public.brands(id) on delete cascade,
  user_id              uuid not null references auth.users(id) on delete cascade,
  role                 public.member_role not null default 'brand_viewer',
  can_view_identities  boolean not null default false,
  created_at           timestamptz not null default now(),
  primary key (brand_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Fonctions d'aide pour les policies (security definer, pour éviter la
-- récursion RLS). §6.2 + extensions nécessaires à l'onboarding et au rôle
-- platform_admin (accès transverse, cf. §3).
-- ---------------------------------------------------------------------------

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members m
     where m.user_id = auth.uid() and m.role = 'platform_admin'
  );
$$;

create or replace function public.user_org_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select o.id from public.organizations o
   where public.is_platform_admin()
      or exists (
        select 1 from public.organization_members m
         where m.org_id = o.id and m.user_id = auth.uid()
      );
$$;

create or replace function public.user_brand_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select b.id from public.brands b
   where public.is_platform_admin()
      or b.org_id in (select public.user_org_ids())
      or exists (
        select 1 from public.brand_members bm
         where bm.brand_id = b.id and bm.user_id = auth.uid()
      );
$$;

create or replace function public.user_account_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select a.id from public.instagram_accounts a
   where a.brand_id in (select public.user_brand_ids());
$$;

create or replace function public.can_manage_org(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_platform_admin() or exists (
    select 1 from public.organization_members m
     where m.org_id = p_org and m.user_id = auth.uid()
       and m.role in ('platform_admin','agency_admin')
  );
$$;

create or replace function public.can_write(p_brand uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.brands b
      join public.organization_members m on m.org_id = b.org_id
     where b.id = p_brand and m.user_id = auth.uid()
       and m.role in ('platform_admin','agency_admin','agency_member')
  );
$$;

-- Crée une organisation et rattache son créateur comme agency_admin, en une
-- seule transaction atomique. Seul point d'entrée pour la création d'une
-- organisation : aucune policy d'insertion directe n'est ouverte sur
-- organizations / organization_members (cf. onboarding, §8.1).
create or replace function public.create_organization(p_name text, p_slug text)
returns public.organizations
language plpgsql security definer set search_path = public as $$
declare v_org public.organizations;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  insert into public.organizations (name, slug) values (p_name, p_slug)
  returning * into v_org;

  insert into public.organization_members (org_id, user_id, role)
       values (v_org.id, auth.uid(), 'agency_admin');

  return v_org;
end $$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.brands enable row level security;
alter table public.instagram_accounts enable row level security;
alter table public.organization_members enable row level security;
alter table public.brand_members enable row level security;

create policy "organizations_read" on public.organizations
  for select using (id in (select public.user_org_ids()));

create policy "organizations_update" on public.organizations
  for update using (public.can_manage_org(id));

create policy "organization_members_read" on public.organization_members
  for select using (org_id in (select public.user_org_ids()));

create policy "brands_read" on public.brands
  for select using (id in (select public.user_brand_ids()));

create policy "brands_write" on public.brands
  for all using (public.can_manage_org(org_id))
  with check (public.can_manage_org(org_id));

create policy "brand_members_read" on public.brand_members
  for select using (brand_id in (select public.user_brand_ids()));

create policy "brand_members_write" on public.brand_members
  for all using (
    exists (
      select 1 from public.brands b
       where b.id = brand_id and public.can_manage_org(b.org_id)
    )
  )
  with check (
    exists (
      select 1 from public.brands b
       where b.id = brand_id and public.can_manage_org(b.org_id)
    )
  );

-- Patron de policy appliqué ici à instagram_accounts, à reproduire pour
-- toute table future portant account_id (§6.2).
create policy "instagram_accounts_read" on public.instagram_accounts
  for select using (id in (select public.user_account_ids()));

create policy "instagram_accounts_write" on public.instagram_accounts
  for all using (public.can_write(brand_id))
  with check (public.can_write(brand_id));
