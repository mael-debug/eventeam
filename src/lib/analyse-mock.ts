// Page Analyse — générateur de métriques simulées, déterministe (seed
// dérivée de l'ID du contenu ou du compte) pour rester stable d'un rendu à
// l'autre. Ces valeurs illustrent ce que l'API Graph Meta renverrait une
// fois branchée — jamais présentées comme mesurées. Plages calibrées sur le
// catalogue validé, recalées le 08/09/2026 contre de vrais appels exécutés
// sur un compte de test (voir chaque générateur : les zéros observés
// viennent de ce compte inactif, seule la structure des réponses compte —
// ce fichier génère des volumes plausibles pour un compte actif). Tout ce
// qui n'a pas été rejoué en conditions réelles porte un commentaire
// `NON VÉRIFIÉ CONTRE L'API` avec l'appel exact à exécuter avant prod.
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

// ============================================================
// Formes de réponse GET /insights — le même endpoint (compte ou média)
// renvoie l'une de ces quatre structures selon metric_type/breakdown/period.
// Rejoué le 08/09/2026 contre un vrai compte : le parseur ci-dessous doit
// absorber les quatre sans jamais planter, y compris le cas où `results`
// est totalement absent (compte sans donnée sur ce breakdown — un jeu vide,
// jamais un zéro implicite).
//   1. total_value:{value}                        — métrique simple (E)
//   2. total_value:{value, breakdowns:[{dimension_keys,results}]} (I)
//   3. total_value:{breakdowns:[{dimension_keys}]} — pas de results, parfois
//      pas de value (D, F sur un compte sans activité sur la période)
//   4. values:[{value, end_time}]                  — série temporelle (C)
export interface InsightsBreakdownResult {
  dimension_values: string[];
  value: number;
}
export interface InsightsBreakdown {
  dimension_keys: string[];
  results?: InsightsBreakdownResult[];
}
export interface InsightsTotalValue {
  value?: number;
  breakdowns?: InsightsBreakdown[];
}
export interface InsightsTimeSeriesPoint {
  value: number;
  end_time: string;
}
export interface RawInsightsMetric {
  name: string;
  period: string;
  total_value?: InsightsTotalValue;
  values?: InsightsTimeSeriesPoint[];
}

// Formes 2 et 3 : n'itère que sur `results` (jamais présent → tableau vide),
// jamais sur la liste exhaustive des valeurs possibles de l'enum Meta — un
// type non configuré/sans donnée est absent, pas à 0. `labelFor` traduit la
// valeur brute (souvent en minuscules, ex. "bio_link_clicked" observé en
// conditions réelles) vers un libellé FR ; une valeur inconnue est affichée
// telle quelle plutôt que masquée, pour ne jamais perdre silencieusement une
// donnée réelle.
export function parseInsightsBreakdown(metric: RawInsightsMetric, labelFor: (dimensionValue: string) => string): DemographicRow[] {
  const results = metric.total_value?.breakdowns?.[0]?.results ?? [];
  return results.map((r) => ({ label: labelFor(r.dimension_values[0]), value: r.value })).filter((row) => row.value > 0);
}

// Forme 1 : valeur simple sans breakdown. `undefined` (jeu vide) → null,
// jamais 0 par défaut.
export function parseInsightsSimpleValue(metric: RawInsightsMetric | undefined): number | null {
  return metric?.total_value?.value ?? null;
}

// Forme 4 : série temporelle. end_time suit le fuseau du compte (observé à
// 07:00:00+0000, jamais minuit UTC) — ne jamais supposer minuit, ne
// conserver que la date calendaire.
export function parseInsightsTimeSeries(metric: RawInsightsMetric | undefined): { date: string; value: number }[] {
  return (metric?.values ?? []).map((v) => ({ date: v.end_time.slice(0, 10), value: v.value }));
}

// ============================================================
// breakdown=action_type sur profile_activity — VÉRIFIÉ le 08/09/2026 :
// GET /{media-id}/insights?metric=profile_activity&breakdown=action_type a
// renvoyé total_value:{value:1, breakdowns:[{dimension_keys:["action_type"],
// results:[{dimension_values:["bio_link_clicked"],value:1}]}]} — un seul
// type d'action présent, valeur brute en minuscules avec underscores.
const ACTION_TYPE_LABELS: Record<string, string> = {
  bio_link_clicked: "Clic sur le lien en bio",
  call: "Appel",
  direction: "Itinéraire",
  email: "E-mail",
  text: "SMS",
};

