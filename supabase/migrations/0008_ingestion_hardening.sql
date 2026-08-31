-- Community Intelligence — Lot 2 — Durcissement suite aux advisors Supabase.
-- search_path mutable sur le trigger de transition de statut, et
-- ingest_resolve_usernames encore exécutable par anon/authenticated : ce
-- projet accorde apparemment EXECUTE aux rôles nommés anon/authenticated à
-- la création d'une fonction (au-delà du simple grant implicite à PUBLIC),
-- donc revoke ... from public ne suffit pas — il faut viser anon et
-- authenticated explicitement en plus de public.

alter function public.enforce_import_status_transition()
  set search_path = pg_catalog, public;

revoke execute on function public.ingest_resolve_usernames(text[]) from public, anon, authenticated;
grant execute on function public.ingest_resolve_usernames(text[]) to service_role;
