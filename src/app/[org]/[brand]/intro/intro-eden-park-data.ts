// Page Intro — réponses aux questions métier posées explicitement par Eden
// Park. Contenu condensé mais fidèle au brief validé : ne pas reformuler les
// statuts (yes/partial/no) ni les réserves sans revalider avec le métier.

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
    statusNote: "Oui pour une analyse agrégée, très utile",
    canMeasure: [
      "Répartition agrégée : genre, tranches d'âge, principaux pays et villes",
      "Jours d'activité, et évolution de ces répartitions mois après mois",
      "Comportement global : reach, interactions, formats qui fonctionnent, acquisition, rétention",
    ],
    cannotKnow: ["Le profil d'un follower précis — jamais « @username, homme, 35 ans, Paris »"],
    dataNeeded: ["Exports mensuels", "Base CRM / magasin Eden Park (âge, ville, panier moyen…) pour la comparaison"],
    takeaway:
      "Avec ces deux bases, on peut comparer l'audience Instagram à la clientèle physique : est-elle plus jeune ? Certaines zones sont-elles surreprésentées ? Toujours en agrégé — jamais en reliant une personne Instagram à un acheteur précis.",
  },
  {
    n: 2,
    question: "Est-il possible d'identifier les différentes communautés présentes dans l'audience ?",
    status: "yes",
    statusNote: "Pour plusieurs types de communautés ; partiel pour les centres d'intérêt individuels",
    canMeasure: [
      "Communautés démographiques : pays, villes, âge, genre (agrégé)",
      "Communautés d'acquisition : arrivées pendant une même période, une campagne, un pic de croissance",
      "Communautés de comportement : fans actifs, créateurs, comptes vérifiés, profils qui reviennent",
      "Écosystème stratégique : athlètes, clubs, médias, influenceurs, partenaires",
    ],
    cannotKnow: ["Les centres d'intérêt privés de l'ensemble des followers — seulement des affinités observées avec le contenu Eden Park"],
    dataNeeded: ["Exports mensuels", "Interactions (commentaires, réponses story, DM) si captées", "Graph API pour aller plus loin sur l'écosystème"],
    takeaway:
      "On peut construire des groupes utiles à l'action : Fans actifs, Créateurs, Partenaires, Communauté internationale — uniquement à partir de signaux réellement observés.",
  },
  {
    n: 3,
    question: "Peut-on savoir à partir de quel contenu les personnes se désabonnent ?",
    status: "partial",
    canMeasure: [
      "Qu'un compte était présent au snapshot précédent et absent au suivant → un départ observé entre deux dates",
      "Ce qui s'est passé pendant cette fenêtre : posts, campagnes, événements, pics de reach",
    ],
    cannotKnow: ["Le lien direct entre un post précis et un départ précis — Instagram ne relie jamais un unfollow à un contenu"],
    dataNeeded: ["Deux snapshots successifs", "Calendrier de publication et de campagnes sur la même période"],
    takeaway: "On peut montrer une corrélation temporelle (les départs augmentent autour de ce contenu), jamais une causalité prouvée.",
  },
  {
    n: 4,
    question: "Peut-on connaître le jour ou la date exacte du désabonnement ?",
    status: "no",
    statusNote: "Pas exactement, avec un export mensuel",
    canMeasure: [
      "Avec deux snapshots mensuels : une fenêtre (« entre le 1er et le 30 »), jamais un jour précis",
      "Avec une collecte quotidienne via l'API : un jour où les pertes globales sont anormalement hautes",
    ],
    cannotKnow: ["La date exacte du départ d'une personne nommée — même l'API Meta ne fournit pas ce signal individuel"],
    dataNeeded: ["Exports plus rapprochés pour affiner la fenêtre", "Collecte quotidienne API pour un signal agrégé par jour"],
    takeaway: "On peut dire « le compte a perdu beaucoup plus de followers le 14 septembre » — jamais « @john est parti le 14 septembre ».",
  },
  {
    n: 5,
    question: "Les unfollows sont-ils liés à un contenu feed, une publicité, ou du contenu géolocalisé ?",
    status: "partial",
    statusNote: "Analysable en corrélation, jamais comme preuve individuelle",
    canMeasure: [
      "Feed organique : croiser date de publication, reach, engagement et variation du churn dans les jours qui suivent",
      "Publicité (dark posts, campagnes) : possible en ajoutant la Marketing API — dépenses, audience, dates",
      "Drive-to-web / e-commerce : possible en ajoutant des données analytics (sessions, ventes, UTM)",
    ],
    cannotKnow: ["Qu'une campagne précise a « causé » des départs — seulement qu'une coïncidence mérite d'être creusée"],
    dataNeeded: ["Export mensuel + Graph API (organique)", "Marketing API (paid, si accès autorisé)", "Analytics e-commerce (GA4 ou équivalent)"],
    takeaway:
      "Exemple fictif : une campagne e-commerce avec +38 % de sessions et +22 % de ventes, mais un churn Instagram multiplié par 1,8 sur la même période — un signal à investiguer, jamais une preuve de cause à effet.",
  },
  {
    n: 7,
    question: "Peut-on analyser plus précisément les profils des abonnés et des personnes qui se désabonnent ?",
    status: "partial",
    canMeasure: [
      "Follower standard : nom d'utilisateur, lien du profil, date de follow",
      "Follower qui interagit : commentaires, réponses story, DM, follow mutuel — et via l'API, dans les cas autorisés, s'il est vérifié, son nombre de followers, s'il suit la marque",
      "Personne qui part : tout ce qu'on savait avant son départ (ancienneté, interactions, cohorte d'acquisition), pour comparer les profils de ceux qui partent",
    ],
    cannotKnow: ["Des attributs personnels non déclarés publiquement par la personne elle-même"],
    dataNeeded: ["Exports mensuels", "Interactions capturées (commentaires, DM, stories)", "Graph API pour l'enrichissement des profils qui interagissent"],
    takeaway:
      "On peut par exemple voir si les personnes qui partent sont surtout des arrivées récentes, ou recrutées lors d'un pic particulier — un signal construit uniquement à partir de comportements observés.",
  },
  {
    n: 8,
    question: "Peut-on connaître les comptes suivis par nos followers ?",
    status: "no",
    canMeasure: [],
    cannotKnow: ["La liste des comptes suivis par chaque follower — ni l'export Eden Park ni l'API Meta ne fournissent ce graphe pour l'ensemble de l'audience"],
    dataNeeded: [],
    takeaway: "À ne jamais proposer : « nous allons analyser toutes les marques que suivent les 100 000 followers » — ce n'est pas disponible officiellement.",
  },
  {
    n: 9,
    question: "Peut-on connaître les marques et contenus avec lesquels nos followers interagissent ailleurs sur Instagram ?",
    status: "no",
    canMeasure: ["Leurs interactions avec Eden Park elles-mêmes"],
    cannotKnow: ["L'historique privé d'interactions d'un follower avec d'autres comptes — jamais affirmé sans donnée explicite"],
    dataNeeded: [],
    takeaway: "On ne pourra jamais écrire « @john aime Nike, Lacoste et Ralph Lauren » sans preuve directe.",
  },
  {
    n: 10,
    question: "Peut-on connaître leurs centres d'intérêt ?",
    status: "partial",
    statusNote: "Par affinité observée, pas par centre d'intérêt certain",
    canMeasure: [
      "Des affinités observées avec les contenus Eden Park : rugby, produit, ambassadeurs, lifestyle, événements — selon ce à quoi les personnes réagissent réellement",
    ],
    cannotKnow: ["Les centres d'intérêt privés d'une personne, en dehors de son comportement avec Eden Park"],
    dataNeeded: ["Exports mensuels avec interactions par contenu"],
    takeaway: "On parle toujours d'« affinité observée aux contenus Eden Park », jamais de « centre d'intérêt Instagram certain ».",
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
