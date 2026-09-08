// Page Analyse — générateur de métriques simulées, déterministe (seed
// dérivée de l'ID du contenu ou du compte) pour rester stable d'un rendu à
// l'autre. Ces valeurs illustrent ce que l'API Graph Meta renverrait une
// fois branchée — jamais présentées comme mesurées. Plages calibrées sur le
// catalogue validé : ne pas inventer de champ hors de ce catalogue.
//
// Cadre du projet (détermine tout le reste) : solution propriétaire
// mono-client pour Eden Park, un seul compte Instagram suivi, voie
// Instagram API with Facebook Login. Les utilisateurs Eden Park se
// connectent à l'app via Supabase, jamais auprès de Meta ; un seul jeton,
// autorisé une fois par une personne ayant un rôle sur la Page, stocké
// côté serveur. L'app Meta reste en mode développement pour ce seul compte.
export const GRAPH_VERSION = "v26.0";

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rng(seed: string) {
  return mulberry32(hashSeed(seed));
}

function between(r: () => number, min: number, max: number): number {
  return Math.round(min + r() * (max - min));
}

export interface DemographicRow {
  label: string;
  value: number;
}

// Meta ne renvoie jamais une clé de breakdown sans donnée : un bouton non
// configuré sur le profil est absent du tableau `breakdowns`, ce n'est pas
// un zéro ("If insights data you are requesting does not exist or is
// currently unavailable, the API will return an empty data set instead of
// 0 for individual metrics"). Chaque distribution ci-dessous ne renvoie
// donc que les postes réellement non nuls, jamais la liste exhaustive des
// valeurs possibles de l'enum.

// breakdown=action_type sur profile_activity (métrique média, FEED + STORY).
// Eden Park est une marque e-commerce nationale : le lien en bio domine très
// largement (c'est la vitrine vers la boutique en ligne), le reste ne
// remonte que si le bouton correspondant est configuré sur le profil. TEXT
// n'est jamais généré : aucune marque de cette taille n'utilise le bouton
// SMS d'un profil Instagram.
function distributeProfileActivity(r: () => number, total: number): DemographicRow[] {
  if (total <= 0) return [];
  const hasDirection = r() < 0.7; // une adresse boutique est configurée la plupart du temps
  const hasCall = r() < 0.25; // bouton d'appel rarement configuré sur ce type de profil
  const bioShare = between(r, 85, 95) / 100;
  let remaining = 1 - bioShare;
  const emailShare = Math.min(remaining, between(r, 3, 8) / 100);
  remaining -= emailShare;
  const directionShare = hasDirection ? Math.min(remaining, between(r, 2, 5) / 100) : 0;
  remaining -= directionShare;
  const callShare = hasCall ? Math.min(remaining, between(r, 0, 2) / 100) : 0;
  const rows: DemographicRow[] = [{ label: "Clic sur le lien en bio", value: Math.round(total * bioShare) }];
  if (emailShare > 0) rows.push({ label: "E-mail", value: Math.round(total * emailShare) });
  if (directionShare > 0) rows.push({ label: "Itinéraire", value: Math.round(total * directionShare) });
  if (callShare > 0) rows.push({ label: "Appel", value: Math.round(total * callShare) });
  // La somme doit coller exactement au total déjà affiché par ailleurs
  // (MediaInsights.profileActivity.total) : l'écart d'arrondi est absorbé
  // par le premier poste plutôt que tiré indépendamment.
  const sum = rows.reduce((s, row) => s + row.value, 0);
  rows[0].value += total - sum;
  return rows.filter((row) => row.value > 0);
}

