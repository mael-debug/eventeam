// Référentiel des 42 fonctionnalités du catalogue (écran Catalogue).
// Contenu produit intrinsèque (identique pour tous les clients), donc
// défini en code plutôt qu'en base — seul le compteur "n / 42 arbitrées"
// et les arbitrages eux-mêmes viennent de la base (manual_entries,
// entity_type='feature_catalog'), jamais ce référentiel lui-même.

export type CatalogueStatus = "dispo" | "import" | "acces" | "impossible";

export interface CatalogueFeature {
  slug: string;
  module: string;
  title: string;
  status: CatalogueStatus;
  warning?: string;
}

export interface CatalogueGroup {
  module: string;
  items: CatalogueFeature[];
}

const RAW: { m: string; items: { t: string; s: CatalogueStatus; w?: string }[] }[] = [
  {
    m: "Vue d'ensemble",
    items: [
      { t: "Compteur d'abonnés et évolution sur la période", s: "dispo" },
      { t: "Alertes automatiques sur divergence portée / conversion", s: "dispo" },
      { t: "Objectif de part géographique et écart à la cible", s: "dispo" },
      { t: "Rapport mensuel envoyé par e-mail", s: "import", w: "Nécessite deux imports consécutifs dans le mois." },
    ],
  },
  {
    m: "Audience",
    items: [
      { t: "Répartition par pays et par ville", s: "dispo" },
      { t: "Répartition par âge et par genre", s: "dispo" },
      { t: "Trajectoire de la part France face à l'objectif", s: "dispo" },
      { t: "Activité de l'audience par jour de semaine", s: "dispo" },
      { t: "Activité par heure de la journée", s: "impossible", w: "L'export ne contient aucune granularité horaire." },
      { t: "Centres d'intérêt déclarés des abonnés", s: "impossible", w: "Meta n'expose ces données sur aucun export." },
    ],
  },
  {
    m: "Croissance",
    items: [
      { t: "Courbe des arrivées et des départs", s: "dispo" },
      { t: "Détection des pics d'acquisition", s: "dispo" },
      { t: "Comptes renommés distingués des départs", s: "import", w: "Nécessite un import de plus pour confirmer la persistance de l'identifiant." },
      { t: "Date exacte de désabonnement", s: "impossible", w: "Meta n'expose aucun événement de désabonnement." },
      { t: "Motif de désabonnement", s: "impossible", w: "Aucune donnée déclarative n'existe côté Instagram." },
    ],
  },
  {
    m: "Acquisition",
    items: [
      { t: "Tableau de survie par cohorte hebdomadaire", s: "dispo" },
      { t: "Courbe de survie en jours depuis l'arrivée", s: "dispo" },
      { t: "Simulateur de coût par abonné encore présent", s: "dispo" },
      { t: "Rattachement d'une cohorte à une campagne nommée", s: "acces", w: "Bloqueur : Gestionnaire de publicités." },
      { t: "Coût réel par campagne et par création", s: "acces", w: "Bloqueur : Gestionnaire de publicités." },
      { t: "Ciblage utilisé par chaque campagne", s: "acces", w: "Bloqueur : Gestionnaire de publicités." },
    ],
  },
  {
    m: "Contenu",
    items: [
      { t: "Portée, impressions et interactions par publication", s: "dispo" },
      { t: "Taux de conversion en abonnés par publication", s: "dispo" },
      { t: "Comparatif Reels contre posts", s: "dispo" },
      { t: "Détection portée forte / conversion faible", s: "dispo" },
      { t: "Attribution d'un abonné à la publication qui l'a amené", s: "impossible", w: "L'export ne relie aucun abonné à une publication." },
      { t: "Performance des stories au-delà de 24 heures", s: "impossible", w: "Meta ne conserve pas l'historique des stories dans l'export." },
    ],
  },
  {
    m: "Écosystème",
    items: [
      {
        t: "Liste des comptes professionnels suivis",
        s: "impossible",
        w: "Vérifié sur un export réel : le fichier de métadonnées de conversation identifie chaque discussion par un identifiant Meta interne (fbid), sans aucune correspondance avec le pseudo Instagram des comptes suivis ou abonnés — impossible de nommer les comptes concernés.",
      },
      {
        t: "Réciprocité du suivi",
        s: "impossible",
        w: "Même limite que ci-dessus : aucune jointure possible entre une discussion et un compte suivi nommé.",
      },
      {
        t: "Réponse obtenue ou non aux sollicitations",
        s: "dispo",
        w: "Disponible en agrégat sur l'ensemble des discussions (part ayant obtenu une réponse), lu dans les métadonnées de conversation sans ouvrir le contenu des messages — jamais par compte nommé, pour la même raison que ci-dessus.",
      },
      {
        t: "Palier d'audience des comptes tiers",
        s: "impossible",
        w: "Vérifié sur un export réel (2967 discussions, 13 indicateurs par discussion) : aucun champ de palier d'audience n'existe dans ce fichier. Ce n'est pas un défaut de parseur, la donnée n'est simplement pas exportée par Meta.",
      },
      {
        t: "Audience des comptes tiers",
        s: "impossible",
        w: "Même constat que le palier d'audience : aucun champ d'audience n'existe dans les métadonnées de conversation exportées par Meta.",
      },
    ],
  },
  {
    m: "Listes nominatives",
    items: [
      { t: "Liste des comptes partis sur la cohorte suivie", s: "dispo" },
      { t: "Ancienneté au moment du départ", s: "dispo" },
      { t: "Export CSV journalisé", s: "dispo" },
      { t: "Demande d'effacement d'un compte", s: "dispo" },
    ],
  },
  {
    m: "Imports",
    items: [
      { t: "Frise des fenêtres d'import et de leurs recouvrements", s: "dispo" },
      { t: "Inventaire des fichiers ignorés avec motif", s: "dispo" },
      { t: "Alerte de cadence d'import", s: "dispo" },
      { t: "Ingestion automatique sans dépôt manuel", s: "acces", w: "Bloqueur : accès API partenaire Meta." },
    ],
  },
  {
    m: "Paramètres",
    items: [
      { t: "Autorisation d'accès aux identités pour le compte client", s: "dispo" },
      { t: "Gestion des membres et des rôles", s: "dispo" },
    ],
  },
];

