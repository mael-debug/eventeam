-- Community Intelligence — corrige le "canceling statement due to statement
-- timeout" de recompute_account() sur les gros comptes (ex. Eden Park All :
-- 95k+ follower_states, 4313 lignes content).
--
-- Cause diagnostiquée (recompute_account() rejoué manuellement, cf.
-- pg_stat_activity : actif plus de 3 min sans wait_event, donc CPU-bound,
-- pas bloqué) : l'étape 7 (content_attribution) calcule retained_in_window
-- par une sous-requête corrélée PAR LIGNE de content — jusqu'à 4313 fois —
-- qui filtre follower_states sur (followed_at at time zone 'UTC')::date,
-- une expression sans index dédié. Sans index sur cette expression,
-- chaque exécution scanne les lignes candidates du compte et évalue
-- l'expression ligne à ligne : ~4313 × ~95k évaluations dans le pire cas.
-- La même expression est utilisée ailleurs dans recompute_account() (CTE
-- `daily`, répétée dans content_attribution ET acquisition_spikes) — cet
-- index profite aux deux, sans changer aucune requête ni aucun résultat.
create index if not exists follower_states_account_id_followed_date_idx
  on public.follower_states (account_id, (((followed_at at time zone 'UTC'))::date));