// breakdown=contact_button_type sur profile_links_taps (métrique compte).
// Le lien en bio n'y est PAS compté (Meta la décrit comme les taps sur
// l'adresse, le bouton d'appel, e-mail et SMS) : des volumes bien plus
// faibles que profile_activity, quelques dizaines à quelques centaines par
// mois. Un compte de marque nationale sans téléphone configuré n'a jamais
// CALL/TEXT/BOOK_NOW/INSTANT_EXPERIENCE ; peut même n'avoir aucune donnée du
// tout si aucun bouton de contact n'est configuré — dans ce cas la fonction
// renvoie `null`, à distinguer d'un compte à 0.
function distributeProfileLinksTaps(r: () => number, total: number): DemographicRow[] {
  if (total <= 0) return [];
  const hasDirection = r() < 0.6;
  const hasUndefined = r() < 0.5;
  const emailShare = between(r, 40, 60) / 100;
  let remaining = 1 - emailShare;
  const directionShare = hasDirection ? Math.min(remaining, between(r, 30, 50) / 100) : 0;
  remaining -= directionShare;
  const undefinedShare = hasUndefined ? Math.min(remaining, between(r, 5, 15) / 100) : 0;
  const rows: DemographicRow[] = [{ label: "E-mail", value: Math.round(total * emailShare) }];
  if (directionShare > 0) rows.push({ label: "Itinéraire", value: Math.round(total * directionShare) });
  if (undefinedShare > 0) rows.push({ label: "Autre", value: Math.round(total * undefinedShare) });
  const sum = rows.reduce((s, row) => s + row.value, 0);
  rows[0].value += total - sum;
  return rows.filter((row) => row.value > 0);
}

export type MediaType = "post" | "reel" | "story";

// Disponibilité par type de média — GET /{media-id}/insights, doc Graph API
// GRAPH_VERSION (Instagram API with Facebook Login), tableau vérifié contre
// la documentation officielle — ne pas re-rechercher.
//   - FEED (post)  : comments, follows, likes, profile_activity,
//                    profile_visits, reach, reposts, saved, shares,
//                    total_interactions, views, total_comments, total_likes,
//                    total_views. Aucun insight sur les images individuelles
//                    d'un carrousel (seul l'album l'est).
//   - REELS        : comments, ig_reels_avg_watch_time (ms, non documenté
//                    précisément par Meta — à vérifier sur un appel réel
//                    avant prod), ig_reels_video_view_total_time (non
//                    modélisé ici), likes, reach, reels_skip_rate, reposts,
//                    saved, shares, total_interactions, views,
//                    total_comments, total_likes, total_views. PAS de
//                    follows, PAS de profile_visits, PAS de profile_activity
//                    — ces champs n'existent pas sur ce type de média.
//   - STORY        : follows, navigation (tap_forward/tap_back/exits/
//                    swipe_forward), profile_activity, profile_visits,
//                    reach, replies, reposts, shares, total_interactions,
//                    views, total_views. PAS de likes, PAS de comments, PAS
//                    de saved. `replies` existe mais remonte toujours 0
//                    pour un compte créé en Europe (depuis le 01/12/2020) ou
//                    au Japon (depuis le 14/04/2021) — non exposé ici, voir
//                    le bandeau statique de la section Stories plutôt qu'une
//                    ligne par story. <5 vues → erreur (#10) « Not enough
//                    viewers for the media to show insights » : c'est un
//                    état d'affichage réel, pas un zéro. Disponible 24 h
//                    seulement — d'où le webhook story_insights.
//   - total_views / total_likes / total_comments (FEED + REELS) agrègent
//     Instagram + surfaces Facebook — Instagram API with Facebook Login.
export interface MediaInsights {
  reach: number;
  views: number;
  likes: number | null;
  comments: number | null;
  saved: number | null;
  shares: number;
  follows: number | null;
  profileVisits: number | null;
  // GET /{media-id}/insights?metric=profile_activity&breakdown=action_type
  // (FEED + STORY, jamais REELS ; le breakdown est gratuit, même appel que
  // profile_activity seul — mais isolé de toute métrique sans breakdown,
  // sous peine d'un générique "An unknown error has occurred" côté Meta,
  // sans indiquer laquelle des métriques mélangées pose problème).
  // byAction ne contient que les postes non nuls : BIO_LINK_CLICKED, CALL,
  // DIRECTION, EMAIL, TEXT sont les 5 valeurs possibles de l'enum, mais un
  // bouton non configuré sur le profil est absent, jamais à 0 — itérer sur
  // les clés reçues, pas sur la liste exhaustive.
  profileActivity: { total: number; byAction: DemographicRow[] } | null;
  navigation: { tapForward: number; tapBack: number; tapExit: number; swipeForward: number } | null;
  reposts: number;
  totalInteractions: number;
  reelsSkipRate: number | null;
  avgWatchTimeMs: number | null;
  totalLikes: number | null;
  totalComments: number | null;
  totalViews: number | null;
  tooFewViewers: boolean;
}

