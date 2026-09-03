// Page Intro — réponses aux questions métier posées explicitement par Eden
// Park. Contenu condensé (peu de bullets, une idée par ligne) mais fidèle
// au brief validé : ne pas reformuler les statuts (yes/partial/no) ni les
// réserves sans revalider avec le métier. aiNote précise, pour chaque
// question, ce que l'IA ajoute sans jamais inventer une donnée absente.

export type QStatus = "yes" | "partial" | "no";

export interface EdenParkQuestion {
  n: number;
  question: string;
  status: QStatus;
  statusNote?: string;
  canMeasure: string[];
  cannotKnow: string[];
  dataNeeded: string[];
  takeaway: string;
  aiNote: string;
}

export const EDEN_PARK_QUESTIONS: EdenParkQuestion[] = [
  {
    n: 1,
    question: "Peut-on mieux connaître les personas de nos followers et les comparer à ceux de nos acheteurs physiques ?",
    status: "partial",
    statusNote: "Oui en agrégé",
    canMeasure: ["Profil agrégé de l'audience : genre, âge, pays, villes, comportement avec le contenu"],
    cannotKnow: ["Le profil d'un follower précis — jamais un nom associé à un âge ou une ville"],
    dataNeeded: ["Exports mensuels", "Base CRM / magasin Eden Park"],
    takeaway: "Comparée à une base CRM, l'audience Instagram peut être confrontée à la clientèle magasin — toujours en agrégé.",
    aiNote: "L'IA résume l'écart en une phrase lisible (« audience plus jeune que la clientèle magasin ») — jamais en reliant une personne Instagram à un acheteur.",
  },
  {
    n: 2,
    question: "Est-il possible d'identifier les différentes communautés présentes dans l'audience ?",
    status: "yes",
    statusNote: "Plusieurs types de communautés",
    canMeasure: ["Communautés démographiques, d'acquisition, de comportement (fans actifs, créateurs) et écosystème stratégique (partenaires, médias)"],
    cannotKnow: ["Les centres d'intérêt privés de l'ensemble des followers"],
    dataNeeded: ["Exports mensuels", "Interactions captées"],
    takeaway: "L'audience peut être regroupée en catégories actionnables : Fans actifs, Créateurs, Partenaires, Communauté internationale.",
    aiNote: "L'IA nomme et résume ces groupes à partir des signaux observés — jamais en assignant une personne précise à un groupe.",
  },
  {
    n: 3,
    question: "Peut-on savoir à partir de quel contenu les personnes se désabonnent ?",
    status: "partial",
    canMeasure: ["Un départ observé entre deux dates, et ce qui a été publié pendant cette fenêtre"],
    cannotKnow: ["Le lien direct entre un post précis et un départ précis"],
    dataNeeded: ["Deux snapshots successifs"],
    takeaway: "On peut montrer une corrélation temporelle, jamais une causalité prouvée.",
    aiNote: "L'IA peut signaler une coïncidence à investiguer — jamais affirmer qu'un post a fait fuir des abonnés.",
  },
  {
    n: 4,
    question: "Peut-on connaître le jour ou la date exacte du désabonnement ?",
    status: "no",
    statusNote: "Pas avec un export mensuel",
    canMeasure: ["Une fenêtre de départ entre deux snapshots ; un jour de perte anormale, si l'API collecte au quotidien"],
    cannotKnow: ["La date exacte du départ d'une personne nommée"],
    dataNeeded: ["Exports rapprochés", "Collecte quotidienne API"],
    takeaway: "On peut dire « le compte a perdu beaucoup de followers le 14 septembre », jamais « @john est parti ce jour-là ».",
    aiNote: "L'IA peut repérer ce type de journée anormale dans la série de chiffres — jamais en déduire l'identité de la personne partie.",
  },
  {
    n: 5,
    question: "Les unfollows sont-ils liés à un contenu feed, une publicité, ou du contenu géolocalisé ?",
    status: "partial",
    statusNote: "En corrélation, jamais en preuve",
    canMeasure: ["Feed organique : reach, engagement et churn autour d'une publication", "Paid / e-commerce : possible en ajoutant Marketing API et analytics"],
    cannotKnow: ["Qu'une campagne a « causé » des départs"],
    dataNeeded: ["Marketing API (si autorisée)", "Analytics e-commerce"],
    takeaway: "Exemple fictif : +38 % de sessions et +22 % de ventes, mais un churn x1,8 sur la même période — un signal à investiguer, jamais une preuve.",
    aiNote: "L'IA formule l'hypothèse à vérifier (« la campagne coïncide avec une hausse du churn ») — jamais la conclusion causale.",
  },
  {
    n: 7,
    question: "Peut-on analyser plus précisément les profils des abonnés et des personnes qui se désabonnent ?",
    status: "partial",
    canMeasure: ["Ce qu'on savait avant un départ : ancienneté, interactions, cohorte d'acquisition", "Pour ceux qui interagissent : commentaires, DM, follow mutuel"],
    cannotKnow: ["Des attributs personnels non déclarés publiquement"],
    dataNeeded: ["Interactions captées", "Graph API pour l'enrichissement"],
    takeaway: "On peut voir si les personnes qui partent sont surtout des arrivées récentes, ou recrutées lors d'un pic particulier.",
    aiNote: "L'IA compare les profils de ceux qui partent à ceux qui restent, et résume les écarts significatifs.",
  },
  {
    n: 8,
    question: "Peut-on connaître les comptes suivis par nos followers ?",
    status: "no",
    canMeasure: [],
    cannotKnow: ["La liste des comptes suivis par chaque follower — ni l'export ni l'API Meta ne la fournissent pour toute l'audience"],
    dataNeeded: [],
    takeaway: "À ne jamais proposer : « nous allons analyser toutes les marques que suivent les 100 000 followers ».",
    aiNote: "Aucune IA ne comble ce manque : elle ne devine pas une donnée que la source ne fournit pas.",
  },
  {
    n: 9,
    question: "Peut-on connaître les marques et contenus avec lesquels nos followers interagissent ailleurs sur Instagram ?",
    status: "no",
    canMeasure: ["Leurs interactions avec Eden Park elles-mêmes"],
    cannotKnow: ["L'historique privé d'interactions d'un follower avec d'autres comptes"],
    dataNeeded: [],
    takeaway: "On ne pourra jamais écrire « @john aime Nike, Lacoste et Ralph Lauren » sans preuve directe.",
    aiNote: "Même limite : l'IA ne complète pas une donnée absente par une supposition plausible.",
  },
  {
    n: 10,
    question: "Peut-on connaître leurs centres d'intérêt ?",
    status: "partial",
    statusNote: "Par affinité observée",
    canMeasure: ["Des affinités observées avec les contenus Eden Park : rugby, produit, ambassadeurs, lifestyle"],
    cannotKnow: ["Les centres d'intérêt privés, en dehors du comportement avec Eden Park"],
    dataNeeded: ["Exports mensuels avec interactions par contenu"],
    takeaway: "On parle toujours d'« affinité observée », jamais de « centre d'intérêt certain ».",
    aiNote: "L'IA peut regrouper ces affinités en segments lisibles (ex. fictif : « Rugby & Heritage », « Fashion discovery ») — des segments, jamais des portraits individuels.",
  },
];

