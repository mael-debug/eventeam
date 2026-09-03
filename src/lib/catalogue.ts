// Référentiel du catalogue (écran Catalogue) — une dizaine de sujets que
// Community Intelligence sait couvrir aujourd'hui, en langage simple.
// Contenu produit intrinsèque (identique pour tous les clients), donc
// défini en code plutôt qu'en base — seul l'arbitrage du client
// (manual_entries, entity_type='feature_catalog') vient de la base.

export interface CatalogueSubject {
  slug: string;
  title: string;
  description: string;
  note?: string;
}

const RAW: { t: string; d: string; n?: string }[] = [
  {
    t: "Suivre la croissance de la communauté",
    d: "Le nombre d'abonnés, son évolution dans le temps, et une alerte dès que quelque chose sort de l'ordinaire.",
  },
  {
    t: "Savoir qui compose l'audience",
    d: "Pays, villes, âge, genre, jours où elle est la plus active — en chiffres globaux, jamais personne par personne.",
  },
  {
    t: "Voir qui arrive et qui part",
    d: "Combien de personnes rejoignent ou quittent la communauté chaque mois, et les moments où ça s'accélère.",
  },
  {
    t: "Savoir si les nouveaux abonnés restent",
    d: "Suivre dans le temps si les personnes recrutées un mois donné sont toujours là 30, 60 ou 90 jours plus tard.",
  },
  {
    t: "Comparer les publications entre elles",
    d: "Portée, interactions et abonnés gagnés par publication, pour voir ce qui fonctionne le mieux.",
  },
  {
    t: "Suivre les échanges avec la communauté",
    d: "La part des messages et commentaires qui obtiennent une réponse, en global.",
  },
  {
    t: "Retrouver qui est parti",
    d: "La liste des personnes qui ont quitté la communauté, avec leur ancienneté, exportable en un clic.",
  },
  {
    t: "Suivre la mise à jour des données",
    d: "Voir quand les données ont été actualisées, et être alerté si le rythme ralentit.",
  },
  {
    t: "Gérer les accès de l'équipe",
    d: "Décider qui, dans l'équipe, peut voir quoi et modifier les réglages.",
  },
  {
    t: "Mesurer l'effet des campagnes payantes",
    d: "Le coût réel par abonné qui reste dans le temps, pas seulement par abonné recruté.",
    n: "Nécessite un accès supplémentaire au Gestionnaire de publicités.",
  },
];

function slugify(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const CATALOGUE: CatalogueSubject[] = RAW.map((it) => ({
  slug: slugify(it.t),
  title: it.t,
  description: it.d,
  note: it.n,
}));

export const CATALOGUE_TOTAL = CATALOGUE.length;

export type CatalogueRating = "Indispensable" | "Souhaitable" | "Sans intérêt";
export const CATALOGUE_RATINGS: CatalogueRating[] = ["Indispensable", "Souhaitable", "Sans intérêt"];