export function mockMediaInsights(contentId: string, mediaType: MediaType, followersTotal: number): MediaInsights {
  const r = rng(contentId);

  // Une story sur ~12 (déterministe) tombe sous le seuil des 5 vues : Meta ne
  // renvoie alors aucune donnée (erreur (#10) Not enough viewers).
  const tooFewViewers = mediaType === "story" && hashSeed(contentId) % 12 === 0;
  if (tooFewViewers) {
    return {
      reach: 0, views: 0, likes: null, comments: null, saved: null, shares: 0, follows: null,
      profileVisits: null, profileActivity: null, navigation: null, reposts: 0, totalInteractions: 0,
      reelsSkipRate: null, avgWatchTimeMs: null, totalLikes: null, totalComments: null,
      totalViews: null, tooFewViewers: true,
    };
  }

  // Portée proportionnelle à la taille du compte pour les trois formats —
  // une story n'a pas de traitement à part, contrairement à l'ancienne
  // fourchette 10000-18000 fixe qui ignorait la taille réelle du compte.
  const reachPct = between(r, 17, 50) / 100;
  const reach = Math.round(followersTotal * reachPct);
  const viewsMultiplier = mediaType === "reel" ? between(r, 30, 80) / 10 : between(r, 12, 16) / 10;
  const views = Math.round(reach * viewsMultiplier);
  const likes = mediaType === "story" ? null : Math.round(reach * 0.06);
  const comments = mediaType === "story" ? null : Math.round((likes ?? 0) * 0.03);
  const saved = mediaType === "story" ? null : between(r, 40, 300);
  const shares = between(r, 10, 90);
  // follows / profile_visits / profile_activity : FEED et STORY, jamais REELS.
  const follows = mediaType === "reel" ? null : between(r, 5, 60);
  const profileVisits = mediaType === "reel" ? null : between(r, 100, 900);
  const profileActivityTotal = profileVisits != null ? Math.round(profileVisits * 0.4) : null;
  const profileActivity =
    profileActivityTotal != null ? { total: profileActivityTotal, byAction: distributeProfileActivity(r, profileActivityTotal) } : null;
  const navigation =
    mediaType === "story"
      ? { tapForward: between(r, 2000, 5000), tapBack: between(r, 200, 600), tapExit: between(r, 300, 900), swipeForward: between(r, 100, 500) }
      : null;
  // reposts et total_interactions : disponibles sur les trois formats.
  const reposts = between(r, 2, 40);
  const totalInteractions = shares + (likes ?? 0) + (comments ?? 0) + (saved ?? 0);
  const reelsSkipRate = mediaType === "reel" ? between(r, 18, 55) : null;
  // ig_reels_avg_watch_time : Meta ne documente pas l'unité explicitement —
  // généré en millisecondes ici, à confirmer sur un appel réel avant prod.
  const avgWatchTimeMs = mediaType === "reel" ? between(r, 4000, 12000) : null;
  const bump = () => 1 + between(r, 5, 15) / 100;
  const totalLikes = likes != null ? Math.round(likes * bump()) : null;
  const totalComments = comments != null ? Math.round(comments * bump()) : null;
  const totalViews = Math.round(views * bump());

  return {
    reach, views, likes, comments, saved, shares, follows, profileVisits, profileActivity,
    navigation, reposts, totalInteractions, reelsSkipRate, avgWatchTimeMs, totalLikes, totalComments,
    totalViews, tooFewViewers: false,
  };
}

