# Test de non-régression Lot 3

Fixture pseudonymisée : deux exports réels Eden Park (horodatages,
découpage des fichiers et signaux structurels identiques aux exports
originaux, aucun pseudonyme réel). Voir `EXPECTED.md` pour les valeurs de
référence et les douze pièges qu'elle vérifie (six sur `followers_N.json`,
six sur `profiles_reached.json`/`content_interactions.json`).

## Exécuter

```
node --experimental-strip-types run.mjs
```

`run.mjs` réutilise les vrais parseurs de production (`_shared/parse-followers.ts`,
`_shared/parse-insights.ts`) et réimplémente en JavaScript la même logique
que `recompute_account()` (épisodes, statut par recouvrement de fenêtre,
cohortes mesurables, survie courante) pour la partie `followers_N.json`.
C'est un raccourci délibéré : recharger les ~22 000 lignes de la fixture
dans Postgres à chaque exécution serait coûteux et lent. Toute divergence
trouvée ici doit être reproduite dans une transaction Postgres annulée
(`begin; ... rollback;`) avant d'être traitée comme un bug confirmé du
SQL — la session qui a produit ce test a trouvé quatre bugs réels de
cette façon, tous corrigés dans `0018_engine_real_fixture_fixes.sql` et
`0019_manual_entries.sql`.

Les vérifications sur `profiles_reached.json`/`content_interactions.json`
appellent directement `parseReachInsights`/`parseInteractionInsights` (pas
de logique SQL à rejouer : ces deux fichiers alimentent `reach_insights`/
`interaction_insights` par upsert direct dans `process-import`, sans passer
par `recompute_account()`). Elles couvrent les six pièges supplémentaires
documentés dans `EXPECTED.md` (nombre sans séparateur de milliers, delta
sans suffixe « vs … », « Followers » à deux sens selon le fichier, littéral
« delta » non substitué à ignorer, métriques légitimement à 0, pluriel
variable « de »/« des »).

Ce script ne couvre pas `posts.json`. Les valeurs de `EXPECTED.md` le
concernant (somme `follows_gained`, part organique) sont couvertes
séparément par le test du parseur `parse-posts.ts` (validé manuellement
pendant la même session, à transformer en test automatisé si ce fichier
devient un point de régression fréquent).
