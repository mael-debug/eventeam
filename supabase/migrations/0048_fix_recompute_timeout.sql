-- Corrige un bug de la migration 0046 : `set local statement_timeout = '10min'`
-- exécuté À L'INTÉRIEUR de run_pending_recomputes() n'a AUCUN effet sur
-- l'appel en cours. Postgres arme le délai du statement_timeout une seule
-- fois, au début du statement de plus haut niveau (ici `select
-- run_pending_recomputes();` envoyé par pg_cron) — un SET exécuté pendant
-- l'exécution de CE MÊME statement ne peut pas prolonger rétroactivement un
-- délai déjà armé ; il ne s'applique qu'aux statements de plus haut niveau
-- suivants. Constaté en production le 2026-09-04 : le job pg_cron tourne
-- avec le rôle 'postgres', dont le statement_timeout par défaut est 2min
-- (et non les 10min voulus) — chaque cycle de recalcul du premier import du
-- compte "Eden Park All 2" a donc échoué à exactement 2min, en boucle,
-- depuis 08:15, sans jamais approcher les 10min prévues.
--
-- Correctif : le SET doit être un statement de plus haut niveau distinct,
-- exécuté AVANT l'appel à la fonction — donc dans la commande du job
-- pg_cron elle-même (pg_cron exécute un texte multi-statements comme des
-- statements de haut niveau séparés dans une même transaction implicite),
-- pas dans le corps de la fonction.
create or replace function public.run_pending_recomputes()
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  r record;
begin
  for r in
    select id, account_id from public.imports where status = 'computing' order by created_at asc
  loop
    if pg_try_advisory_xact_lock(hashtextextended(r.account_id::text, 0)) then
      begin
        perform public.recompute_account(r.account_id);
        update public.imports set status = 'completed', completed_at = now() where id = r.id;
      exception when others then
        update public.imports
           set status = 'failed', error_message = 'Recalcul (§4.10) : ' || sqlerrm
         where id = r.id;
      end;
    end if;
  end loop;
end;
$function$;

select cron.alter_job(
  job_id := (select jobid from cron.job where jobname = 'run-pending-recomputes'),
  command := $cron$SET statement_timeout = '10min'; SELECT public.run_pending_recomputes();$cron$
);