export interface AccountDailyPoint {
  date: string;
  reach: number;
}

// GET /{ig-user-id}/insights, metric=reach, metric_type=time_series,
// period=day, since/until=30 j, SANS breakdown → 1 appel. Meta ne renvoie
// jamais de breakdown avec metric_type=time_series ("If you request
// metric_type=time_series, breakdowns will not be included in the
// response"), donc cette courbe est globale, pas ventilée par format — voir
// mockAccountReachTotalsByFormat pour la répartition par format sur la
// période (un total, pas une série quotidienne).
export function mockAccountReachSeries(accountId: string, followersTotal: number, days = 30): AccountDailyPoint[] {
  const r = rng(`${accountId}:reach-series`);
  const base = Math.round(followersTotal * 0.02);
  const points: AccountDailyPoint[] = [];
  const today = new Date("2026-09-01T00:00:00Z");
  let level = base;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    level = Math.max(200, level + between(r, -Math.round(base * 0.12), Math.round(base * 0.15)));
    points.push({ date: d.toISOString().slice(0, 10), reach: level });
  }
  return points;
}

export interface FormatReachTotals {
  post: number;
  reel: number;
  story: number;
}

// GET /{ig-user-id}/insights, metric=reach, metric_type=total_value,
// breakdown=media_product_type, period=day, since/until=30 j → 1 appel.
// Un total par format sur toute la période, PAS un point par jour : Meta ne
// mélange jamais time_series et breakdown dans la même réponse (voir
// mockAccountReachSeries ci-dessus pour la courbe quotidienne globale).
export function mockAccountReachTotalsByFormat(accountId: string, followersTotal: number): FormatReachTotals {
  const r = rng(`${accountId}:reach-totals-by-format`);
  return {
    post: Math.round(followersTotal * (between(r, 20, 32) / 100)),
    reel: Math.round(followersTotal * (between(r, 30, 55) / 100)),
    story: Math.round(followersTotal * (between(r, 12, 24) / 100)),
  };
}

export interface MonthlyReachPoint {
  month: string;
  reach: number;
}

// Tendance sur plusieurs mois — Meta ne conserve les insights de compte que
// 90 jours ; au-delà, cette vue n'existe que si nous avons nous-mêmes archivé
// une capture périodique (ex. hebdomadaire) de `reach` au fil du temps. Sur
// un compte tout juste connecté, les mois les plus anciens resteront vides
// tant que cet historique ne s'est pas accumulé — ce n'est pas un appel API
// direct, mais une agrégation de nos propres relevés stockés.
export function mockAccountReachMonthly(accountId: string, followersTotal: number, months = 6): MonthlyReachPoint[] {
  const r = rng(`${accountId}:reach-monthly`);
  const base = Math.round(followersTotal * 0.55);
  const points: MonthlyReachPoint[] = [];
  const start = new Date("2026-09-01T00:00:00Z");
  let level = base;
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(start);
    d.setUTCMonth(d.getUTCMonth() - i);
    level = Math.max(1000, Math.round(level * (1 + between(r, -12, 18) / 100)));
    points.push({ month: d.toISOString().slice(0, 7), reach: level });
  }
  return points;
}

export interface TrendMetric {
  value: number;
  deltaPct: number;
}

export interface AccountPeriodTotals {
  accountsEngaged: TrendMetric;
  totalInteractions: TrendMetric;
  likes: TrendMetric;
  comments: TrendMetric;
  shares: TrendMetric;
  saves: TrendMetric;
  follows: TrendMetric;
  unfollows: TrendMetric;
  // GET /{ig-user-id}/insights?metric=profile_links_taps&period=day&
  // metric_type=total_value&breakdown=contact_button_type (breakdown
  // gratuit, même appel — mais à isoler de toute métrique sans breakdown
  // dans sa propre requête, voir la note sur profile_activity). `null` si
  // le profil ne porte aucun bouton de contact (adresse, e-mail, téléphone)
  // : Meta ne renvoie alors aucune donnée, à ne jamais confondre avec 0.
  profileLinksTaps: TrendMetric | null;
  // Ne contient que les postes non nuls parmi BOOK_NOW, CALL, DIRECTION,
  // EMAIL, INSTANT_EXPERIENCE, TEXT, UNDEFINED — vide si profileLinksTaps
  // est null.
  profileLinksTapsByButton: DemographicRow[];
}

