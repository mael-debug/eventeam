-- Community Intelligence — §14 (proposé) : détection des dérives de format.
--
-- Motivation : les parseurs (Lot 2/3/5) reposent sur des libellés Meta
-- confirmés contre des exports réels, mais codés en dur dans le TypeScript.
-- Si Meta change un libellé (traduction, reformulation, ajout d'un champ),
-- l'échec est silencieux : findByPrefix/findExact renvoient simplement
-- null, la métrique disparaît sans erreur ni alerte. Ce filet donne trois
-- garde-fous :
--
-- 1. parser_label_map — la correspondance libellé Meta -> champ interne
--    vit en base, pas seulement dans le code. Elle documente ce que le
--    produit s'attend à voir, et sert de référence pour détecter les
--    clés inconnues (§2 ci-dessous).
--    Portée actuelle : ce sont les patterns déjà validés contre un export
--    réel (parse-insights.ts pour audience_insights, parse-posts.ts pour
--    posts.json). Les parseurs eux-mêmes continuent d'utiliser leurs
--    tableaux TypeScript, gardés synchronisés à la main avec cette table —
--    la faire consommer par les parseurs à l'exécution (plutôt que servir
--    de seule référence de comparaison) est la suite naturelle, pas encore
--    faite ici.
--
-- 2. import_schema_fingerprint — à chaque fichier "insights" ingéré, on
--    enregistre l'empreinte de ses clés : combien de champs attendus ont
--    été trouvés (taux de couverture), et quelles clés observées ne
--    correspondent à aucun pattern connu (candidates à une dérive de
--    format ou à un nouveau champ Meta). Une couverture qui chute d'un
--    import à l'autre est le signal qu'un libellé a changé.
--
-- 3. canary_accounts — un compte de référence (ex. cette fixture Eden Park)
--    dont les valeurs attendues sont connues au chiffre près. check_canary()
--    rejoue recompute_account() et compare les métriques clés aux valeurs
--    stockées, pour détecter une régression du moteur avant qu'elle
--    n'atteigne un compte client réel.

create table public.parser_label_map (
  id            uuid primary key default gen_random_uuid(),
  file_kind     text not null,   -- 'audience_insights' | 'posts' | 'reach_insights' | 'content_interactions'
  field_name    text not null,   -- nom de champ interne (ex. 'followers_gained')
  label_pattern text not null,   -- libellé Meta normalisé attendu (cf. normalizeKey côté TS)
  match_type    text not null check (match_type in ('exact', 'prefix', 'suffix')),
  is_required   boolean not null default true,
  verified      boolean not null default false,  -- confirmé contre un export réel, pas seulement supposé
  created_at    timestamptz not null default now(),
  unique (file_kind, field_name)
);

create table public.import_schema_fingerprint (
  id                      uuid primary key default gen_random_uuid(),
  import_id               uuid not null references public.imports(id) on delete cascade,
  account_id              uuid not null references public.instagram_accounts(id) on delete cascade,
  file_kind               text not null,
  observed_keys           text[] not null,
  unmapped_keys           text[] not null,
  missing_required_fields text[] not null,
  coverage_rate           numeric(5,4),
  computed_at             timestamptz not null default now(),
  unique (import_id, file_kind)
);
create index on public.import_schema_fingerprint (account_id, file_kind, computed_at desc);

create table public.canary_accounts (
  account_id        uuid primary key references public.instagram_accounts(id) on delete cascade,
  label             text not null,
  expected_values   jsonb not null,
  last_checked_at   timestamptz,
  last_check_passed boolean,
  last_check_diffs  jsonb
);

alter table public.parser_label_map enable row level security;
alter table public.import_schema_fingerprint enable row level security;
alter table public.canary_accounts enable row level security;

-- parser_label_map n'est pas rattachée à un compte : lecture ouverte à tout
-- utilisateur authentifié (c'est un référentiel produit, pas une donnée
-- client), écriture réservée au service_role.
create policy "parser_label_map_read" on public.parser_label_map
  for select using (auth.role() = 'authenticated');

create policy "import_schema_fingerprint_read" on public.import_schema_fingerprint
  for select using (account_id in (select public.user_account_ids()));

create policy "canary_accounts_read" on public.canary_accounts
  for select using (account_id in (select public.user_account_ids()));

