-- Community Intelligence — profiles_reached.json / content_interactions.json
-- avec les vraies clés (fichiers obtenus après coup, cf. EXPECTED.md étendu).
--
-- content_interactions.json distingue un format 'videos' (vidéos classiques,
-- distinctes des reels et des lives) que le PRD littéral n'avait pas prévu
-- dans l'énumération ('all','posts','stories','reels','lives') — ajouté ici.
--
-- Le fichier expose aussi des métriques au niveau du COMPTE, pas d'un
-- format particulier : « Comptes ayant interagi », sa variation, et sa
-- répartition followers/non-followers. Portées par la ligne format='all'
-- (qui représente déjà l'agrégat compte), plutôt qu'une nouvelle table pour
-- quatre colonnes.

alter table public.interaction_insights drop constraint interaction_insights_format_check;
alter table public.interaction_insights add constraint interaction_insights_format_check
  check (format in ('all','posts','stories','reels','videos','lives'));

alter table public.interaction_insights
  add column accounts_interacted int,
  add column accounts_interacted_delta_pct numeric(6,2),
  add column accounts_interacted_follower_pct numeric(5,2),
  add column accounts_interacted_non_follower_pct numeric(5,2);

-- follower_reach_pct / non_follower_reach_pct existaient déjà dans le
-- schéma (0006, colonnes jamais renseignées faute d'export réel) : aucune
-- migration nécessaire pour elles, seul le parseur change.