// Chaque métrique est générée avec son niveau du mois précédent, puis le
// mois courant en dérive avec une variation plausible — le delta affiché
// (§ "comparaison avec le mois d'avant") vient directement de ces deux
// niveaux, jamais d'un pourcentage tiré indépendamment.
function withTrend(r: () => number, previous: number): TrendMetric {
  const growth = 1 + between(r, -20, 35) / 100;
  const value = Math.max(0, Math.round(previous * growth));
  const deltaPct = previous > 0 ? Math.round(((value - previous) / previous) * 1000) / 10 : 0;
  return { value, deltaPct };
}

// GET /{ig-user-id}/insights, metric_type=total_value, period sur la fenêtre
// affichée → 3 appels : (1) accounts_engaged, total_interactions, likes,
// comments, shares, saves — regroupables tant qu'aucun breakdown n'est
// demandé ; (2) follows_and_unfollows avec breakdown=follow_type (une seule
// réponse donne les deux valeurs "abonnements" et "désabonnements" — ne pas
// les traiter comme deux mesures indépendantes côté API, seul ce mock les
// tire séparément) — nécessite ≥100 abonnés, et "désabonnements" mélange les
// départs volontaires et les comptes supprimés/désactivés, à rappeler dans
// l'UI ; (3) profile_links_taps avec breakdown=contact_button_type, à
// isoler dans sa propre requête (mélanger une métrique sans breakdown avec
// une qui en a un renvoie "An unknown error has occurred" sans préciser
// laquelle). Volumes bien plus faibles que profile_activity — le lien en
// bio n'y est pas compté — et peut ne renvoyer aucune donnée pour un compte
// sans bouton de contact configuré : voir profileLinksTaps ci-dessous.
export function mockAccountPeriodTotals(accountId: string, followersTotal: number): AccountPeriodTotals {
  const r = rng(`${accountId}:period-totals`);
  const prevLikes = Math.round(followersTotal * (between(r, 8, 14) / 100));
  const likes = withTrend(r, prevLikes);
  const comments = withTrend(r, Math.round(prevLikes * 0.05));
  const shares = withTrend(r, between(r, 400, 1200));
  const saves = withTrend(r, between(r, 800, 2400));
  const totalInteractionsPrev = prevLikes + comments.value + shares.value + saves.value;
  // Une marque nationale avec boutique en ligne configure presque toujours
  // au moins l'e-mail de contact — mais pas systématiquement une adresse ou
  // un numéro affiché publiquement : dans le cas contraire, Meta ne renvoie
  // aucune donnée pour cette métrique, jamais un compte à 0.
  const hasAnyContactButton = r() < 0.8;
  const profileLinksTaps = hasAnyContactButton ? withTrend(r, between(r, 30, 300)) : null;
  return {
    accountsEngaged: withTrend(r, Math.round(followersTotal * (between(r, 3, 6) / 100))),
    totalInteractions: withTrend(r, totalInteractionsPrev),
    likes, comments, shares, saves,
    follows: withTrend(r, between(r, 8000, 20000)),
    unfollows: withTrend(r, between(r, 4000, 11000)),
    profileLinksTaps,
    profileLinksTapsByButton: profileLinksTaps != null ? distributeProfileLinksTaps(r, profileLinksTaps.value) : [],
  };
}

const CITIES = ["Paris", "Lyon", "Marseille", "Bordeaux", "Toulouse", "Lille", "Nantes", "Nice"];
const COUNTRIES = ["France", "Belgique", "Suisse", "Algérie", "Royaume-Uni", "Maroc", "Canada", "États-Unis"];

