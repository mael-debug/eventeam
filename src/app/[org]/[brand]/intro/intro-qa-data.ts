// Page Intro — matrice "à quelles questions peut-on répondre ?". Wording
// repris quasi verbatim de la spec produit validée : ne pas reformuler les
// statuts (yes/partial/no) ni les réserves sans revalider avec le métier,
// ce texte a déjà été passé au crible de la véracité Meta.

export type QAStatus = "yes" | "partial" | "no";

export interface QAAnswer {
  status: QAStatus;
  text: string;
}

export interface QARow {
  question: string;
  exportAllTime: QAAnswer;
  graphApi: QAAnswer;
  instagram: QAAnswer;
  communityIntelligence: QAAnswer;
  note?: string;
  highlight?: boolean;
}

export const QA_ROWS: QARow[] = [
  {
    question: "Combien avons-nous de followers ?",
    exportAllTime: { status: "yes", text: "Oui" },
    graphApi: { status: "yes", text: "Oui" },
    instagram: { status: "yes", text: "Oui" },
    communityIntelligence: { status: "yes", text: "Oui + historique" },
  },
  {
    question: "Qui sont nos followers actuels ?",
    exportAllTime: { status: "yes", text: "Oui, si snapshot complet validé" },
    graphApi: { status: "no", text: "Non pour l'ensemble de la base" },
    instagram: { status: "partial", text: "Liste visible manuellement" },
    communityIntelligence: { status: "yes", text: "Base historisée" },
  },
  {
    question: "Qui nous a rejoints depuis le mois dernier ?",
    exportAllTime: { status: "yes", text: "Oui, par comparaison de snapshots" },
    graphApi: { status: "partial", text: "Volumes agrégés, pas de liste nominative complète" },
    instagram: { status: "partial", text: "Croissance agrégée" },
    communityIntelligence: { status: "yes", text: "Liste + volume + cohorte" },
  },
  {
    question: "Qui a quitté la communauté ?",
    exportAllTime: { status: "yes", text: "Départs observés entre deux snapshots" },
    graphApi: { status: "no", text: "Pas de liste complète des unfollows" },
    instagram: { status: "no", text: "Pas de rapport nominatif des départs" },
    communityIntelligence: { status: "yes", text: "Départs observés + historique" },
  },
  {
    question: "À quel moment exact une personne s'est désabonnée ?",
    exportAllTime: { status: "no", text: "Non — situé entre deux snapshots mensuels" },
    graphApi: { status: "no", text: "Pas de webhook général d'unfollow individuel" },
    instagram: { status: "no", text: "Non" },
    communityIntelligence: { status: "partial", text: "Fenêtre de départ, pas instant exact" },
  },
  {
    question: "Pourquoi une personne s'est désabonnée ?",
    exportAllTime: { status: "no", text: "Non" },
    graphApi: { status: "no", text: "Non" },
    instagram: { status: "no", text: "Non" },
    communityIntelligence: { status: "no", text: "Non" },
    note: "Community Intelligence peut détecter des corrélations, jamais lire l'intention d'une personne.",
  },
  {
    question: "Combien de followers recrutés en septembre sont encore présents 30, 60, 90 ou 180 jours plus tard ?",
    exportAllTime: { status: "yes", text: "Oui, avec snapshots successifs" },
    graphApi: { status: "no", text: "Pas individuellement sur toute la base" },
    instagram: { status: "no", text: "Pas de rapport de survie par cohorte" },
    communityIntelligence: { status: "yes", text: "Oui — analyse de cohortes" },
  },
  {
    question: "Quelles périodes recrutent les followers les plus fidèles ?",
    exportAllTime: { status: "yes", text: "Oui, avec suffisamment d'historique" },
    graphApi: { status: "partial", text: "Données complémentaires" },
    instagram: { status: "no", text: "Pas sous cette forme" },
    communityIntelligence: { status: "yes", text: "Oui" },
  },
  {
    question: "Quel est notre taux de churn mensuel ?",
    exportAllTime: { status: "yes", text: "Oui, après deux snapshots complets" },
    graphApi: { status: "partial", text: "Partiel via follower_count + follows_and_unfollows si collectés régulièrement" },
    instagram: { status: "partial", text: "Gagnés/perdus existent, pas l'analyse longitudinale poussée" },
    communityIntelligence: { status: "yes", text: "Oui + historique" },
  },
  {
    question: "Les nouveaux followers sont-ils de meilleure qualité qu'avant ?",
    exportAllTime: { status: "yes", text: "Oui, si la qualité est définie par des critères mesurables (rétention, ancienneté, stabilité, signaux de compte…)" },
    graphApi: { status: "partial", text: "Complète l'analyse" },
    instagram: { status: "no", text: "Pas de score de qualité longitudinal natif" },
    communityIntelligence: { status: "yes", text: "Score explicable" },
  },
  {
    question: "Détectons-nous des pics anormaux d'acquisition ?",
    exportAllTime: { status: "yes", text: "Oui, grâce aux timestamps de follow" },
    graphApi: { status: "yes", text: "Des séries fréquentes permettent aussi de détecter des accélérations" },
    instagram: { status: "partial", text: "Courbes de croissance visibles, pas de moteur de détection comparable" },
    communityIntelligence: { status: "yes", text: "Détection automatique" },
  },
  {
    question: "Un pic d'acquisition a-t-il produit des followers durables ?",
    exportAllTime: { status: "yes", text: "Oui, après observation dans le temps" },
    graphApi: { status: "partial", text: "Complément de contexte" },
    instagram: { status: "no", text: "Pas de croisement acquisition × rétention cohorte" },
    communityIntelligence: { status: "yes", text: "Oui" },
  },
  {
    question: "Quel est le coût réel d'un follower encore présent à J+90 ?",
    exportAllTime: { status: "partial", text: "Fournit la rétention, pas le budget" },
    graphApi: { status: "no", text: "Pas le budget publicitaire via Instagram Login seul — la Marketing API pourrait l'apporter dans une future extension" },
    instagram: { status: "no", text: "Pas ce calcul longitudinal" },
    communityIntelligence: { status: "yes", text: "Si budget/campagne disponible ou saisi" },
  },
  {
    question: "Quelle est la durée de vie moyenne d'un follower ?",
    exportAllTime: { status: "partial", text: "Possible progressivement à partir du début du monitoring" },
    graphApi: { status: "no", text: "Pas de suivi individuel complet de toute la base" },
    instagram: { status: "no", text: "Non" },
    communityIntelligence: { status: "partial", text: "Devient de plus en plus fiable avec l'historique" },
    note: "Ne prétend jamais connaître les followers partis avant le premier snapshot.",
  },
  {
    question: "Un follower est-il revenu après être parti ?",
    exportAllTime: { status: "yes", text: "Refollow probable détectable entre snapshots" },
    graphApi: { status: "no", text: "Pas pour l'ensemble de la communauté" },
    instagram: { status: "no", text: "Pas de rapport historique" },
    communityIntelligence: { status: "yes", text: "Historique des épisodes de follow" },
  },
  {
    question: "Quels pays, villes, âges et genres composent notre audience ?",
    exportAllTime: { status: "yes", text: "Oui, agrégé" },
    graphApi: { status: "yes", text: "Oui, selon métriques disponibles" },
    instagram: { status: "yes", text: "Oui, dans Insights" },
    communityIntelligence: { status: "yes", text: "Oui + historique mensuel" },
  },
  {
    question: "Peut-on connaître le pays, l'âge ou le genre d'un follower précis ?",
    exportAllTime: { status: "no", text: "Non" },
    graphApi: { status: "no", text: "Non" },
    instagram: { status: "no", text: "Non" },
    communityIntelligence: { status: "no", text: "Non" },
    note: "Une statistique démographique agrégée n'est jamais attribuée à une personne.",
  },
  {
    question: "Comment la géographie ou la démographie évolue-t-elle sur plusieurs mois ?",
    exportAllTime: { status: "yes", text: "Oui, en stockant les snapshots" },
    graphApi: { status: "yes", text: "Oui, si les données sont collectées et persistées régulièrement" },
    instagram: { status: "partial", text: "Affiche des Insights ; la mémoire et les comparaisons longues viennent de Community Intelligence" },
    communityIntelligence: { status: "yes", text: "Oui" },
  },
  {
    question: "Quels jours l'audience est-elle la plus active ?",
    exportAllTime: { status: "yes", text: "Oui" },
    graphApi: { status: "yes", text: "online_followers" },
    instagram: { status: "yes", text: "Oui" },
    communityIntelligence: { status: "yes", text: "Oui + évolution" },
  },
  {
    question: "Quelle est notre portée, nos impressions, nos visites de profil et nos clics ?",
    exportAllTime: { status: "yes", text: "Oui" },
    graphApi: { status: "yes", text: "Oui" },
    instagram: { status: "yes", text: "Oui" },
    communityIntelligence: { status: "yes", text: "Oui + historique + croisements" },
  },
  {
    question: "Quels posts performent le mieux ?",
    exportAllTime: { status: "yes", text: "Oui, pour les métriques présentes dans l'export Insights" },
    graphApi: { status: "yes", text: "Oui" },
    instagram: { status: "yes", text: "Oui" },
    communityIntelligence: { status: "yes", text: "Oui + comparaison + attribution" },
  },
  {
    question: "Quel contenu recrute réellement des followers ?",
    exportAllTime: { status: "yes", text: "Certains contenus disposent de follows_gained ; on peut aussi étudier les arrivées autour de la publication" },
    graphApi: { status: "yes", text: "Certaines métriques média incluent follows et profile_activity" },
    instagram: { status: "partial", text: "Certaines statistiques par contenu existent" },
    communityIntelligence: { status: "yes", text: "Croisement contenu × acquisition" },
    note: "Si l'analyse repose uniquement sur la proximité temporelle, elle est présentée comme « attribution indicative », jamais comme une causalité.",
  },
  {
    question: "Les followers recrutés par un contenu restent-ils dans le temps ?",
    exportAllTime: { status: "yes", text: "Oui, via croisement avec les snapshots suivants" },
    graphApi: { status: "no", text: "Pas comme analyse native complète" },
    instagram: { status: "no", text: "Non" },
    communityIntelligence: { status: "yes", text: "Oui" },
    note: "C'est une différence majeure du produit.",
    highlight: true,
  },
  {
    question: "Quel format recrute les followers les plus durables ?",
    exportAllTime: { status: "partial", text: "Selon la disponibilité des données contenu" },
    graphApi: { status: "yes", text: "Meilleures métriques média" },
    instagram: { status: "no", text: "Pas de croisement natif format × rétention des followers" },
    communityIntelligence: { status: "yes", text: "Oui, si attribution suffisante" },
  },
  {
    question: "Peut-on analyser précisément la rétention d'un Reel ?",
    exportAllTime: { status: "partial", text: "Seulement les métriques présentes dans l'export" },
    graphApi: { status: "yes", text: "Oui, beaucoup plus riche" },
    instagram: { status: "partial", text: "Certaines métriques de Reel sont visibles nativement" },
    communityIntelligence: { status: "yes", text: "Avec API" },
  },
  {
    question: "Peut-on connaître tous les followers via l'API Graph ?",
    exportAllTime: { status: "yes", text: "Le snapshot All Time est précisément la source utilisée pour cela" },
    graphApi: { status: "no", text: "NON" },
    instagram: { status: "partial", text: "Liste visible dans l'application" },
    communityIntelligence: { status: "yes", text: "Grâce à l'export, pas grâce à l'API" },
    note: "Limitation fondamentale de l'API Meta.",
    highlight: true,
  },
];