export const SYNTHESIS_ROWS: { question: string; status: QStatus; text: string }[] = [
  { question: "Personas followers", status: "yes", text: "Oui, agrégés" },
  { question: "Comparer followers et acheteurs magasins", status: "yes", text: "Oui, si Eden Park fournit les données CRM / magasin" },
  { question: "Identifier des communautés", status: "yes", text: "Oui, plusieurs types de communautés" },
  { question: "Connaître les unfollowers", status: "yes", text: "Oui, entre deux snapshots complets successifs" },
  { question: "Date exacte d'un unfollow nominatif", status: "no", text: "Non" },
  { question: "Période d'un unfollow", status: "yes", text: "Oui" },
  { question: "Contenu exact responsable d'un unfollow", status: "no", text: "Non" },
  { question: "Corréler contenus et churn", status: "yes", text: "Oui, en corrélation" },
  { question: "Corréler campagnes paid et churn", status: "yes", text: "Oui, avec la Marketing API" },
  { question: "Corréler e-commerce et churn", status: "yes", text: "Oui, avec des analytics e-commerce en plus" },
  { question: "Géolocalisation des campagnes", status: "partial", text: "Selon les données paid disponibles" },
  { question: "Comptes suivis par tous les followers", status: "no", text: "Non" },
  { question: "Marques aimées par les followers ailleurs", status: "no", text: "Non" },
  { question: "Affinités déduites des interactions Eden Park", status: "yes", text: "Oui" },
  { question: "Profils très actifs, créateurs, DM", status: "yes", text: "Oui, encore plus avec la Graph API" },
  { question: "Âge / genre / ville d'une personne précise", status: "no", text: "Non" },
  { question: "Âge / genre / ville de l'audience agrégée", status: "yes", text: "Oui" },
];
