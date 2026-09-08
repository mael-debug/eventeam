// Référentiel du catalogue (écran Catalogue) — dix sujets, calqués sur ce
// qui est documenté sur Import / API (src/app/[org]/[brand]/analyse/
// page.tsx) : le client choisit ses priorités parmi des capacités réelles,
// pas des concepts abandonnés (cohortes de survie, ecosystem chat...).
// Contenu produit intrinsèque (identique pour tous les clients), donc
// défini en code plutôt qu'en base — seul l'arbitrage du client
// (manual_entries, entity_type='feature_catalog') vient de la base.
//
// `slug` est saisi à la main, indépendant du titre : un slug dérivé du
// titre (ancien comportement) se recalcule dès qu'on reformule un intitulé,
// ce qui orpheline silencieusement l'avis déjà donné par le client en base
// (constaté : la ligne "vue-d-ensemble--..." d'un ancien intitulé n'est
// plus rattachée à rien). Le slug ne doit plus jamais changer une fois
// publié, même si le titre est retouché ensuite.

export interface CatalogueSubject {
  slug: string;
  title: string;
  description: string;
  note?: string;
}

export const CATALOGUE: CatalogueSubject[] = [
  {
    // Slug conservé tel quel (ancien intitulé "Suivre la croissance de la
    // communauté") : un avis client réel est déjà enregistré dessus.
    slug: "suivre-la-croissance-de-la-communaute",
    title: "Suivre la croissance des abonnés",
    description: "Le nombre d'abonnés, son évolution et la part de croissance organique, mois après mois.",
    note: "Déjà actif.",
  },
  {
    slug: "voir-qui-arrive-et-qui-part",
    title: "Voir qui arrive et qui part, nommément",
    description: "Qui est nouveau, qui est revenu, qui a quitté la communauté — en comparant les deux derniers imports.",
    note: "Déjà actif.",
  },
  {
    slug: "retrouver-qui-est-parti",
    title: "Retrouver qui est parti, avec ancienneté",
    description: "La liste des personnes qui ont quitté, avec la durée de leur abonnement, exportable en un clic.",
    note: "Déjà actif.",
  },
  {
    slug: "suivre-la-portee-et-l-engagement",
    title: "Suivre la portée et l'engagement du compte",
    description: "Comptes touchés, interactions, j'aime, commentaires, enregistrements — jour par jour et par format.",
    note: "Nécessite le branchement de l'API Instagram (déjà documenté).",
  },
  {
    slug: "comparer-les-publications",
    title: "Comparer les publications entre elles",
    description: "Portée, interactions et abonnements générés, publication par publication, pour voir ce qui fonctionne le mieux.",
    note: "Nécessite le branchement de l'API Instagram (déjà documenté).",
  },
  {
    slug: "suivre-les-commentaires-en-direct",
    title: "Suivre les commentaires en direct",
    description: "Chaque commentaire reçu apparaît en temps réel, sans recharger la page.",
    note: "Nécessite le branchement de l'API Instagram (webhook, déjà documenté).",
  },
  {
    slug: "classer-les-meilleurs-commentateurs",
    title: "Classer les meilleurs commentateurs",
    description: "Qui commente le plus souvent — un classement qui s'affine à mesure que l'historique s'accumule.",
    note: "Nécessite le branchement de l'API Instagram (déjà documenté).",
  },
  {
    slug: "suivre-la-performance-des-stories",
    title: "Suivre la performance des stories",
    description: "Portée, vues et navigation de chaque story, tant qu'elle reste disponible (24 h).",
    note: "Nécessite le branchement de l'API Instagram (déjà documenté).",
  },
  {
    slug: "connaitre-le-profil-de-l-audience",
    title: "Connaître le profil de l'audience",
    description: "Pays, villes, âge, genre des abonnés — en chiffres globaux, jamais personne par personne.",
    note: "Nécessite le branchement de l'API Instagram (déjà documenté).",
  },
  {
    slug: "suivre-les-mentions-et-la-concurrence",
    title: "Suivre les mentions et la concurrence",
    description: "Être alerté quand la marque est mentionnée, et se comparer aux comptes concurrents publics.",
    note: "Nécessite le branchement de l'API Instagram (déjà documenté).",
  },
];

export const CATALOGUE_TOTAL = CATALOGUE.length;

export type CatalogueRating = "Indispensable" | "Souhaitable" | "Sans intérêt";
export const CATALOGUE_RATINGS: CatalogueRating[] = ["Indispensable", "Souhaitable", "Sans intérêt"];