-- Empreinte de schéma : à appeler depuis process-import juste après avoir
-- extrait les clés brutes d'un fichier insights, avec les clés déjà
-- normalisées côté TypeScript (normalizeKey), pour rester cohérent avec la
-- logique de correspondance des parseurs.
create or replace function public.record_schema_fingerprint(
  p_import_id uuid,
  p_account_id uuid,
  p_file_kind text,
  p_observed_keys text[]
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_required_count int;
  v_missing text[];
  v_unmapped text[];
  v_coverage numeric;
begin
  select count(*) into v_required_count from public.parser_label_map where file_kind = p_file_kind and is_required;

  select coalesce(array_agg(plm.field_name), '{}') into v_missing
    from public.parser_label_map plm
   where plm.file_kind = p_file_kind and plm.is_required
     and not exists (
       select 1 from unnest(p_observed_keys) as k
        where (plm.match_type = 'exact'  and k = plm.label_pattern)
           or (plm.match_type = 'prefix' and k like plm.label_pattern || '%')
           or (plm.match_type = 'suffix' and k like '%' || plm.label_pattern)
     );

  select coalesce(array_agg(k), '{}') into v_unmapped
    from unnest(p_observed_keys) as k
   where not exists (
     select 1 from public.parser_label_map plm
      where plm.file_kind = p_file_kind
        and (
          (plm.match_type = 'exact'  and k = plm.label_pattern)
          or (plm.match_type = 'prefix' and k like plm.label_pattern || '%')
          or (plm.match_type = 'suffix' and k like '%' || plm.label_pattern)
        )
   );

  v_coverage := case when v_required_count > 0
    then (v_required_count - coalesce(array_length(v_missing, 1), 0))::numeric / v_required_count
  end;

  insert into public.import_schema_fingerprint (
    import_id, account_id, file_kind, observed_keys, unmapped_keys, missing_required_fields, coverage_rate
  ) values (
    p_import_id, p_account_id, p_file_kind, p_observed_keys, v_unmapped, v_missing, v_coverage
  )
  on conflict (import_id, file_kind) do update set
    observed_keys = excluded.observed_keys,
    unmapped_keys = excluded.unmapped_keys,
    missing_required_fields = excluded.missing_required_fields,
    coverage_rate = excluded.coverage_rate,
    computed_at = now();
end;
$$;

revoke execute on function public.record_schema_fingerprint(uuid, uuid, text, text[]) from public, anon, authenticated;
grant execute on function public.record_schema_fingerprint(uuid, uuid, text, text[]) to service_role;

-- Seed : patterns confirmés contre l'export réel Eden Park
-- (parse-insights.ts::parseAudienceInsights, parse-posts.ts::parsePostsFile).
insert into public.parser_label_map (file_kind, field_name, label_pattern, match_type, is_required, verified) values
  ('audience_insights', 'period',           'periode',                                                    'prefix', false, true),
  ('audience_insights', 'followers_total',  'followers',                                                  'exact',  true,  true),
  ('audience_insights', 'growth_pct',       'nombre de followers',                                        'prefix', false, true),
  ('audience_insights', 'followers_gained', 'followers en plus',                                          'prefix', true,  true),
  ('audience_insights', 'followers_lost',   'followers en moins',                                         'prefix', true,  true),
  ('audience_insights', 'followers_net',    'total des followers',                                        'exact',  true,  true),
  ('audience_insights', 'geo_country',      'pourcentage de followers en fonction du pays',                'prefix', false, true),
  ('audience_insights', 'geo_city',         'pourcentage de followers en fonction de la ville',            'prefix', false, true),
  ('audience_insights', 'age_all',          'pourcentage de followers en fonction de lage pour tous les genres', 'prefix', false, true),
  ('audience_insights', 'age_male',         'pourcentage de followers hommes en fonction de lage',          'prefix', false, true),
  ('audience_insights', 'age_female',       'pourcentage de followers femmes en fonction de lage',          'prefix', false, true),
  ('audience_insights', 'male_pct',         'followers hommes',                                            'suffix', true,  true),
  ('audience_insights', 'female_pct',       'followers femmes',                                            'suffix', true,  true),
  ('audience_insights', 'activity_lundi',    'activite des followers : lundi',                              'prefix', false, true),
  ('audience_insights', 'activity_mardi',    'activite des followers : mardi',                              'prefix', false, true),
  ('audience_insights', 'activity_mercredi', 'activite des followers : mercredi',                           'prefix', false, true),
  ('audience_insights', 'activity_jeudi',    'activite des followers : jeudi',                              'prefix', false, true),
  ('audience_insights', 'activity_vendredi', 'activite des followers : vendredi',                           'prefix', false, true),
  ('audience_insights', 'activity_samedi',   'activite des followers : samedi',                             'prefix', false, true),
  ('audience_insights', 'activity_dimanche', 'activite des followers : dimanche',                           'prefix', false, true),

  ('posts', 'reach',           'comptes touches',       'exact', true,  true),
  ('posts', 'impressions',     'impressions',           'exact', true,  true),
  ('posts', 'likes',           'jaime',                 'exact', true,  true),
  ('posts', 'comments',        'commentaires',          'exact', true,  true),
  ('posts', 'shares',          'partages',              'exact', true,  true),
  ('posts', 'saves',           'enregistrements',       'exact', true,  true),
  ('posts', 'profile_visits',  'visites du profil',     'exact', true,  true),
  ('posts', 'follows_gained',  'followers en plus',     'exact', true,  true),
  ('posts', 'external_taps',   'external link taps',    'exact', true,  true),
  ('posts', 'created_at',      'timestamp de la cr',    'prefix', true, true),

  -- profiles_reached.json / content_interactions.json : patterns non
  -- vérifiés contre un export réel (fichiers non fournis à ce jour),
  -- repris tels quels de parse-insights.ts::parseReachInsights /
  -- parseInteractionInsights — marqués verified=false, à corriger dès
  -- qu'un export réel sera disponible (cf. le même avertissement déjà
  -- présent en commentaire dans ce fichier TypeScript).
  ('reach_insights', 'accounts_reached', 'comptes touches',              'prefix', true, false),
  ('reach_insights', 'impressions',      'impressions',                  'prefix', true, false),
  ('reach_insights', 'profile_visits',   'visites du profil',            'prefix', true, false),
  ('reach_insights', 'external_taps',    'clics sur le lien externe',    'prefix', true, false),
  ('content_interactions', 'interactions', 'interactions',               'prefix', true, false),
  ('content_interactions', 'likes',        'mentions jaime',             'prefix', true, false),
  ('content_interactions', 'comments',     'commentaires',               'prefix', true, false),
  ('content_interactions', 'shares',       'partages',                   'prefix', true, false),
  ('content_interactions', 'saves',        'enregistrements',            'prefix', true, false);

