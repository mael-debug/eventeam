-- retry_recompute : relance le calcul des analyses (§4.10) pour un import
-- dont le PARSING a réussi (tous les fichiers 'parsed') mais dont le
-- recalcul asynchrone (migration 0046, job pg_cron run_pending_recomputes)
-- a échoué. Rien à ré-uploader : les données brutes sont déjà valides, il
-- suffit de repasser l'import à 'computing' pour que le prochain cycle de
-- cron (une minute au plus) le reprenne — recompute_account() repart
-- toujours de zéro (DELETE puis INSERT), donc rejouable sans risque.
--
-- Distinct de delete_stuck_import (0030, qui vise un import jamais atteint
-- par le serveur) : ici l'import a bien été traité par process-import
-- jusqu'au bout du parsing, seule l'étape suivante a échoué.
create or replace function public.retry_recompute(p_import_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_id uuid;
  v_status text;
  v_files_parsed int;
  v_files_expected int;
begin
  select account_id, status, files_parsed, files_expected
    into v_account_id, v_status, v_files_parsed, v_files_expected
  from public.imports where id = p_import_id;

  if v_account_id is null then
    raise exception 'Import introuvable';
  end if;
  if not public.can_write_account(v_account_id) then
    raise exception 'Non autorisé';
  end if;
  if v_status != 'failed' then
    raise exception 'Cet import n''est pas en échec, rien à relancer';
  end if;
  if v_files_expected is null or v_files_expected = 0 or v_files_parsed != v_files_expected then
    raise exception 'Le traitement des fichiers n''est pas terminé, utilisez plutôt le nouvel essai de fichiers en échec';
  end if;

  update public.imports set status = 'computing', error_message = null where id = p_import_id;
end;
$$;

revoke all on function public.retry_recompute(uuid) from public;
grant execute on function public.retry_recompute(uuid) to authenticated;
