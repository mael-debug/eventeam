-- delete_stuck_import : permet à l'agence de retirer un import abandonné
-- avant tout envoi côté serveur (page quittée pendant l'upload). Aucune
-- politique DELETE n'existait sur public.imports (voulu : un import ne doit
-- normalement jamais être supprimable une fois engagé). Le SECURITY DEFINER
-- ne contourne pas cette prudence : il ne supprime QUE si started_at IS NULL
-- (l'Edge Function ne l'a jamais atteint, cf. process-import/index.ts ligne
-- ~97 qui pose started_at dès son premier appel) — un import réellement en
-- traitement ou terminé ne peut donc jamais être supprimé par cette voie.
create or replace function public.delete_stuck_import(p_import_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_id uuid;
  v_status text;
  v_started_at timestamptz;
begin
  select account_id, status, started_at into v_account_id, v_status, v_started_at
  from public.imports where id = p_import_id;

  if v_account_id is null then
    raise exception 'Import introuvable';
  end if;
  if not public.can_write_account(v_account_id) then
    raise exception 'Non autorisé';
  end if;
  if v_status != 'uploading' or v_started_at is not null then
    raise exception 'Cet import a déjà été pris en charge par le serveur, il ne peut pas être supprimé ainsi';
  end if;

  delete from public.imports where id = p_import_id;
end;
$$;

revoke all on function public.delete_stuck_import(uuid) from public;
grant execute on function public.delete_stuck_import(uuid) to authenticated;
