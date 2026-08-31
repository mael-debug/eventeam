# Handoff — Community Intelligence

## Vue d'ensemble

Community Intelligence est un outil d'analyse d'audience Instagram pour agence social media. Il ingère les exports officiels Instagram déposés périodiquement, compare deux exports consécutifs, et reconstitue ce que Meta ne fournit pas : la liste nominative des désabonnés et la qualité de chaque vague d'acquisition.

Deux rôles : **agence** (accès complet, dépôt d'imports, accès aux identités, saisie des budgets) et **marque** (lecture seule).

Marque de démonstration : Eden Park. Agence : Eventeam.

## À propos des fichiers de design

Les fichiers de ce dossier sont des **références de design réalisées en HTML** — des prototypes montrant l'apparence et le comportement attendus, pas du code de production à copier tel quel.

Le travail consiste à **recréer ces écrans dans l'environnement du codebase cible** (React, Vue, SwiftUI, natif…) avec ses patterns et ses bibliothèques établis. Si aucun environnement n'existe encore, choisir le framework le plus adapté au projet et y implémenter les designs.

Le prototype est un composant React unique piloté par une classe de logique ; ce découpage est un artefact de l'outil de maquettage, pas une recommandation d'architecture.

## Fidélité

**Haute fidélité.** Couleurs, typographie, espacements et interactions sont définitifs. Recréer l'UI au pixel près avec les bibliothèques du codebase. Toutes les valeurs sont issues du design system Bienfait, fourni dans `_ds/` (tokens CSS + composants React `Logo`, `Button`, `Badge`, `Chip`, `Card`).

Les données affichées sont réelles (analyse Eden Park) sauf mention contraire en fin de document.

---

## Principe éditorial — contrainte de conception, pas décoration

Trois règles gouvernent chaque écran. Les enfreindre casse le produit.

1. **Chaque chiffre incertain porte son intervalle ou sa réserve.** On écrit « parti entre le 22/07 et le 27/08 », jamais une date exacte.
2. **Les fonctionnalités impossibles sont affichées et assumées**, au même niveau que les autres, avec leur raison.
3. **Ton sobre et factuel.** Pas de gamification, pas de badges de félicitation, pas d'émojis.

Conséquences transverses :

- **Aucune extrapolation nulle part.** Les courbes s'arrêtent à la dernière observation réelle.
- **Tout croisement affiche trois métadonnées** à côté de son résultat : taille d'échantillon (`n = …`), fenêtre d'observation, niveau de confiance (`robuste` / `indicatif` / `insuffisant`). Prévoir un composant unique réutilisé partout.
- **Un résultat faible ou nul s'affiche quand même**, avec sa raison (« aucune corrélation détectée, n = 8 semaines, confiance insuffisante »).
- **Le vocabulaire de l'inférence n'est jamais adouci** : « probablement payant », « estimé », « inféré », « corrélation ». Ces mots restent dans les libellés.
- **Deux fenêtres coexistent et ne doivent jamais être confondues** : abonnés 27 mai → 27 août, Insights 29 mai → 26 août. Chaque chiffre porte la sienne.

---

## Navigation

**Barre latérale** (232 px, fond `--encre`, texte crème) : logotype Bienfait + « Community Intelligence / Eventeam · analyse d'audience », puis les items — Vue d'ensemble, Audience, Croissance, Acquisition, Diagnostic, Segments, Contenu, Écosystème, Listes, Catalogue, Imports, Journal, Paramètres. Item actif : pilule `rgba(250,248,243,0.12)`, texte `#FAF8F3`, `font-weight: 700`. Inactif : texte `rgba(250,248,243,0.62)`, `font-weight: 500`. Pied de barre : dernier import + liens vers les états de démonstration (aucun import, un seul import, sélection de marque, connexion).

**En-tête** (64 px, fond `rgba(244,241,236,0.82)` + `backdrop-filter: blur(10px)`, bordure basse `--bordure`) : sélecteur de marque (pilule pleine), sélecteur de période (pilule transparente, `flex: 1 1 auto; min-width: 0`), bascule de rôle à droite (« Agence · accès complet » ⇄ « Marque · lecture seule ») et pastille d'avatar 32 px.

**Zone principale** : `overflow-y: auto`, padding 32 px, largeur de contenu maximale 1280 px.

---

## Écrans

### 1. Vue d'ensemble

Quatre indicateurs en grille `repeat(auto-fit, minmax(210px, 1fr))`, cartes claires :

| Indicateur | Valeur | Sous-ligne |
|---|---|---|
| Abonnés | 102 497 | +10,5 % · abonnés 27 mai → 27 août |
| Croissance nette | +9 795 | 19 055 gagnés · 9 260 perdus · Insights 29 mai → 26 août |
| Taux de départ mesuré | 16,4 % | 1 138 sur 6 948 comptes comparables · 27 mai → 27 août |
| Part organique | 3,4 % | 655 sur 19 055 · Insights 29 mai → 26 août |

Chiffre : `clamp(26px, 2.6vw, 34px)`, poids 800, `letter-spacing: -0.02em`, `white-space: nowrap`. Eyebrow : 11 px, `letter-spacing: 0.08em`, majuscules, `--text-muted`.

**Bandeau d'alertes** — le cœur de l'écran, panneau `--bleu-bg` 18 px de rayon, quatre cartes cliquables en grille 2×2. Chaque carte : Badge `cadrage`, titre 19 px/700, détail 13 px muted, lien « Ouvrir X → ». Les quatre alertes :

1. La portée augmente de 93 % mais les visites de profil reculent de 6,3 % et les clics externes de 20,7 % → Contenu.
2. Les abonnés recrutés depuis le 15 juin partent cinq fois plus que les précédents → Acquisition.
3. Le contenu organique n'explique que 3,4 % des abonnés gagnés → Acquisition.
4. La part France recule de 43 % à 41,1 %, l'objectif est 51 % → Audience.

En pied : carte claire « Ce que nous mesurons, et sur quoi » + carte encre « Non calculable aujourd'hui » listant deux impossibilités nommées, avec lien vers le Catalogue.

### 2. Acquisition — écran principal du produit

**Simulateur de coût réel par pic.** Encart de méthode : les 19 055 abonnés des Insights et les 6 948 comptes des cohortes ne décrivent pas la même population ; le budget se saisit donc pic par pic. Trois tuiles de synthèse : budget saisi, coût par abonné brut, et — élément le plus gros de l'écran — carte encre avec le coût par abonné conservé en `clamp(34px, 5.2vw, 64px)` poids 800, couleur `--vert-logo`.

Tableau des pics (`min-width: 900px`, wrapper `overflow-x: auto`) : Pic (+ badge de nature inférée + forme), Volume, Multiple, Part nocturne, Rétention, Conservés, Budget (champ de saisie, masqué en lecture seule), Coût brut, Coût conservé.

| Pic | Cohorte | Volume | Multiple | Part nocturne | Nature inférée |
|---|---|---|---|---|---|
| 15 – 21 juin | 15 juin | 1 004 | 4,3× | 22 % | probablement viral |
| 22 – 28 juin | 22 juin | 804 | 3,5× | 31 % | probablement payant |
| 29 juin – 5 juil. | 29 juin | 1 274 | 5,5× | 44 % | probablement payant |
| 6 – 12 juil. | 6 juil. | 1 779 | 7,7× | 58 % | probablement automatisé |
| 13 – 19 juil. | 13 juil. | 1 275 | 5,5× | 61 % | probablement automatisé |

Calcul par pic : `coût brut = budget / volume` ; `conservés = volume × (1 − taux à l'horizon)` ; `coût conservé = budget / conservés`. Agrégat : somme des budgets / somme des conservés des pics renseignés. Budget par défaut : 10 000 € sur le pic 6 – 12 juil., les autres vides (« — »).

**Tableau de survie par cohorte** avec curseur d'horizon commun (30 – 90 jours, défaut 45). Colonnes : Semaine, Effectif, Partis, Taux brut, Taux à l'horizon (barre + valeur), Exposition. La rupture entre le 8 et le 22 juin doit sauter aux yeux : cohortes antérieures en gris `#A8A196`, cohortes à partir du 15 juin en `--bleu`.

| Semaine | Effectif | Partis | Taux brut | Exposition |
|---|---|---|---|---|
| 25 mai | 190 | 7 | 3,7 % | 94 j |
| 1er juin | 246 | 10 | 4,1 % | 87 j |
| 8 juin | 257 | 6 | 2,3 % | 80 j |
| 15 juin | 1 004 | 84 | 8,4 % | 73 j |
| 22 juin | 804 | 171 | 21,3 % | 66 j |
| 29 juin | 1 274 | 217 | 17,0 % | 59 j |
| 6 juillet | 1 779 | 345 | 19,4 % | 52 j |
| 13 juillet | 1 275 | 284 | 22,3 % | 45 j |

Une cohorte dont l'exposition est inférieure à l'horizon passe en statut **insuffisant** : ligne sur fond `--panneau`, texte muted, mention « Insuffisant — exposition 52 j, inférieure à l'horizon de 60 j », taux à l'horizon « — ». Elle n'est jamais masquée.

**Courbe de survie.** Abscisse : jours depuis l'arrivée (0 → 100), pas la date calendaire. Ordonnée : 60 → 100 % de survie. Sélecteur de cohortes en pilules cliquables. Trait vertical pointillé à l'horizon retenu. Chaque courbe s'arrête à sa dernière observation réelle : **aucune projection**.

En pied : bandeau de réconciliation (voir plus bas).

### 3. Croissance

Deux histogrammes à **échelles distinctes** (à l'échelle des arrivées, les départs seraient invisibles) : arrivées par cohorte (max 1 779) et départs constatés (max 345). Semaines de pic surlignées `--bleu-bg`.

Carte latérale : taux de départ mesuré 16,4 %, et **renommages présumés — « non distingués »**, avec l'explication (un compte qui change de pseudonyme ressemble à un départ ; un troisième import permettra de trancher).

Tableau des derniers départs : Compte, Abonné depuis, Cohorte, Parti (intervalle « entre le 22/07 et le 27/08 »), Ancienneté. Identités masquées par défaut (`compte 8f21c4`) ; le bouton de révélation affiche un avertissement `--pastel-jaune` et n'existe pas en lecture seule.

En pied : bandeau de réconciliation.

### 4. Diagnostic

**Risque par âge d'abonnement** — barres sur six tranches : 0-14 j 41 %, 14-21 j 18 %, 21-30 j 15 %, 30-45 j 12 %, 45-60 j 8 %, 60-90 j 6 %. Sous le graphique, trois lectures possibles ; celle qui correspond aux données est en carte encre, les deux autres restent visibles en retrait :

| Forme | Lecture | Action |
|---|---|---|
| Risque concentré sur 0-14 j *(cas courant)* | Mauvais ciblage à l'acquisition | Corriger le ciblage publicitaire |
| Risque plat | Lassitude éditoriale progressive | Corriger le contenu |
| Risque tardif, après 45 j | Décrochage sur un événement | Chercher l'événement |

**Table des pics** (mêmes données que le simulateur, sans les colonnes de budget) avec lien vers Acquisition.

**Trois croisements en cartes**, chacun avec résultat, explication, et les trois métadonnées :

1. Cadence de publication et départs — « Aucune corrélation détectée », n = 8 semaines, 27 mai → 27 août, confiance **insuffisant**.
2. Portée non-abonnés et qualité entrante — « Corrélation négative, −0,71 », n = 8 semaines / 6 948 comptes, confiance **indicatif**.
3. Effet retour du nettoyage de following — « Non mesurable sur cette fenêtre », n = 0 retrait, confiance **insuffisant**.

### 5. Segments

Trois cartes de persona (effectif mensuel, taux de départ, profil, recommandation) :

| Segment | Nouveaux / mois | Départs | Recommandation |
|---|---|---|---|
| Le fidèle de marque | ≈ 1 100 | 3,3 % | À fidéliser, cible des scénarios de collection |
| L'abonné de campagne | ≈ 4 700 | 17,1 % | Le levier est en amont, dans le ciblage |
| Le compte lointain | ≈ 1 500 | 20,0 % | À exclure du ciblage, pas à fidéliser |

Puis **score de risque des arrivées récentes**, par tranche et jamais nominativement : risque élevé 1 240 (38 %), moyen 890 (27 %), faible 1 130 (35 %) ; n = 3 260 comptes, 29 juillet → 27 août, confiance indicatif.

Réserve permanente en pied : ces segments décrivent le flux d'acquisition récent, pas les 102 497 abonnés.

### 6. Audience

**Part France face à l'objectif — deux séries.** Série mesurée en stock : 43 % → 41,1 %, objectif 51 % (repère vertical). Série estimée du flux entrant : 31 % ± 7 pts, rendue en hachures + bordure pointillée pour signaler qu'elle est inférée par différence de stocks, avec ses bornes d'erreur. La seconde série n'est pas reléguée au second plan.

Répartition pays (France 41,1 %, Algérie 13,9 %, Inde 7 %, Égypte 4,3 %, Royaume-Uni 2,2 %) et villes (Alger 2,8 %, Paris 1,8 %, Le Caire 1,2 %). Âge et genre : 73,5 % d'hommes, 26,4 % de femmes ; 25-34 ans 32,1 %, 35-44 ans 25,3 %.

Activité par jour de semaine (Insights) : lundi 63,3 K, mardi 63,2 K, mercredi 63,2 K, jeudi 62,9 K, vendredi 63,2 K, samedi 63,5 K, dimanche 63,5 K.

**État « fenêtres non comparables »** (bascule de démonstration) : quand deux périodes se recouvrent de plus de 20 %, les flèches d'évolution sont remplacées par un avertissement `--pastel-jaune` expliquant que les périodes ne sont pas comparables.

### 7. Contenu

Grille de publications triée par taux de conversion décroissant. Chaque carte : vignette, date, format, taux de conversion en gros (`clamp(24px, 2.6vw, 34px)`, `nowrap`), portée, abonnés gagnés, puis trois lignes ajoutées :

- **Arrivées dans les 48 h** — libellé impératif, jamais « abonnés amenés par cette publication ». Infobulle : une corrélation temporelle n'est pas une attribution ; rien dans l'export ne relie un abonné à une publication.
- Rétention de ces arrivées.
- Écart avec le chiffre annoncé par Meta.

| Date | Format | Portée | Gagnés | Conversion | Arrivées 48 h | Rétention | Écart Meta |
|---|---|---|---|---|---|---|---|
| 15 juin | Reel | 14 935 | 295 | 1,975 % | 331 | 78 % | +36 |
| 20 juin | Post | 152 644 | 31 | 0,020 % | 44 | 52 % | +13 |
| 11 août | Reel | 225 891 | 40 | 0,018 % | 58 | 39 % | +18 |

Les publications à forte portée et faible conversion portent un encart `--pastel-jaune` : « Vue quinze fois plus que la publication du 15 juin, pour sept fois moins d'abonnés. Le taux de conversion est cent dix fois inférieur. »

**Rétention par territoire éditorial**, triée par rendement rétentif, avec niveau de confiance par ligne : Rugby 81 % (indicatif), Ambassadeur 76 % (indicatif), Mode 64 % (indicatif), Produit 58 % (insuffisant), Événement 52 % (insuffisant), Promotion 41 % (insuffisant).

**Reels contre posts** (carte encre) : Reels 81 079 interactions (+160 %), Posts 26 024 (−40,4 %), portée +93,4 % avec visites de profil −6,3 % et clics externes −20,7 %.

### 8. Imports

**Encart de cadence permanent** (carte encre, en tête) : « Vos exports sont espacés de 5 semaines. La date de désabonnement est donc connue à 5 semaines près. En passant à un export hebdomadaire, elle serait connue à la semaine. » C'est le principal levier commercial : il reste visible en permanence.

**Frise des fenêtres.** Deux imports de 3 mois glissants décalés de 5 semaines, positionnés en pourcentages sur une échelle 24 avril → 27 août ; le recouvrement (63 %) doit être évident. La fenêtre Insights (29 mai → 26 août) est tracée séparément en pointillés.

**Zone de dépôt et six états** (sélecteur de démonstration) : dépôt vide, décompression, inventaire avant traitement, traitement avec progression par étape, succès, échec partiel. Bloc réservé au rôle agence.

Inventaire avant traitement — la transparence est une fonctionnalité, pas une note de bas de page :

*Sera ingéré (8 fichiers)* : `followers_1.json` 10 000 lignes, `followers_2.json` 2 431, `following.json` 358, `audience_insights.json` 1 bloc, `profiles_reached.json` 1 bloc, `content_interactions.json` 1 bloc, `posts.json` 16 publications, `your_chat_information.json` 1 132 conversations (métadonnées seules : interlocuteur, date, existence d'une réponse).

*Sera ignoré (3 fichiers)* : `messages/inbox/` (contenu des conversations privées), `contacts/synced_contacts.json` (répertoire téléphonique), `login_and_account_creation/` (données de connexion).

Instagram découpe la liste d'abonnés par tranches de 10 000 lignes et ne l'exporte que sur la fenêtre glissante. Les JSON ingérés sont conservés 24 mois, pour retraiter les anciens imports quand le parseur évolue.

### 9. Catalogue et liste de courses

42 fonctionnalités groupées par module, quatre statuts immédiatement distinguables :

| Statut | Fond | Texte |
|---|---|---|
| Disponible | `--vert-pastel` | `--bleu` |
| Nécessite un import de plus | `--pastel-jaune` | `--encre` |
| Nécessite un accès (bloqueur nommé) | `--bleu-bg` | `--bleu` |
| Impossible (raison donnée) | `--encre` | `#FAF8F3` |

Les fonctionnalités impossibles ne sont ni grisées ni reléguées en bas. Chaque ligne porte trois pilules d'arbitrage client (Indispensable / Souhaitable / Sans intérêt, exclusives, dé-sélectionnables) et un champ de commentaire. Compteur « n / 42 arbitrées » et bouton d'export du catalogue annoté.

### 10. Listes nominatives

Bandeau permanent en tête : données personnelles, usage limité à l'analyse interne, consultation journalisée. Tableau des comptes partis : identifiant, date d'abonnement, cohorte, intervalle de départ, action de demande d'effacement. Export CSV et révélation des identités réservés au rôle agence.

### 11. Écrans secondaires

- **Écosystème** : comptes professionnels suivis (type, palier d'audience, réciprocité, réponse), filtre « jamais eu de réponse ». Palier et audience proviennent des métadonnées de conversation ; le contenu des messages n'est jamais lu.
- **Journal de consultation** : date, utilisateur, action, volume. L'interface promet trois fois que les accès sont journalisés ; cet écran le prouve.
- **Paramètres** : cadence d'import (5 semaines / 2 semaines / hebdomadaire), membres et rôles, autorisation d'accès aux identités pour le compte client (désactivée par défaut).
- **Connexion** : lien magique par e-mail, sans mot de passe, valable 15 minutes.
- **Sélection de marque** : Eden Park (2 imports), Bensimon (1 import), Aigle (aucun import).
- **Aucun import** : marche à suivre pour générer un export Instagram, zone de dépôt, avertissement sur ce qu'un seul import ne permet pas.
- **Un seul import** : deux colonnes — modules actifs (Audience, Contenu, Écosystème, Catalogue) et modules inactifs avec leur raison (Croissance, Acquisition, Diagnostic, Segments, Listes). C'est l'état de tout nouveau client.

### Bandeau de réconciliation

Présent en pied de Croissance, Acquisition, Diagnostic et Segments. **Jamais masquable.** Carte encre, deux lignes :

> Meta annonce 9 260 désabonnements. Nous en identifions 1 138 nommément, soit 12,3 %. L'écart tient à la fenêtre glissante de l'export : les abonnés arrivés avant le 27 mai n'y figurent pas.
> Un export sur toute la période porterait cette couverture à près de 100 %.

Il protège contre le contresens le plus probable en réunion : lire 16,4 % comme le taux de churn du compte entier.

---

## Méthode de calcul

### Troncature à horizon commun

Les taux bruts ne sont pas comparables entre cohortes : une cohorte exposée 45 jours a eu moins de temps pour partir qu'une cohorte exposée 94 jours. Le produit ne les extrapole pas — il les **tronque à un horizon commun** choisi par l'utilisateur (30 à 90 jours, défaut 45).

Distribution cumulée des départs par âge d'abonnement, `F(d)`, dérivée des 1 138 départs observés (points : 14 j → 0,41 ; 21 j → 0,59 ; 30 j → 0,74 ; 45 j → 0,86 ; 60 j → 0,94 ; 90 j → 1,00 ; interpolation linéaire entre les points).

```
taux_horizon(cohorte) = taux_brut × F(H) / F(exposition)     si exposition ≥ H
                       = insuffisant                          sinon
```

La même fonction donne la forme des courbes de survie entre l'arrivée et la dernière observation. Aucun point n'est tracé au-delà de l'exposition réelle.

### Coût par abonné conservé

```
conservés_pic = volume_pic × (1 − taux_horizon(cohorte_du_pic) / 100)
coût_brut     = budget_pic / volume_pic
coût_conservé = budget_pic / conservés_pic
```

Agrégat : somme des budgets renseignés / somme des conservés correspondants. Les pics sans budget affichent « — » et n'entrent pas dans l'agrégat.

---

## États à ne pas oublier

- Compte sans aucun import — écran d'amorçage.
- Compte avec un seul import — modules de comparaison inactifs, avec l'explication et le pourquoi.
- Fenêtres qui se recouvrent trop pour être comparées — l'évolution est remplacée par un avertissement.
- Rôle lecture seule — ni dépôt d'import, ni accès aux identités, ni saisie de budget, ni export CSV.
- Import en échec partiel — un fichier en erreur, les autres traités, la conséquence nommée sur les écrans concernés.

## Gestion d'état

État local du prototype, à remplacer par l'état applicatif réel :

| Clé | Type | Rôle |
|---|---|---|
| `screen` | string | Écran affiché |
| `horizon` | number (30-90) | Horizon commun, recalcule tous les taux tronqués |
| `budgets` | map pic → string | Budget saisi par pic |
| `off` | map cohorte → bool | Cohortes désactivées sur la courbe |
| `reveal` | bool | Identités révélées (déclenche l'avertissement, journalisé) |
| `overlap` | bool | Démonstration de l'état « fenêtres non comparables » |
| `etat` | 0-5 | État du dépôt d'import |
| `role` | `agence` \| `marque` | Rôle courant, gouverne dépôt / identités / budgets |
| `ratings`, `notes` | map fonctionnalité → valeur | Arbitrage et commentaires du catalogue |
| `ecoFilter` | bool | Filtre « jamais eu de réponse » |

Données à charger côté serveur : cohortes, pics, distribution des départs par âge, publications, territoires, écosystème, catalogue, journal, imports.

## Comportement responsive

Desktop prioritaire — c'est un outil de travail, aucun écran mobile spécifique n'est prévu.

Les tableaux larges sont enveloppés dans `overflow-x: auto` avec un `min-width` explicite (480 à 900 px selon le tableau) : ils défilent horizontalement plutôt que de comprimer les colonnes. Les grilles de cartes utilisent `repeat(auto-fit, minmax(Xpx, 1fr))`. Les gros chiffres utilisent `clamp()` + `white-space: nowrap` pour ne jamais se couper.

## Design tokens

Tous définis dans `_ds/…/tokens/`. Ne pas introduire d'autres valeurs.

**Couleurs**

| Token | Valeur | Usage |
|---|---|---|
| `--fond` | `#E9E6DF` | Fond de page |
| `--panneau` | `#F4F1EC` | Panneau, encarts de réserve |
| `--surface-creme` | `#FAF8F3` | Section douce, champs |
| `--carte-claire` | `#FFFFFF` | Carte |
| `--creme-fonce` | `#ECEBE8` | Fond de barre de progression |
| `--encre` | `#1C1A16` | Texte, barre latérale, cartes de contraste |
| `--text-muted` | `#5B564C` | Texte secondaire |
| `--vert-logo` | `#23CD8E` | Vert Bienfait — chiffre clé sur fond encre |
| `--vert-pastel` | `#E6F7EF` | Statut disponible, surface teintée |
| `--bleu` | `#05339C` | Accent, séries de données principales |
| `--bleu-clair` | `#0A44BE` | Variante de série |
| `--bleu-bg` | `#EAF0FB` | Panneau d'alertes, statut « nécessite un accès » |
| `--pastel-jaune` | `#F4DC94` | Avertissements, statut « import de plus » |
| `--bordure` | `#D3CEC5` | Ligne franche, champs |
| `--bordure-carte` | `#E7E3DB` | Contour de carte, lignes de tableau |

Gris de série neutre : `#A8A196` (cohortes antérieures à la rupture, départs). Nuances de bleu pour les séries multiples : `#0A44BE`, `#05339C`, `#123C8F`, `#2C4F9E`, `#4667B4`. **Deux verts autorisés, aucun autre. Aucun dégradé.**

**Typographie** — Plus Jakarta Sans (400–800), police unique. Titres d'écran 30 px/800/`-0.01em` ; titres de bloc 19 px/800 ; sous-titres 13 px muted ; corps 14-15 px, interligne 1,5-1,6 ; eyebrow 11 px majuscules `letter-spacing: 0.08em` ; chiffres clés 26-64 px/800 `-0.02em`. `font-variant-numeric: tabular-nums` sur toutes les colonnes chiffrées. `text-wrap: pretty` sur les paragraphes.

**Espacement** — échelle 4 px. Gouttières de grille 16 px, gaps internes de carte 12-18 px, padding de carte 24 px (20 px pour les lignes de catalogue), padding de page 32 px.

**Rayons** — cartes 18 px, champs et petits blocs 10-14 px, pilules et badges 999 px.

**Ombres** — `--ombre-carte` au repos (0 1px 2px, ~4 %), `--ombre-carte-hover` au survol (0 8px 24px, ~10 %).

**Animations** — transitions `.12s`/`.18s ease`. Survol : `translateY(-2px)` + ombre renforcée. Pas de bounce.

## Assets

Aucune image. Les vignettes de publication sont des placeholders `--creme-fonce` à remplacer par les visuels Instagram réels. Le logotype est purement typographique (composant `Logo`, Plus Jakarta Sans 800). Aucun système d'icônes n'est défini par le design system ; Lucide est la substitution recommandée, à valider.

## Données inventées, à remplacer

Le reste des chiffres provient d'une analyse réelle. Ces éléments-ci sont des hypothèses de maquette :

- La distribution des départs par âge d'abonnement (41 / 18 / 15 / 12 / 8 / 6 %), qui pilote la troncature à horizon commun et l'écran Diagnostic.
- Les parts nocturnes des pics et les multiples de ligne de base.
- Les arrivées à 48 h, les rétentions par territoire, les volumes de segments et les scores de risque.
- Les identifiants de comptes, les comptes de l'écosystème, les entrées du journal et les noms d'utilisateurs.

## Fichiers

| Fichier | Contenu |
|---|---|
| `Community Intelligence.dc.html` | Source du prototype : template HTML + classe de logique JavaScript |
| `Community Intelligence — autonome.html` | Version autonome, tout inliné, à ouvrir hors ligne |
| `support.js` | Runtime du prototype (artefact de l'outil de maquettage, à ne pas porter) |
| `_ds/…/tokens/*.css` | Tokens du design system Bienfait — couleurs, typographie, espacements |
| `_ds/…/_ds_bundle.js` | Composants React du design system : `Logo`, `Button`, `Badge`, `Chip`, `Card` |
| `_ds/…/readme.md` | Guide du design system Bienfait |
