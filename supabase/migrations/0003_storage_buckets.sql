-- Community Intelligence — Lot 1 — Buckets de stockage
-- PRD §5.2, §5.4, §7.1. Buckets privés, cloisonnés par compte Instagram.
-- Convention de chemin : {bucket}/{account_id}/... (account_id en premier
-- segment, utilisé par les policies ci-dessous).
--
-- media-thumbs est DORMANT depuis le 2026-09-03 : les exports désormais
-- déposés ne contiennent plus jamais media/**/*.{jpg,png,mp4} (régime
-- permanent) — plus aucun objet n'y est écrit (cf. thumbnail.ts et
-- uploadOneMediaFile() dans src/lib/ingestion/upload-import.ts, en-tête).
-- Conservé tel quel, pas supprimé : c'est la spec correcte le jour où un
-- export complet (avec media/) arrive à nouveau.

insert into storage.buckets (id, name, public)
values ('raw-exports', 'raw-exports', false),
       ('media-thumbs', 'media-thumbs', false)
on conflict (id) do nothing;

create or replace function public.can_write_account(p_account uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.instagram_accounts a
     where a.id = p_account and public.can_write(a.brand_id)
  );
$$;

create policy "raw_exports_read" on storage.objects
  for select using (
    bucket_id = 'raw-exports'
    and (storage.foldername(name))[1]::uuid in (select public.user_account_ids())
  );

create policy "raw_exports_write" on storage.objects
  for insert with check (
    bucket_id = 'raw-exports'
    and public.can_write_account((storage.foldername(name))[1]::uuid)
  );

create policy "media_thumbs_read" on storage.objects
  for select using (
    bucket_id = 'media-thumbs'
    and (storage.foldername(name))[1]::uuid in (select public.user_account_ids())
  );

create policy "media_thumbs_write" on storage.objects
  for insert with check (
    bucket_id = 'media-thumbs'
    and public.can_write_account((storage.foldername(name))[1]::uuid)
  );
