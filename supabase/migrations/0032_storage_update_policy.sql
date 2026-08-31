-- Bug réel trouvé sur le premier import volumineux : 570 vignettes sur 896
-- échouaient avec « new row violates row-level security policy », un
-- message générique de refus RLS qui touchait cette fois storage.objects,
-- pas import_files. 0003 ne posait qu'une politique INSERT (+ SELECT) pour
-- les deux buckets — jamais UPDATE. uploadImport() appelle systématiquement
-- .upload(..., { upsert: true }) : pour tout chemin déjà présent en Storage
-- (un import précédent partiellement abandonné, comme les deux fois
-- précédentes de cette session, réutilise le même accountId + le même
-- chemin d'origine dans le ZIP puisque importId n'entre pas dans la clé des
-- vignettes), l'upsert devient une UPDATE côté Storage — bloquée faute de
-- politique. Les fichiers jamais uploadés avant passaient en pur INSERT et
-- réussissaient, d'où le mélange 326 succès / 570 échecs.
create policy "raw_exports_update" on storage.objects
  for update using (
    bucket_id = 'raw-exports'
    and public.can_write_account((storage.foldername(name))[1]::uuid)
  )
  with check (
    bucket_id = 'raw-exports'
    and public.can_write_account((storage.foldername(name))[1]::uuid)
  );

create policy "media_thumbs_update" on storage.objects
  for update using (
    bucket_id = 'media-thumbs'
    and public.can_write_account((storage.foldername(name))[1]::uuid)
  )
  with check (
    bucket_id = 'media-thumbs'
    and public.can_write_account((storage.foldername(name))[1]::uuid)
  );