// Eden Park est une marque e-commerce nationale : le lien en bio domine très
// largement (c'est la vitrine vers la boutique en ligne), le reste ne
// remonte que si le bouton correspondant est configuré sur le profil — et
// même alors, l'appel réel n'a montré qu'UN SEUL type d'action non nul à la
// fois sur un compte inactif ; un compte actif en cumule plusieurs, mais
// jamais les 5 en même temps (TEXT en particulier n'est jamais généré :
// aucune marque de cette taille n'utilise le bouton SMS d'un profil
// Instagram).
function buildProfileActivityMetric(r: () => number, total: number): RawInsightsMetric {
  const hasDirection = r() < 0.7; // une adresse boutique est configurée la plupart du temps
  const hasCall = r() < 0.25; // bouton d'appel rarement configuré sur ce type de profil
  const hasEmail = r() < 0.6; // pas systématique — l'appel réel n'a montré que le lien en bio
  const bioShare = between(r, 85, 95) / 100;
  let remaining = 1 - bioShare;
  const emailShare = hasEmail ? Math.min(remaining, between(r, 3, 8) / 100) : 0;
  remaining -= emailShare;
  const directionShare = hasDirection ? Math.min(remaining, between(r, 2, 5) / 100) : 0;
  remaining -= directionShare;
  const callShare = hasCall ? Math.min(remaining, between(r, 0, 2) / 100) : 0;
  const results: InsightsBreakdownResult[] = [{ dimension_values: ["bio_link_clicked"], value: Math.round(total * bioShare) }];
  if (emailShare > 0) results.push({ dimension_values: ["email"], value: Math.round(total * emailShare) });
  if (directionShare > 0) results.push({ dimension_values: ["direction"], value: Math.round(total * directionShare) });
  if (callShare > 0) results.push({ dimension_values: ["call"], value: Math.round(total * callShare) });
  // La somme doit coller exactement au total (form 2 : total_value.value ET
  // breakdowns partagent le même total côté Meta) — l'écart d'arrondi est
  // absorbé par le premier poste plutôt que tiré indépendamment.
  const sum = results.reduce((s, res) => s + res.value, 0);
  results[0].value += total - sum;
  return {
    name: "profile_activity", period: "lifetime",
    total_value: { value: total, breakdowns: [{ dimension_keys: ["action_type"], results: results.filter((res) => res.value > 0) }] },
  };
}

// ============================================================
// breakdown=contact_button_type sur profile_links_taps — NON VÉRIFIÉ CONTRE
// L'API (métrique compte, jamais appelée en conditions réelles) : appel à
// exécuter avant prod → GET /{ig-user-id}/insights?metric=profile_links_taps
// &period=day&metric_type=total_value&breakdown=contact_button_type
// La forme de réponse et la casse des dimension_values sont supposées par
// analogie avec profile_activity (point I), pas confirmées.
const CONTACT_BUTTON_LABELS: Record<string, string> = {
  book_now: "Réservation",
  call: "Appel",
  direction: "Itinéraire",
  email: "E-mail",
  instant_experience: "Expérience instantanée",
  text: "SMS",
  undefined: "Autre",
};

