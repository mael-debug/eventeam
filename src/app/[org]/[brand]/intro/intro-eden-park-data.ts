// Page Intro — réponses aux questions métier posées explicitement par Eden
// Park. Contenu condensé (peu de bullets, une idée par ligne) mais fidèle
// au brief validé : ne pas reformuler les statuts (yes/partial/no) ni les
// réserves sans revalider avec le métier. Vocabulaire volontairement sans
// jargon technique ("API", "webhook"…) : on décrit ce qui est concrètement
// suivi (temps de visionnage, minute où les gens décrochent…), jamais le
// nom d'une interface technique.

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
  },
  {
    n: 3,
    question: "Peut-on savoir à partir de quel contenu les personnes se désabonnent ?",
    status: "partial",
    canMeasure: ["Un départ observé entre deux dates, et ce qui a été publié pendant cette fenêtre"],
    cannotKnow: ["Le lien direct entre un post précis et un départ précis"],
    dataNeeded: ["Deux snapshots successifs"],
    takeaway: "On peut montrer une corrélation temporelle, jamais une causalité prouvée.",
  },
  {
    n: 4,
    question: "Peut-on connaître le jour ou la date exacte du désabonnement ?",
    status: "no",
    statusNote: "Pas avec un export mensuel",
    canMeasure: ["Une fenêtre de départ entre deux snapshots ; un jour de perte anormale, si on suit les chiffres au quotidien"],
    cannotKnow: ["La date exacte du départ d'une personne nommée"],
    dataNeeded: ["Exports rapprochés", "Suivi quotidien des chiffres"],
    takeaway: "On peut dire « le compte a perdu beaucoup de followers le 14 septembre », jamais « @john est parti ce jour-là ».",
  },
  {
    n: 5,
    question: "Les unfollows sont-ils liés à un contenu feed, une publicité, ou du contenu géolocalisé ?",
    status: "partial",
    statusNote: "En corrélation, jamais en preuve",
    canMeasure: ["Feed organique : reach, engagement et churn autour d'une publication", "Paid / e-commerce : possible en ajoutant les données de campagnes et les statistiques du site"],
    cannotKnow: ["Qu'une campagne a « causé » des départs"],
    dataNeeded: ["Données de campagnes payantes (si accès autorisé)", "Statistiques du site"],
    takeaway: "Exemple fictif : +38 % de sessions et +22 % de ventes, mais un churn x1,8 sur la même période — un signal à investiguer, jamais une preuve.",
  },
  {
    n: 7,
    question: "Peut-on analyser plus précisément les profils des abonnés et des personnes qui se désabonnent ?",
    status: "partial",
    canMeasure: ["Ce qu'on savait avant un départ : ancienneté, interactions, cohorte d'acquisition", "Pour ceux qui interagissent : commentaires, DM, follow mutuel"],
    cannotKnow: ["Des attributs personnels non déclarés publiquement"],
    dataNeeded: ["Interactions captées", "Suivi plus poussé des profils qui interagissent"],
    takeaway: "On peut voir si les personnes qui partent sont surtout des arrivées récentes, ou recrutées lors d'un pic particulier.",
  },
  {
    n: 8,
    question: "Peut-on connaître les comptes suivis par nos followers ?",
    status: "no",
    canMeasure: [],
    cannotKnow: ["La liste des comptes suivis par chaque follower — aucune source ne la fournit pour toute l'audience"],
    dataNeeded: [],
    takeaway: "À ne jamais proposer : « nous allons analyser toutes les marques que suivent les 100 000 followers ».",
  },
  {
    n: 9,
    question: "Peut-on connaître les marques et contenus avec lesquels nos followers interagissent ailleurs sur Instagram ?",
    status: "no",
    canMeasure: ["Leurs interactions avec Eden Park elles-mêmes"],
    cannotKnow: ["L'historique privé d'interactions d'un follower avec d'autres comptes"],
    dataNeeded: [],
    takeaway: "On ne pourra jamais écrire « @john aime Nike, Lacoste et Ralph Lauren » sans preuve directe.",
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
  },
];
