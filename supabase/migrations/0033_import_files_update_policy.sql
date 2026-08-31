-- Bug réel, introduit par 0031 : celle-ci ne posait qu'une politique INSERT
-- sur import_files, gardée par status = 'uploading'. La fonctionnalité de
-- nouvelle tentative ciblée (retryFailedImportFiles, cette session) réécrit
-- des lignes déjà existantes (upsert sur le conflit de la contrainte unique
-- import_id/source_path) pour un import déjà 'completed' — c'est donc
-- toujours une UPDATE, jamais couverte, jamais autorisée. Même défaut
-- exact que storage.objects (0032), sur la table plutôt que le bucket.
--
-- Pas de restriction sur le statut de l'import ici, contrairement à
-- l'INSERT : la nouvelle tentative existe précisément pour corriger des
-- fichiers après que process-import a déjà tourné une première fois.
create policy "import_files_update" on public.import_files
  for update using (
    exists (
      select 1 from public.imports i
      where i.id = import_id and public.can_write_account(i.account_id)
    )
  )
  with check (
    exists (
      select 1 from public.imports i
      where i.id = import_id and public.can_write_account(i.account_id)
    )
  );