// Le lien en bio n'y est PAS compté (Meta la décrit comme les taps sur
// l'adresse, le bouton d'appel, e-mail et SMS) : des volumes bien plus
// faibles que profile_activity, quelques dizaines à quelques centaines par
// mois. Un compte de marque nationale sans téléphone configuré n'a jamais
// CALL/TEXT/BOOK_NOW/INSTANT_EXPERIENCE.
function buildProfileLinksTapsMetric(r: () => number, total: number): RawInsightsMetric {
  const hasDirection = r() < 0.6;
  const hasUndefined = r() < 0.5;
  const emailShare = between(r, 40, 60) / 100;
  let remaining = 1 - emailShare;
  const directionShare = hasDirection ? Math.min(remaining, between(r, 30, 50) / 100) : 0;
  remaining -= directionShare;
  const undefinedShare = hasUndefined ? Math.min(remaining, between(r, 5, 15) / 100) : 0;
  const results: InsightsBreakdownResult[] = [{ dimension_values: ["email"], value: Math.round(total * emailShare) }];
  if (directionShare > 0) results.push({ dimension_values: ["direction"], value: Math.round(total * directionShare) });
  if (undefinedShare > 0) results.push({ dimension_values: ["undefined"], value: Math.round(total * undefinedShare) });
  const sum = results.reduce((s, res) => s + res.value, 0);
  results[0].value += total - sum;
  return {
    name: "profile_links_taps", period: "day",
    total_value: { value: total, breakdowns: [{ dimension_keys: ["contact_button_type"], results: results.filter((res) => res.value > 0) }] },
  };
}

export type MediaType = "post" | "reel" | "story";

// Disponibilité par type de média — GET /{media-id}/insights, doc Graph API
// GRAPH_VERSION (Instagram API with Facebook Login). Le `period` demandé
// est ignoré par Meta au niveau média : la réponse revient toujours en
// period="lifetime", quel que soit ce qui a été demandé (observé le
// 08/09/2026). VÉRIFIÉ CONTRE L'API le 08/09/2026, sur un compte actif réel :
// reach, views (point H, reel), profile_activity + son breakdown (point I).
// NON VÉRIFIÉ CONTRE L'API — à tester avant prod, appel : GET /{media-id}
// /insights?metric=likes,comments,saved,shares,follows,profile_visits,
// reposts,total_interactions,reels_skip_rate,total_views,total_likes,
// total_comments : likes, comments, saved, shares, follows, profile_visits,
// reposts, total_interactions, reels_skip_rate, total_views, total_likes,
// total_comments. Le catalogue ci-dessous reste celui documenté par Meta,
// simplement pas encore rejoué en conditions réelles pour ces champs.
//   - FEED (post)  : comments, follows, likes, profile_activity,
//                    profile_visits, reach, reposts, saved, shares,
//                    total_interactions, views, total_comments, total_likes,
//                    total_views. Aucun insight sur les images individuelles
//                    d'un carrousel (seul l'album l'est) — vérifié aussi :
//                    media_type=CAROUSEL_ALBUM correspond bien à
//                    media_product_type=FEED, ce sont deux axes différents
//                    (point B), pas un troisième type de média à traiter.
//   - REELS        : comments, ig_reels_avg_watch_time (VÉRIFIÉ en
//                    millisecondes le 08/09/2026, exemple observé : 4840 ms
//                    — ce n'est plus une hypothèse), ig_reels_video_view_
//                    total_time (non modélisé ici), likes, reach,
//                    reels_skip_rate, reposts, saved, shares,
//                    total_interactions, views, total_comments, total_likes,
//                    total_views. PAS de follows, PAS de profile_visits, PAS
//                    de profile_activity — ces champs n'existent pas sur ce
//                    type de média.
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
//                    seulement — d'où le webhook story_insights. Section
//                    entière NON VÉRIFIÉ CONTRE L'API : le compte de test
//                    n'avait aucune story.
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
  // sans indiquer laquelle des métriques mélangées pose problème). VÉRIFIÉ
  // le 08/09/2026 : byAction ne contient que les postes non nuls — un
  // bouton non configuré est absent du tableau `results`, jamais à 0.
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
    profileActivityTotal != null && profileActivityTotal > 0
      ? { total: profileActivityTotal, byAction: parseInsightsBreakdown(buildProfileActivityMetric(r, profileActivityTotal), (v) => ACTION_TYPE_LABELS[v] ?? v) }
      : null;
  const navigation =
    mediaType === "story"
      ? { tapForward: between(r, 2000, 5000), tapBack: between(r, 200, 600), tapExit: between(r, 300, 900), swipeForward: between(r, 100, 500) }
      : null;
  // reposts et total_interactions : disponibles sur les trois formats — NON
  // VÉRIFIÉ CONTRE L'API (voir commentaire d'en-tête de MediaInsights).
  const reposts = between(r, 2, 40);
  const totalInteractions = shares + (likes ?? 0) + (comments ?? 0) + (saved ?? 0);
  const reelsSkipRate = mediaType === "reel" ? between(r, 18, 55) : null;
  // ig_reels_avg_watch_time : VÉRIFIÉ en millisecondes le 08/09/2026
  // (exemple observé : 4840 ms).
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

