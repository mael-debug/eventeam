-- Community Intelligence — Lot 3 — index de clés étrangères manquants
-- (suite aux advisors Supabase).

create index on public.cohort_survival (measured_import_id);
create index on public.cohorts (origin_import_id);
create index on public.follower_states (first_import_id);
create index on public.follower_states (last_present_import_id);
create index on public.imports (uploaded_by);