function slugify(module: string, title: string): string {
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  return `${norm(module)}--${norm(title)}`;
}

export const CATALOGUE: CatalogueGroup[] = RAW.map((g) => ({
  module: g.m,
  items: g.items.map((it) => ({ slug: slugify(g.m, it.t), module: g.m, title: it.t, status: it.s, warning: it.w })),
}));

export const CATALOGUE_TOTAL = CATALOGUE.reduce((acc, g) => acc + g.items.length, 0);

export const CATALOGUE_STATUS_LABEL: Record<CatalogueStatus, string> = {
  dispo: "Disponible",
  import: "Nécessite un import de plus",
  acces: "Nécessite un accès",
  impossible: "Impossible",
};

export const CATALOGUE_STATUS_STYLE: Record<CatalogueStatus, { bg: string; fg: string; bd: string }> = {
  dispo: { bg: "var(--vert-pastel)", fg: "var(--bleu)", bd: "#BFE7D6" },
  import: { bg: "var(--pastel-jaune)", fg: "var(--encre)", bd: "#E3C96F" },
  acces: { bg: "var(--bleu-bg)", fg: "var(--bleu)", bd: "#C3D2EE" },
  impossible: { bg: "var(--encre)", fg: "#FAF8F3", bd: "var(--encre)" },
};

export type CatalogueRating = "Indispensable" | "Souhaitable" | "Sans intérêt";
export const CATALOGUE_RATINGS: CatalogueRating[] = ["Indispensable", "Souhaitable", "Sans intérêt"];