// GET /{ig-user-id}/insights?metric=reach&period=day&since=<unix>&
// until=<unix> → 1 appel. VÉRIFIÉ le 08/09/2026 : SANS since/until, l'API ne
// renvoie que ~2 points (fenêtre 24 h par défaut) — pour 30 jours, since et
// until en timestamps Unix sont OBLIGATOIRES, pas optionnels. end_time est
// revenu à 07:00:00+0000 (pas minuit UTC) : les journées suivent le fuseau
// du compte, ne jamais parser en supposant minuit — seule la date
// calendaire (parseInsightsTimeSeries) est fiable. Meta n'autorise jamais de
// breakdown avec metric_type=time_series ("If you request metric_type=
// time_series, breakdowns will not be included in the response"), donc
// cette courbe est globale, pas ventilée par format — voir
// mockAccountReachTotalsByFormat pour la répartition par format sur la
// période (un total, pas une série quotidienne).
export function mockAccountReachSeries(accountId: string, followersTotal: number, days = 30): AccountDailyPoint[] {
  const r = rng(`${accountId}:reach-series`);
  const base = Math.round(followersTotal * 0.02);
  const values: InsightsTimeSeriesPoint[] = [];
  const today = new Date("2026-09-01T07:00:00Z");
  let level = base;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    level = Math.max(200, level + between(r, -Math.round(base * 0.12), Math.round(base * 0.15)));
    values.push({ value: level, end_time: d.toISOString() });
  }
  const raw: RawInsightsMetric = { name: "reach", period: "day", values };
  return parseInsightsTimeSeries(raw).map((p) => ({ date: p.date, reach: p.value }));
}

export interface FormatReachTotals {
  post: number | null;
  reel: number | null;
  story: number | null;
}

const MEDIA_PRODUCT_TYPE_TO_FORMAT: Record<string, MediaType> = { FEED: "post", REELS: "reel", STORY: "story" };

// GET /{ig-user-id}/insights?metric=reach&period=day&metric_type=
// total_value&breakdown=media_product_type&since=<unix>&until=<unix> → 1
// appel. VÉRIFIÉ le 08/09/2026 : confirme que time_series et breakdown sont
// EXCLUSIFS (l'appel ci-dessus renvoie des valeurs datées sans ventilation,
// celui-ci une ventilation sans dates) — "portée par jour ET par format" est
// donc infaisable en un seul appel. Sur le compte de test (inactif), la
// réponse observée était total_value:{value:0, breakdowns:[{dimension_keys:
// ["media_product_type"]}]} — SANS clé `results` du tout : un format sans
// donnée sur la période est absent, pas à 0. Ce générateur reflète cette
// même absence possible (post/reel/story valent `null`, jamais 0, quand
// Meta ne renvoie rien pour ce format).
export function mockAccountReachTotalsByFormat(accountId: string, followersTotal: number): FormatReachTotals {
  const r = rng(`${accountId}:reach-totals-by-format`);
  const raw: RawInsightsMetric = {
    name: "reach", period: "day",
    total_value: {
      breakdowns: [{
        dimension_keys: ["media_product_type"],
        results: [
          { dimension_values: ["FEED"], value: Math.round(followersTotal * (between(r, 20, 32) / 100)) },
          { dimension_values: ["REELS"], value: Math.round(followersTotal * (between(r, 30, 55) / 100)) },
          { dimension_values: ["STORY"], value: Math.round(followersTotal * (between(r, 12, 24) / 100)) },
        ],
      }],
    },
  };
  const totals: FormatReachTotals = { post: null, reel: null, story: null };
  const results = raw.total_value?.breakdowns?.[0]?.results ?? [];
  for (const row of results) {
    const format = MEDIA_PRODUCT_TYPE_TO_FORMAT[row.dimension_values[0]];
    if (format && row.value > 0) totals[format] = row.value;
  }
  return totals;
}

