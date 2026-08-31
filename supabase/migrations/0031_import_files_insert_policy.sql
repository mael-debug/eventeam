-- Bug réel trouvé via le premier import client authentique de la session
-- (@edenparkparis) : aucune politique INSERT n'a jamais existé sur
-- public.import_files (0006 ne posait que import_files_read). Tout insert
-- côté client (authenticated), qu'il soit groupé ou fichier par fichier
-- comme depuis la correction précédente, a donc toujours été refusé par la
-- RLS — jamais exercé bout en bout avant ce vrai upload, les tests
-- précédents du moteur passant tous par service_role ou par des scripts.
--
-- Restreint sciemment à l'import parent encore au statut 'uploading' :
-- une fois passé en 'uploaded' (déclenche l'Edge Function, service_role),
-- le client ne doit plus pouvoir injecter de lignes import_files, même sur
-- un import qu'il possède — même logique de prudence que
-- enforce_import_status_transition() sur public.imports.
create policy "import_files_insert" on public.import_files
  for insert with check (
    exists (
      select 1 from public.imports i
      where i.id = import_id
        and i.status = 'uploading'
        and public.can_write_account(i.account_id)
    )
  );
