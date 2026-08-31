-- Toujours pas passé après 0033 : pour un INSERT ... ON CONFLICT DO UPDATE
-- (ce qu'est un upsert), Postgres exige que la ligne proposée passe le
-- WITH CHECK de la politique INSERT en plus de celui de la politique
-- UPDATE, même quand c'est finalement la branche UPDATE qui s'exécute
-- (documenté dans CREATE POLICY : « the WITH CHECK expressions of the
-- INSERT policies » s'appliquent toujours). La politique import_files_insert
-- de 0031, restreinte à status = 'uploading', bloquait donc systématiquement
-- toute nouvelle tentative sur un import déjà 'completed' — la politique
-- UPDATE ajoutée par 0033 ne suffisait pas seule.
--
-- Retire la restriction de statut : elle n'apportait qu'une prudence
-- superflue (can_write_account gouverne déjà correctement qui peut écrire),
-- et empêche directement la fonctionnalité de nouvelle tentative ciblée.
drop policy "import_files_insert" on public.import_files;

create policy "import_files_insert" on public.import_files
  for insert with check (
    exists (
      select 1 from public.imports i
      where i.id = import_id and public.can_write_account(i.account_id)
    )
  );