export interface MonthlyReachPoint {
  month: string;
  reach: number;
}

// NON VÉRIFIÉ CONTRE L'API — infaisable en un seul appel, donc rien à tester
// directement : les insights de compte sont limités à 90 jours (fenêtre
// glissante), cette vue au-delà n'existe que si l'on archive nous-mêmes un
// relevé périodique de `reach` (ex. la série quotidienne ci-dessus, capturée
// chaque semaine et stockée). Sur un compte tout juste connecté, les mois
// les plus anciens resteront vides tant que cet historique ne s'est pas
// accumulé.
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
  // metric_type=total_value&breakdown=contact_button_type — NON VÉRIFIÉ
  // CONTRE L'API (voir buildProfileLinksTapsMetric). `null` si le profil ne
  // porte aucun bouton de contact (adresse, e-mail, téléphone) : Meta ne
  // renvoie alors aucune donnée, à ne jamais confondre avec 0.
  profileLinksTaps: TrendMetric | null;
  // Ne contient que les postes non nuls parmi BOOK_NOW, CALL, DIRECTION,
  // EMAIL, INSTANT_EXPERIENCE, TEXT, UNDEFINED — vide si profileLinksTaps
  // est null.
  profileLinksTapsByButton: DemographicRow[];
}

// Delta affiché (§ "comparaison avec le mois d'avant") : `previous` vient de
// notre propre relevé archivé du mois d'avant, `value` du relevé courant
// (lui-même passé par le parseur ci-dessus quand la métrique a un
// breakdown) — jamais deux tirages aléatoires indépendants.
function withTrendFromValue(previous: number, value: number): TrendMetric {
  const deltaPct = previous > 0 ? Math.round(((value - previous) / previous) * 1000) / 10 : 0;
  return { value, deltaPct };
}

function withTrend(r: () => number, previous: number): TrendMetric {
  const growth = 1 + between(r, -20, 35) / 100;
  return withTrendFromValue(previous, Math.max(0, Math.round(previous * growth)));
}

const FOLLOW_TYPE_LABELS: Record<string, string> = { follows: "Abonnements", unfollows: "Désabonnements" };

// GET /{ig-user-id}/insights?metric=follows_and_unfollows&period=day&
// metric_type=total_value&breakdown=follow_type → 1 appel. VÉRIFIÉ le
// 08/09/2026 (structure confirmée, breakdown effectivement renvoyé) : une
// seule réponse donne les deux valeurs "abonnements" et "désabonnements" —
// ne pas faire deux appels ni les tirer indépendamment. Nécessite ≥100
// abonnés. "Désabonnements" mélange les départs volontaires et les comptes
// supprimés/désactivés, à rappeler dans l'UI.
function buildFollowsAndUnfollowsMetric(follows: number, unfollows: number): RawInsightsMetric {
  return {
    name: "follows_and_unfollows", period: "day",
    total_value: { breakdowns: [{ dimension_keys: ["follow_type"], results: [
      { dimension_values: ["follows"], value: follows },
      { dimension_values: ["unfollows"], value: unfollows },
    ] } ] },
  };
}