// GET /{ig-user-id}/insights, metric_type=total_value, un appel par
// breakdown (jamais mélangés dans le même appel) → 5 appels : (1-4)
// follower_demographics, breakdown=city|country|gender|age — nécessite
// ≥100 abonnés, classement limité au top ~45 par Meta ; (5)
// engaged_audience_demographics, breakdown=city — nécessite ≥100
// engagements sur la période, et ne supporte plus que les timeframes
// this_week et this_month (last_14/30/90_days et prev_month ont été
// retirés) : "villes engagées" ne peut donc pas se comparer sur 90 jours
// comme le reste de cette page.
export function mockAudienceDemographics(accountId: string, followersTotal: number) {
  const r = rng(`${accountId}:demographics`);
  const engaged = Math.round(followersTotal * 0.08);

  function distribute(labels: string[], total: number, topShare: number): DemographicRow[] {
    const weights = labels.map(() => 0.3 + r());
    const sum = weights.reduce((s, w) => s + w, 0);
    return labels
      .map((label, i) => ({ label, value: Math.round((total * topShare * weights[i]) / sum) }))
      .sort((a, b) => b.value - a.value);
  }

  return {
    followerCities: distribute(CITIES, followersTotal, 0.35),
    followerCountries: distribute(COUNTRIES, followersTotal, 0.7),
    engagedCities: distribute(CITIES, engaged, 0.4),
    genderSplit: { femme: between(r, 48, 58), homme: between(r, 40, 50), autre: between(r, 1, 3) },
    ageSplit: [
      { label: "18-24", value: between(r, 8, 14) },
      { label: "25-34", value: between(r, 26, 34) },
      { label: "35-44", value: between(r, 24, 30) },
      { label: "45-54", value: between(r, 14, 20) },
      { label: "55+", value: between(r, 8, 14) },
    ],
  };
}

export interface MentionItem {
  kind: "comment" | "post" | "tag";
  author: string;
  text: string;
  date: string;
}

// Webhook `mentions` (commentaire ou légende) + edge /{ig-user-id}/tags —
// Facebook Login. Les mentions en story ne sont pas captées par ce webhook.
export function mockMentions(accountId: string): MentionItem[] {
  const r = rng(`${accountId}:mentions`);
  const pool: MentionItem[] = [
    { kind: "comment", author: "clement.rugbylife", text: "La collection @edenparkparis de cette saison est superbe 🎀", date: "2026-08-29" },
    { kind: "post", author: "marieaparis", text: "Journée shopping, direction Eden Park pour le nouveau polo 🏉", date: "2026-08-26" },
    { kind: "tag", author: "lesgaillards.paris", text: "Identifié dans une publication à l'ambassade de France", date: "2026-08-07" },
    { kind: "comment", author: "thomas_sportif", text: "Toujours aussi élégant, bravo @edenparkparis", date: "2026-07-30" },
    { kind: "post", author: "clubnautiquefun", text: "Merci à Eden Park pour l'équipement de toute l'équipe", date: "2026-07-08" },
  ];
  return pool.slice(0, 3 + Math.round(r() * 2));
}

export interface CompetitorProfile {
  username: string;
  name: string;
  followersCount: number;
  mediaCount: number;
}

// GET /{ig-user-id}?fields=business_discovery.username({username}){...} —
// un appel par concurrent suivi, données publiques uniquement (followers_
// count, media_count) : aucun insight sur un compte qui n'est pas le nôtre.
// Pas de webhook ; cadence hebdomadaire choisie par nous, pas imposée par Meta.
export function mockCompetitors(accountId: string): CompetitorProfile[] {
  const r = rng(`${accountId}:competitors`);
  return [
    { username: "lacoste", name: "Lacoste", followersCount: 3_200_000 + between(r, -50000, 50000), mediaCount: between(r, 4200, 4800) },
    { username: "sergeblanco", name: "Serge Blanco", followersCount: 42_000 + between(r, -2000, 2000), mediaCount: between(r, 900, 1200) },
    { username: "ralphlaurenfrance", name: "Ralph Lauren France", followersCount: 210_000 + between(r, -8000, 8000), mediaCount: between(r, 1800, 2400) },
  ];
}

