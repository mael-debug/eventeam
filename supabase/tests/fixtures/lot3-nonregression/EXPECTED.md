# Valeurs de référence — test de non-régression Lot 3

Fixture pseudonymisée. Horodatages, découpage des fichiers et signaux structurels
identiques aux exports réels. Aucun pseudonyme réel n'y figure.

Deux imports :
- `import_2026-07-22/` — fenêtre 2026-04-22 → 2026-07-22, 9 867 profils
- `import_2026-08-27/` — fenêtre 2026-05-27 → 2026-08-27, 12 431 profils sur 2 fichiers

## Valeurs que `recompute_account()` doit produire exactement

| Grandeur | Valeur attendue |
|---|---|
| Fenêtre de recouvrement | 2026-05-27 → 2026-07-22 |
| Profils dans le recouvrement (statut mesurable) | 6 948 |
| Profils `out_of_window` dans l'import de juillet | 2 919 |
| Profils `gone` | 1 138 |
| Taux de départ brut | 16,4 % |
| Nouveaux arrivés entre les deux imports | 6 311 |
| Profils présents dans les deux imports | 5 810 |
| Réabonnements (horodatage postérieur au précédent) | 2 |
| Couverture des départs (1 138 / 9 260) | 12,3 % |
| Somme des `follows_gained` de `posts.json` | 655 |
| Part organique (655 / 19 055) | 3,4 % |

## Courbe de survie par cohorte, taux de départ bruts

| Semaine | Effectif | Partis | Taux | Exposition |
|---|---|---|---|---|
| 2026-05-25 | 190 | 7 | 3,7 % | 94 j |
| 2026-06-01 | 246 | 10 | 4,1 % | 87 j |
| 2026-06-08 | 257 | 6 | 2,3 % | 80 j |
| 2026-06-15 | 1 004 | 84 | 8,4 % | 73 j |
| 2026-06-22 | 804 | 171 | 21,3 % | 66 j |
| 2026-06-29 | 1 274 | 217 | 17,0 % | 59 j |
| 2026-07-06 | 1 779 | 345 | 19,4 % | 52 j |
| 2026-07-13 | 1 275 | 284 | 22,3 % | 45 j |
| 2026-07-20 | 119 | 14 | 11,8 % | 38 j |

Note : la cohorte du 20 juillet est tronquée par la fin de fenêtre de l'import de
juillet. Elle doit être produite mais marquée `insuffisant`.

## Insights, `audience_insights.json` de l'import d'août

Période `May 29 - Aug 26` — noter qu'elle diffère de la fenêtre des abonnés
(27 mai → 27 août). Les deux ne doivent jamais être fusionnées.

| Champ | Valeur |
|---|---|
| Followers | 102 497 |
| Followers en plus | 19 055 |
| Followers en moins | 9 260 |
| Total des followers (= croissance nette, libellé trompeur) | 9 795 |
| France | 41,1 % |
| Hommes | 73,5 % |
| Activité lundi | 63,3 K |

## Pièges vérifiés par cette fixture

1. Fichier découpé à 10 000 lignes — l'agrégation `followers_N.json` est testée.
2. 2 919 profils hors fenêtre de recouvrement — ne doivent jamais compter comme partis.
3. Deux réabonnements — ne doivent pas écraser l'épisode précédent.
4. Deux définitions de période dans un même export — ne doivent pas être fusionnées.
5. Clés en mojibake, espace insécable, apostrophe typographique, faute « des de ».
6. Cohorte tronquée en fin de fenêtre — produite mais marquée insuffisante.

## profiles_reached.json — racine `organic_insights_reach`

| Clé (mojibake brut) | Valeur |
|---|---|
| `PÃ©riode` | May 29 - Aug 26 |
| `Comptes touchÃ©s` | 3359140  ← sans séparateur, contrairement aux autres |
| `Nombre de comptes touchÃ©s` | +59.4% vs Feb 28 - May 28 |
| `Followers` | 1% |
| `Non-followers` | 99% |
| `DiffÃ©rence de nombre de non-followers` | phrase en anglais |
| `Impressions` | 15,570,962 |
| `Nombre dâ€™impressions` | +93.4%  ← sans « vs … » |
| `Visites du profil` | 103,643 |
| `Nombre de visites sur le profil` | -6.3% |
| `Appuis sur les liens externes` | 3,427 |
| `Nombre dâ€™appuis sur des liens externes` | -20.7% |

## content_interactions.json — racine `organic_insights_interactions`

| Clé | Valeur |
|---|---|
| `Interactions avec le contenu` | 122,212 |
| `Interactions avec les publications` | 26,024 (−40,4 %) |
| `Mentions Jâ€™aime des publications` | 22,373 |
| `Commentaires sur les publications` | 834 |
| `Partages de publications` | 958 |
| `Enregistrements de publications` | 643 |
| `Interactions avec la story` | 2,041 (+3,7 %) |
| `RÃ©ponses aux stories` | 85 |
| `Partages de stories` | 173 |
| `Interactions avec les reels` | 81,079 (+160 %) |
| `Mentions Jâ€™aime sur les reels` | 72,361 |
| `Commentaires sur les reels` | 322 |
| `Partages des reels` | 2,572 |
| `Enregistrements de reels` | 3,176 |
| `Comptes ayant interagi` | 87,045 (+38,8 %) |
| `Comptes ayant interagi par type de followers` | Followers: 5.6%, Non-followers: 94.4% |

## Pièges supplémentaires sur ces deux fichiers

7. `Comptes touchÃ©s` vaut `3359140` **sans séparateur de milliers**, alors que
   `Impressions` vaut `15,570,962` **avec**. Le parseur numérique doit tolérer les deux.
8. `Nombre dâ€™impressions` vaut `+93.4%` **sans** le suffixe « vs … », alors que la
   plupart des autres champs de variation le portent. Le parseur de période comparée
   doit accepter son absence.
9. `Followers` existe dans **deux fichiers avec deux sens différents** :
   102 497 (effectif) dans `audience_insights.json`, 1 % (part de portée) dans
   `profiles_reached.json`. La correspondance de libellés doit être scopée par fichier,
   jamais globale.
10. Le libellé `Vous avez interagi avec deltaÂ % de comptes en plus …` contient le
    littéral `delta` non substitué et une espace insécable. Bug d'internationalisation
    côté Meta, à ignorer.
11. Trois métriques valent `0` (vidéos, vidéos en direct). Ne pas confondre avec absent.
12. Le pluriel varie : `Partages de publications` mais `Partages des reels`.