// GET /{ig-user-id}/insights, metric_type=total_value, period sur la fenêtre
// affichée → 3 appels : (1) accounts_engaged, total_interactions, likes,
// comments, shares, saves — VÉRIFIÉ le 08/09/2026 : les 6 métriques
// regroupées dans un seul appel renvoient chacune total_value:{value},
// tant qu'aucun breakdown n'est demandé ; (2) follows_and_unfollows, voir
// buildFollowsAndUnfollowsMetric ci-dessus ; (3) profile_links_taps, NON
// VÉRIFIÉ, voir buildProfileLinksTapsMetric ci-dessus. Le breakdown est
// gratuit (même appel que la métrique seule), mais chaque métrique avec
// breakdown doit rester isolée dans sa propre requête : la mélanger à une
// métrique qui n'en a pas renvoie un générique "An unknown error has
// occurred" sans préciser laquelle.
export function mockAccountPeriodTotals(accountId: string, followersTotal: number): AccountPeriodTotals {
  const r = rng(`${accountId}:period-totals`);
  const prevLikes = Math.round(followersTotal * (between(r, 8, 14) / 100));
  const likesRaw: RawInsightsMetric = { name: "likes", period: "day", total_value: { value: Math.round(prevLikes * (1 + between(r, -20, 35) / 100)) } };
  const likes = withTrendFromValue(prevLikes, parseInsightsSimpleValue(likesRaw) ?? 0);
  const comments = withTrend(r, Math.round(prevLikes * 0.05));
  const shares = withTrend(r, between(r, 400, 1200));
  const saves = withTrend(r, between(r, 800, 2400));
  const totalInteractionsPrev = prevLikes + comments.value + shares.value + saves.value;

  const prevFollows = between(r, 8000, 20000);
  const prevUnfollows = between(r, 4000, 11000);
  const followsAndUnfollowsRaw = buildFollowsAndUnfollowsMetric(
    Math.max(0, Math.round(prevFollows * (1 + between(r, -20, 35) / 100))),
    Math.max(0, Math.round(prevUnfollows * (1 + between(r, -20, 35) / 100))),
  );
  const followsAndUnfollowsParsed = parseInsightsBreakdown(followsAndUnfollowsRaw, (v) => FOLLOW_TYPE_LABELS[v] ?? v);
  const followsValue = followsAndUnfollowsParsed.find((row) => row.label === "Abonnements")?.value ?? 0;
  const unfollowsValue = followsAndUnfollowsParsed.find((row) => row.label === "Désabonnements")?.value ?? 0;

  // Une marque nationale avec boutique en ligne configure presque toujours
  // au moins l'e-mail de contact — mais pas systématiquement une adresse ou
  // un numéro affiché publiquement : dans le cas contraire, Meta ne renvoie
  // aucune donnée pour cette métrique, jamais un compte à 0.
  const hasAnyContactButton = r() < 0.8;
  const profileLinksTapsTotal = hasAnyContactButton ? withTrend(r, between(r, 30, 300)) : null;
  const profileLinksTapsRaw = profileLinksTapsTotal != null ? buildProfileLinksTapsMetric(r, profileLinksTapsTotal.value) : null;

  return {
    accountsEngaged: withTrend(r, Math.round(followersTotal * (between(r, 3, 6) / 100))),
    totalInteractions: withTrend(r, totalInteractionsPrev),
    likes, comments, shares, saves,
    follows: withTrendFromValue(prevFollows, followsValue),
    unfollows: withTrendFromValue(prevUnfollows, unfollowsValue),
    profileLinksTaps: profileLinksTapsTotal,
    profileLinksTapsByButton: profileLinksTapsRaw ? parseInsightsBreakdown(profileLinksTapsRaw, (v) => CONTACT_BUTTON_LABELS[v] ?? v) : [],
  };
}

// "Ville, Région" concaténées en une seule chaîne — VÉRIFIÉ le 08/09/2026,
// format observé tel quel : "Marseille, Provence-Alpes-Côte d'Azur". Traité
// comme une chaîne opaque (ni reparsée, ni retronquée) : couper sur la
// virgule casserait un nom de ville qui en contient une.
const FRENCH_CITY_REGIONS: [string, string][] = [
  ["Paris", "Ile-de-France"],
  ["Lyon", "Auvergne-Rhone-Alpes"],
  ["Marseille", "Provence-Alpes-Côte d'Azur"],
  ["Bordeaux", "Nouvelle-Aquitaine"],
  ["Toulouse", "Occitanie"],
  ["Lille", "Hauts-de-France"],
  ["Nantes", "Pays de la Loire"],
  ["Nice", "Provence-Alpes-Côte d'Azur"],
];
const COUNTRIES = ["France", "Belgique", "Suisse", "Algérie", "Royaume-Uni", "Maroc", "Canada", "États-Unis"];

function buildCityDemographicsMetric(r: () => number, total: number, topShare: number): RawInsightsMetric {
  const weights = FRENCH_CITY_REGIONS.map(() => 0.3 + r());
  const sum = weights.reduce((s, w) => s + w, 0);
  const results = FRENCH_CITY_REGIONS.map(([city, region], i) => ({
    dimension_values: [`${city}, ${region}`],
    value: Math.round((total * topShare * weights[i]) / sum),
  }));
  return { name: "follower_demographics", period: "lifetime", total_value: { breakdowns: [{ dimension_keys: ["city"], results }] } };
}