export interface TopCommenter {
  username: string;
  verified: boolean;
  commentCount: number;
  lastCommentDate: string;
}

const HANDLE_PREFIXES = [
  "sophie", "marc", "clara", "julien", "amandine", "romain", "lea", "thibault", "camille", "pierre",
  "manon", "hugo", "chloe", "antoine", "laura", "maxime", "eva", "nicolas", "sarah", "vincent",
  "juliette", "alexandre", "emma", "florian", "pauline", "kevin", "margaux", "yanis", "lucie", "baptiste",
  "ines", "theo", "louise", "gabriel", "zoe", "mathis", "anna", "leo", "nina", "raphael",
  "eloise", "adrien", "celia", "quentin", "victoria", "simon", "alicia", "benjamin", "oceane", "arthur",
];
const HANDLE_SUFFIXES = ["", ".paris", "92", "_rugby", ".fr", "75", "_official", ".eden", "13", "_style"];

// Aucun endpoint Meta ne fournit un classement de commentateurs : reconstruit
// par nous à partir de l'historique du webhook `comments`, qui transmet
// from.username et from.id pour chaque commentaire (Facebook Login) — donc
// nominatif dès le premier commentaire stocké, pas seulement "à terme". Ce
// qui suit illustre la forme que prendra ce classement une fois l'historique
// accumulé ; count=50 correspond à l'affichage produit, pas à une limite API.
export function mockTopCommenters(accountId: string, count = 50): TopCommenter[] {
  const r = rng(`${accountId}:top-commenters`);
  const used = new Set<string>();
  const rows: TopCommenter[] = [];
  for (let i = 0; i < count; i++) {
    let handle = "";
    do {
      const prefix = HANDLE_PREFIXES[Math.floor(r() * HANDLE_PREFIXES.length)];
      const suffix = HANDLE_SUFFIXES[Math.floor(r() * HANDLE_SUFFIXES.length)];
      handle = `${prefix}${suffix}`;
    } while (used.has(handle));
    used.add(handle);
    // Décroissance en loi de puissance : quelques abonnés très actifs, puis
    // une longue traîne — cohérent avec ce qu'on observe sur un vrai compte.
    const commentCount = Math.max(3, Math.round(65 / Math.pow(i + 1, 0.55) + between(r, -2, 2)));
    rows.push({
      username: handle,
      verified: r() < 0.04,
      commentCount,
      lastCommentDate: `2026-08-${String(between(r, 1, 28)).padStart(2, "0")}`,
    });
  }
  return rows.sort((a, b) => b.commentCount - a.commentCount);
}

export interface LiveCommentSeed {
  author: string;
  text: string;
}

export const LIVE_COMMENT_POOL: LiveCommentSeed[] = [
  { author: "sophie.eden", text: "J'adore ce polo, il sort quand en boutique ? 😍" },
  { author: "marc_rugbyfan", text: "Toujours la même qualité, bravo !" },
  { author: "clara.b", text: "La couleur marine est parfaite 🎀" },
  { author: "julien92", text: "Vous livrez en Belgique ?" },
  { author: "amandine_paris", text: "Le nœud papillon rose, iconique comme toujours" },
  { author: "romain.d", text: "J'ai commandé hier, hâte de recevoir 📦" },
  { author: "lea_style", text: "Ce sac est magnifique, quel prix ?" },
  { author: "thibault.eb", text: "Belle collab avec Ultima Mobility 🚲" },
  { author: "camille_92", text: "Vous avez encore la taille M en stock ?" },
  { author: "pierre.dm", text: "Fidèle depuis 10 ans, toujours au rendez-vous" },
];