-- Compare les valeurs mesurées d'un compte canari à ses valeurs attendues,
-- après un recompute_account(). Ne rejoue pas le recalcul lui-même (à
-- faire par l'appelant si besoin) : compare l'état courant.
create or replace function public.check_canary_account(p_account_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expected jsonb;
  v_actual jsonb;
  v_diffs jsonb := '{}'::jsonb;
  v_key text;
  v_passed boolean := true;
begin
  if p_account_id not in (select public.user_account_ids()) then
    raise exception 'Accès refusé';
  end if;

  select expected_values into v_expected from public.canary_accounts where account_id = p_account_id;
  if v_expected is null then
    raise exception 'Compte % non enregistré comme canari', p_account_id;
  end if;

  select jsonb_build_object(
    'gone', (select count(*) from public.follower_states where account_id = p_account_id and status = 'gone' and is_latest_episode),
    'present', (select count(*) from public.follower_states where account_id = p_account_id and status = 'present'),
    'out_of_window', (select count(*) from public.follower_states where account_id = p_account_id and status = 'out_of_window'),
    'cohorts_total_size', (select coalesce(sum(size), 0) from public.cohorts where account_id = p_account_id)
  ) into v_actual;

  for v_key in select jsonb_object_keys(v_expected) loop
    if (v_expected -> v_key) is distinct from (v_actual -> v_key) then
      v_diffs := v_diffs || jsonb_build_object(v_key, jsonb_build_object('expected', v_expected -> v_key, 'actual', v_actual -> v_key));
      v_passed := false;
    end if;
  end loop;

  update public.canary_accounts
     set last_checked_at = now(), last_check_passed = v_passed, last_check_diffs = v_diffs
   where account_id = p_account_id;

  return jsonb_build_object('passed', v_passed, 'diffs', v_diffs, 'actual', v_actual, 'expected', v_expected);
end;
$$;

revoke execute on function public.check_canary_account(uuid) from public, anon;
grant execute on function public.check_canary_account(uuid) to authenticated, service_role;