// GET /{ig-user-id}/insights?metric=follower_demographics&period=lifetime&
// timeframe=this_month&metric_type=total_value&breakdown=<city|country|
// gender|age> — un appel par breakdown, jamais mélangés. VÉRIFIÉ le
// 08/09/2026 pour breakdown=city UNIQUEMENT : 45 résultats exactement
// (plafond top 45 atteint), timeframe=this_month fonctionne, libellé
// "Ville, Région" (région en anglais/GeoNames, pas systématiquement
// traduite). country/gender/age : NON VÉRIFIÉS CONTRE L'API — mêmes appels
// que ci-dessus avec breakdown=country|gender|age à tester avant prod ;
// conservés ici avec un format simple (nom seul), à corriger si l'appel
// réel montre une structure enrichie comme pour city.
export function mockAudienceDemographics(accountId: string, followersTotal: number) {
  const r = rng(`${accountId}:demographics`);
  // NON VÉRIFIÉ CONTRE L'API — GET /{ig-user-id}/insights?metric=
  // engaged_audience_demographics&period=lifetime&timeframe=this_month&
  // metric_type=total_value&breakdown=city. Seuil différent de
  // follower_demographics : ≥100 engagements sur la période, pas ≥100
  // abonnés ; timeframe limité à this_week/this_month (last_14/30/90_days
  // et prev_month ont été retirés) — pas comparable sur 90 jours comme le
  // reste de cette page.
  const engaged = Math.round(followersTotal * 0.08);

  function distributeSimple(labels: string[], total: number, topShare: number): DemographicRow[] {
    const weights = labels.map(() => 0.3 + r());
    const sum = weights.reduce((s, w) => s + w, 0);
    return labels
      .map((label, i) => ({ label, value: Math.round((total * topShare * weights[i]) / sum) }))
      .sort((a, b) => b.value - a.value);
  }

  const followerCitiesRaw = buildCityDemographicsMetric(r, followersTotal, 0.35);
  const engagedCitiesRaw = buildCityDemographicsMetric(r, engaged, 0.4);

  return {
    followerCities: parseInsightsBreakdown(followerCitiesRaw, (v) => v).sort((a, b) => b.value - a.value),
    followerCountries: distributeSimple(COUNTRIES, followersTotal, 0.7),
    engagedCities: parseInsightsBreakdown(engagedCitiesRaw, (v) => v).sort((a, b) => b.value - a.value),
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

// NON VÉRIFIÉ CONTRE L'API — webhook `mentions` et edge /{ig-user-id}/tags
// jamais testés (compte de test sans mention). Structure de webhook
// standard Meta reprise par hypothèse, pas confirmée en conditions réelles.
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

// GET /{ig-user-id}?fields=business_discovery.username({username}){
// followers_count,media_count} — VÉRIFIÉ le 08/09/2026 sur "lacoste"
// ({"business_discovery":{"followers_count":8873423,"media_count":4104,
// "id":"..."}}) : fonctionne avec le token courant, aucune démarche
// supplémentaire. Un appel par concurrent suivi, données publiques
// uniquement : aucun insight sur un compte qui n'est pas le nôtre. Pas de
// webhook ; cadence hebdomadaire choisie par nous, pas imposée par Meta.
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

// NON VÉRIFIÉ CONTRE L'API — dépend du webhook `comments`, jamais configuré
// (compte de test sans commentaire). GET /{media-id}/comments jamais appelé
// non plus. Aucun endpoint Meta ne fournirait de toute façon un classement :
// reconstruit par nous à partir de l'historique du webhook, qui transmettrait
// from.username et from.id pour chaque commentaire (Facebook Login) — donc
// nominatif dès le premier commentaire stocké, une fois le webhook
// effectivement configuré et testé. count=50 correspond à l'affichage
// produit, pas à une limite API.
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

// NON VÉRIFIÉ CONTRE L'API — voir mockTopCommenters : même webhook
// `comments`, jamais configuré ni testé.
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
