# Bienfait — Design System

**Bienfait** est une agence de digitalisation et d'IA (francophone). Elle cadre, automatise et déploie des cas d'usage IA pour ses clients — de l'atelier de priorisation à la mise en production, avec leurs équipes. Le système visuel est **chaleureux et professionnel** : fond crème, vert Bienfait, touches pastel et accents Playfair.

## Sources fournies
- Sources : (1) codebase monté `Design System/` (tokens/composants d'origine) ; (2) **site de référence `Deep Dive Paul.html`** — le futur site « parfait », dont les tokens réels ont été extraits (Plus Jakarta Sans, verts, **bleu #05339C**, tuiles inclinées) et sur lesquels le DS est désormais aligné.
- **Aucun logo, aucune police binaire, aucun écran produit / Figma** n'a été fourni. Voir les caveats plus bas.

---

## CONTENT FUNDAMENTALS (ton & rédaction)
- **Langue : français**, systématiquement. Interface et copy en français.
- **Voix : « nous »** (l'agence) s'adressant à **« vous »** (le client). Ex. « Nous cadrons, automatisons et déployons vos cas d'usage. »
- **Ton : chaleureux et professionnel**, concret, sans jargon. On promet du réalisme : « une feuille de route réaliste », « pas de facturation à la surprise ».
- **Casse : phrase** (sentence case) pour les titres et boutons — pas de Title Case anglo. Les eyebrows (sur-titres) sont en MAJUSCULES avec interlettrage (`--ls-eyebrow`).
- **Nom de marque en minuscules** dans le logotype (« bienfait »), en Plus Jakarta Sans 800. Jeu de mots récurrent sur « avec bienfait » / « bienfait ».
- **Emoji : non.** Aucun emoji dans l'UI de marque.
- **Chiffres & prix** en format français : espace insécable + « € » (« 4 900 € »), « Sur devis ».
- **Vibe :** rassurant, artisanal, haut de gamme mais accessible. On valorise l'accompagnement humain (« avec vos équipes », « en français »).

## VISUAL FOUNDATIONS
- **Couleurs.** Base crème terreuse (`--fond #E9E6DF`, panneau `--panneau #F4F1EC`, section `--surface-creme #FAF8F3`, carte `--carte-claire #FFFFFF`) ; encre chaude `--encre #1C1A16` pour le texte, encre bleutée `--encre-froide #1E2A3A` pour les ombres. Marque = **vert Bienfait** (`--vert-logo #23CD8E`) et **vert pastel** (`--vert-pastel #E6F7EF`) — ce sont les **deux seuls verts autorisés, aucun autre jamais**. Accent = **bleu profond** (`--bleu #05339C`, clair `#0A44BE`), surface teintée `--bleu-bg #EAF0FB`. **Aucun dégradé, nulle part.** Bordures froídes fines : `--bordure #D3CEC5`, `--bordure-carte #E7E3DB`. Les pastels jaune/violet sont **secondaires**. Aligné sur le site de référence.
- **Typographie.** **Plus Jakarta Sans (400–800) est LA police unique de la marque** — titres (800), interface, corps et logotype. Plus de Playfair. Emphase = couleur (vert) ou graisse, jamais italique. Titres interlignage serré (1.1), corps généreux (1.6), `text-wrap: pretty`. Interlettrage titres légèrement négatif.
- **Espacement.** Échelle base 4px (4 → 96). Contenu centré, largeur max `--max-contenu 1160px`, padding latéral 32px.
- **Coins / rayons.** Cartes **18px**, champs 12px, boutons et chips en **pilule** (999px). Signature visuelle : le contraste entre grandes cartes arrondies et pilules.
- **Bordures.** Fines, chaudes : `--bordure #DED5C4` (UI), `--bordure-carte #E4DCCD` (cartes claires). 1px, jamais épaisses.
- **Ombres / élévation.** Douces et basses : `--ombre-carte` (0 1px 2px, ~4% opacité) au repos ; `--ombre-carte-hover` (0 8px 24px, ~10%) et `--ombre-flottante` (0 16px 40px, ~14%) pour les éléments mis en avant. Pas d'ombres dures ni colorées.
- **Fonds & textures.** Aplats crème unis, pas de dégradés agressifs, pas de bruit/grain, pas d'illustrations dessinées. Les sections « infra » utilisent l'aplat encre pour le contraste. Header translucide (`rgba(...,0.82)` + `backdrop-filter: blur(10px)`).
- **Transparence & flou.** Réservés au header collant (crème translucide floutée). Sinon opacité pleine.
- **Motif signature.** **Tuiles / vignettes légèrement inclinées** (`--tilt-sm -3deg`, `--tilt-md 7deg`, `--tilt-lg -12deg`) — rotations ludiques ponctuelles sur cartes et images, jamais sur le texte courant. Prop `tilt` du composant `Card`.
- **Animations.** Sobres : transitions `.12s`/`.18s ease`. **Hover** = léger `translateY(-1px/-2px)` + renforcement d'ombre. Pas de bounce, pas de gros mouvements. **Press** : retour à `translateY(0)`.
- **États.** Hover boutons : légère montée. Désactivé : `opacity: .5`, curseur `not-allowed`. Focus : anneau vert (`--focus-ring`).
- **Cartes.** Trois traitements : `claire` (fond `#FFFDF8`, fin contour, ombre douce), `encre` (aplat sombre, contraste fort — sections techniques), `pastel` (fond violet ludique — bento). En-tête normalisé optionnel : numéro `01/02` discret + titre gras Jakarta.
- **Imagerie.** Aucune fournie. Si ajoutée : privilégier des tons chauds cohérents avec la palette crème.

## ICONOGRAPHY
- **Aucun système d'icônes n'est défini dans les sources** (pas d'icon-font, pas de SVG, pas de sprite). Aucun asset d'icône n'a donc pu être copié.
- **Substitution recommandée : [Lucide](https://lucide.dev)** (trait fin, arrondi, ~1.75px) — cohérent avec l'esthétique douce et arrondie de la marque. À charger depuis CDN dans les prototypes. **Ceci est une substitution à valider.**
- **Emoji : non** (voir Content Fundamentals). **Unicode** utilisé avec parcimonie (ex. « ✓ » pour les listes de forfaits, point vert de statut via pseudo-élément).
- Les **chips** servent à afficher des logos partenaires / intégrations ; fournir les vrais logos SVG le cas échéant.

---

## Index / manifeste

**Racine**
- `styles.css` — point d'entrée global (uniquement des `@import`).
- `thumbnail.html` — vignette du système (logotype sur vert).
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `base.css`, `fonts.css`.
- `readme.md` — ce document.
- `SKILL.md` — mode d'emploi Agent Skills.

**Composants** (`components/` — namespace runtime `window.BienfaitDesignSystem_6e2c75`)
- `Logo` (`brand/`) — wordmark typographique « Bienfait » (Plus Jakarta Sans 800). Purement typographique, pas de monogramme ni de tuile. Couleurs `encre`/`vert`/`creme`/`blanc`/`inverse`.
- `Button` — bouton pilule, variantes `primaire` / `encre` / `secondaire` / `lien`, tailles `sm/md/lg`.
- `Badge` — étiquette pastel, variantes `forfait` / `temps` / `cadrage` / `accent` / `statut`.
- `Chip` — étiquette outil / intégration (fond crème, contour).
- `Card` — conteneur arrondi, variantes `claire` / `encre` / `pastel`, en-tête `num`/`title`.

**Spécimens (Design System tab)** : `guidelines/*.card.html` — couleurs (verts, fondations, pastel), type (titres, corps, échelle), espacement, rayons & élévation.

**UI kits** (`ui_kits/`)
- `site-marketing/` — page d'accueil agence (héros, bento services, forfaits, footer). **Illustrative** (aucun écran produit fourni).

## Intentional additions
- **`Logo`** (`components/brand/`) — wordmark typographique « Bienfait » en Jakarta (pas de monogramme/tuile, choix client). Le reste de l'inventaire suit exactement les sources (Button, Badge, Chip, Card). Le UI kit `site-marketing` est un ajout illustratif signalé.

## CAVEATS
1. **Polices** : aucun binaire fourni. Plus Jakarta Sans (police unique) est chargée depuis le **CDN Google Fonts** (`tokens/fonts.css`). Fournissez les fichiers si un hébergement auto est requis. *(Le compilateur signale « 0 fonts » car les `@font-face` vivent côté CDN — comportement attendu.)*
2. **Logo** : la marque est **purement typographique** — le nom « Bienfait » en Plus Jakarta Sans 800 (composant `Logo`). Pas de monogramme, pas de mark dans un carré.
3. **Iconographie** : aucun set fourni ; **Lucide** proposé en substitution — à valider.
4. **UI kit** : aucun écran produit / Figma fourni ; le kit `site-marketing` est une recreation illustrative fondée sur la marque, à remplacer par un écran fidèle si une source existe.
