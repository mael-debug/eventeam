# Test de non-régression Lot 3

Fixture pseudonymisée : deux exports réels Eden Park (horodatages,
découpage des fichiers et signaux structurels identiques aux exports
originaux, aucun pseudonyme réel). Voir `EXPECTED.md` pour les valeurs de
référence et les six pièges qu'elle vérifie.

## Exécuter

```
node --experimental-strip-types run.mjs
```

`run.mjs` réutilise les vrais parseurs de production (`_shared/parse-followers.ts`)
et réimplémente en JavaScript la même logique que `recompute_account()`
(épisodes, statut par recouvrement de fenêtre, cohortes mesurables, survie
courante). C'est un raccourci délibéré : recharger les ~22 000 lignes de la
fixture dans Postgres à chaque exécution serait coûteux et lent. Toute
divergence trouvée ici doit être reproduite dans une transaction Postgres
annulée (`begin; ... rollback;`) avant d'être traitée comme un bug confirmé
du SQL — la session qui a produit ce test a trouvé quatre bugs réels de
cette façon, tous corrigés dans `0018_engine_real_fixture_fixes.sql` et
`0019_manual_entries.sql`.

Ce script ne couvre que `follower_states`/`cohorts`/`cohort_survival`. Les
valeurs de `EXPECTED.md` concernant `posts.json` (somme `follows_gained`,
part organique) sont couvertes séparément par le test du parseur
`parse-posts.ts` (validé manuellement pendant la même session, à
transformer en test automatisé si ce fichier devient un point de
régression fréquent).
