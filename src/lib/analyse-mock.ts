// Page Analyse — générateur de métriques simulées, déterministe (seed
// dérivée de l'ID du contenu ou du compte) pour rester stable d'un rendu à
// l'autre. Ces valeurs illustrent ce que l'API Graph Meta renverrait une
// fois branchée — jamais présentées comme mesurées. Plages calibrées sur le
// catalogue validé, recalées le 08/09/2026 contre de vrais appels exécutés
// sur un compte de test à 2429 abonnés (voir chaque générateur : les zéros
// et faibles volumes observés viennent de ce compte peu actif — un
// endpoint qui répond sans erreur est considéré disponible même à 0 ou
// tableau vide, seule la STRUCTURE compte. Ce fichier génère des volumes
// plausibles pour un compte actif). Tout ce qui n'a pas été rejoué en
// conditions réelles porte un commentaire `NON VÉRIFIÉ CONTRE L'API` avec
// l'appel exact à exécuter avant prod — jamais supprimé pour autant.
//
// Cadre du projet (détermine tout le reste) : solution propriétaire
// mono-client pour Eden Park, un seul compte Instagram suivi, voie
// Instagram API with Facebook Login. Les utilisateurs Eden Park se
// connectent à l'app via Supabase, jamais auprès de Meta ; un seul jeton,
// autorisé une fois par une personne ayant un rôle sur la Page, stocké
// côté serveur. L'app Meta reste en mode développement pour ce seul
// compte. Scopes confirmés accordés (08/09/2026) : pages_show_list,
// pages_read_engagement, instagram_basic, instagram_manage_insights,
// instagram_manage_comments, instagram_content_publish, business_
// management, ads_management, ads_read, public_profile.
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
// renvoie l'une de ces cinq structures selon qu'on interroge un média ou un
// compte, et selon metric_type/breakdown/period. Rejoué le 08/09/2026 : le
// parseur ci-dessous doit toutes les absorber sans jamais planter, y
// compris l'absence totale de `results` (un jeu vide, jamais un zéro).
//   1. values:[{value, end_time}]                  — série temporelle compte
//   2. values:[{value}]                             — insight média simple
//      (période toujours "lifetime" côté média, sans breakdown)
//   3. total_value:{value}                          — total compte simple
//   4. total_value:{value, breakdowns:[{dimension_keys,results}]}
//                                                   — total + ventilation
//   5. total_value:{breakdowns:[{dimension_keys}]}  — ventilation vide,
//      parfois SANS clé `value` du tout
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
export interface InsightsValuePoint {
  value: number;
  end_time?: string;
}
export interface RawInsightsMetric {
  name: string;
  period: string;
  total_value?: InsightsTotalValue;
  values?: InsightsValuePoint[];
}
// Renvoyée à la place d'une réponse normale quand Meta refuse de calculer la
// métrique (ex. engaged_audience_demographics sous le seuil, §7) — un vrai
// objet d'erreur avec code, PAS un jeu de données vide comme pour les autres
// métriques. À ne jamais confondre avec les formes 1-5 ci-dessus.
export interface InsightsErrorResponse {
  error: {
    message: string;
    code: number;
    error_subcode: number;
    is_transient: boolean;
    error_user_title: string;
    error_user_msg: string;
  };
}

// Formes 4 et 5 : n'itère que sur `results` (jamais présent → tableau vide),
// jamais sur la liste exhaustive des valeurs possibles de l'enum Meta — un
// type non configuré/sans donnée est absent, pas à 0. `labelFor` traduit la
// valeur brute (souvent en minuscules, ex. "bio_link_clicked" observé en
// conditions réelles, ou un code ISO comme "FR") vers un libellé FR ; une
// valeur inconnue est affichée telle quelle plutôt que masquée, pour ne
// jamais perdre silencieusement une donnée réelle.
export function parseInsightsBreakdown(metric: RawInsightsMetric, labelFor: (dimensionValue: string) => string): DemographicRow[] {
  const results = metric.total_value?.breakdowns?.[0]?.results ?? [];
  return results.map((r) => ({ label: labelFor(r.dimension_values[0]), value: r.value })).filter((row) => row.value > 0);
}

// Forme 3 : total compte simple, sans breakdown. `undefined` (jeu vide) →
// null, jamais 0 par défaut.
export function parseInsightsSimpleValue(metric: RawInsightsMetric | undefined): number | null {
  return metric?.total_value?.value ?? null;
}

// Forme 2 : insight média simple, sans date ni breakdown — un seul élément
// dans `values`, contrairement à la série temporelle (forme 1) qui en a un
// par jour.
export function parseInsightsMediaSimpleValue(metric: RawInsightsMetric | undefined): number | null {
  return metric?.values?.[0]?.value ?? null;
}

// Forme 1 : série temporelle compte. end_time suit le fuseau du compte
// (observé à 07:00:00+0000, jamais minuit UTC) — ne jamais supposer minuit,
// ne conserver que la date calendaire. Les jours sans activité sont
// PRÉSENTS avec value:0 (contrairement aux breakdowns) : pas de trou à
// combler ici.
export function parseInsightsTimeSeries(metric: RawInsightsMetric | undefined): { date: string; value: number }[] {
  return (metric?.values ?? []).map((v) => ({ date: (v.end_time ?? "").slice(0, 10), value: v.value }));
}

function buildMediaSimpleMetric(name: string, value: number): RawInsightsMetric {
  return { name, period: "lifetime", values: [{ value }] };
}

// Aller-retour build+parse : exerce le même chemin que le parseur ci-dessus
// pour chaque métrique média simple (forme 2), plutôt que de renvoyer la
// valeur générée directement — likes, comments, saved, shares, follows,
// profile_visits, reposts, total_interactions, reels_skip_rate,
// ig_reels_avg_watch_time partagent tous cette forme, VÉRIFIÉE le
// 08/09/2026 (§1 du compte-rendu).
function simpleMediaValue(name: string, value: number): number {
  return parseInsightsMediaSimpleValue(buildMediaSimpleMetric(name, value)) ?? value;
}

// ============================================================
// Mécanisme retenter/retomber, à appliquer à chaque section de la page :
// tente l'appel réel et retombe sur le mock en cas d'échec, en conservant
// la raison pour affichage (un petit indicateur visuel, jamais une erreur
// bloquante). Aujourd'hui, `live` est systématiquement `notWiredYet` : la
// connexion API n'est pas câblée, donc CHAQUE section retombe sur le mock —
// c'est la situation de développement actuelle. Le jour du branchement,
// `live` devient un vrai fetch Graph API ; s'il échoue ponctuellement (rate
// limit, jeton expiré, panne Meta), exactement le même mécanisme retombe
// sur le mock en production, avec la vraie raison de l'échec affichée au
// lieu de "non branché". Rien d'autre à changer dans les sections
// elles-mêmes pour ce jour-là.
export interface LiveOrMockResult<T> {
  data: T;
  source: "live" | "mock";
  reason: string | null;
}

export async function withLiveFallback<T>(live: () => Promise<T>, mock: () => T): Promise<LiveOrMockResult<T>> {
  try {
    return { data: await live(), source: "live", reason: null };
  } catch (err) {
    return { data: mock(), source: "mock", reason: err instanceof Error ? err.message : String(err) };
  }
}

// Stub d'appel réel commun à toute la page — à remplacer par un vrai fetch
// GET https://graph.facebook.com/{GRAPH_VERSION}/... le jour du branchement.
// Échoue systématiquement aujourd'hui : c'est le seul comportement possible
// tant qu'aucun appel réseau n'est câblé.
export async function notWiredYet(endpoint: string): Promise<never> {
  throw new Error(`Connexion API Graph pas encore branchée : ${endpoint}`);
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
  // La somme doit coller exactement au total (form 4 : total_value.value ET
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
// analogie avec profile_activity (§9), pas confirmées. IMPORTANT (§8, vérifié
// via la définition Meta) : cette métrique COMPTE couvre "les taps sur
// l'adresse, le bouton Appeler, e-mail et SMS" — le clic sur le lien en bio
// n'EN FAIT PAS PARTIE, il vit dans profile_activity au niveau MÉDIA
// (bio_link_clicked, ci-dessus). Deux métriques distinctes : ne jamais les
// additionner ni les confondre dans l'UI.
const CONTACT_BUTTON_LABELS: Record<string, string> = {
  book_now: "Réservation",
  call: "Appel",
  direction: "Itinéraire",
  email: "E-mail",
  instant_experience: "Expérience instantanée",
  text: "SMS",
  undefined: "Autre",
};

// Des volumes bien plus faibles que profile_activity, quelques dizaines à
// quelques centaines par mois. Un compte de marque nationale sans téléphone
// configuré n'a jamais CALL/TEXT/BOOK_NOW/INSTANT_EXPERIENCE.
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
// GRAPH_VERSION (Instagram API with Facebook Login). Le `period` demandé est
// ignoré par Meta au niveau média : la réponse revient toujours en
// period="lifetime" (sauf avec breakdown, voir plus bas), et la valeur est
// dans values[0].value plutôt que total_value (forme 2) — sauf quand un
// breakdown est demandé, auquel cas elle passe dans total_value (forme 4,
// voir profile_activity). Demander une métrique inexistante pour un type de
// média NE PROVOQUE PAS D'ERREUR : l'appel passe, la métrique est
// simplement absente de la réponse — ne jamais supposer que chaque métrique
// demandée revient.
// VÉRIFIÉ CONTRE L'API le 08/09/2026, sur un compte réel à 2429 abonnés :
// reach, views, likes, comments, saved, shares, follows, profile_visits,
// profile_activity (+ breakdown), total_interactions, reposts,
// reels_skip_rate, ig_reels_avg_watch_time (en millisecondes, exemple
// observé : 4840 ms) — la liste FEED/REELS complète du §1 du compte-rendu.
// NON VÉRIFIÉ CONTRE L'API — à tester avant prod, appel : GET /{media-id}
// /insights?metric=total_views,total_likes,total_comments (agrégat
// multi-surfaces, Facebook Login) et ig_reels_video_view_total_time (durée
// totale de vue cumulée, confirmée en millisecondes — ex. observé
// 14 459 118 ms — mais non modélisée ici, aucun affichage ne l'exploite).
//   - FEED (post)  : comments, follows, likes, profile_activity,
//                    profile_visits, reach, reposts, saved, shares,
//                    total_interactions, views. Aucun insight sur les images
//                    individuelles d'un carrousel (seul l'album l'est,
//                    vérifié : Meta parle de « conteneur de carrousel » dans
//                    la description de reach) — media_type=CAROUSEL_ALBUM
//                    correspond bien à media_product_type=FEED, ce sont
//                    deux axes différents, pas un troisième type de média.
//   - REELS        : comments, ig_reels_avg_watch_time, ig_reels_video_view_
//                    total_time (non modélisé ici), likes, reach,
//                    reels_skip_rate (pourcentage direct, ex. 37.2 = 37,2 %,
//                    pas une fraction à multiplier par 100), reposts, saved,
//                    shares, total_interactions, views. PAS de follows, PAS
//                    de profile_visits, PAS de profile_activity — ces
//                    champs sont absents de la réponse sur ce type de média,
//                    sans erreur.
//   - STORY        : follows, navigation (tap_forward/tap_back/exits/
//                    swipe_forward, breakdown story_navigation_action_type),
//                    profile_activity, profile_visits, reach, replies,
//                    reposts, shares, total_interactions, views. PAS de
//                    likes, PAS de comments, PAS de saved. `replies` existe
//                    mais remonte toujours 0 pour un compte créé en Europe
//                    (depuis le 01/12/2020) ou au Japon (depuis le
//                    14/04/2021) — non exposé ici, voir le bandeau statique
//                    de la section Stories plutôt qu'une ligne par story.
//                    <5 vues → erreur (#10) « Not enough viewers for the
//                    media to show insights » : un état d'affichage réel,
//                    pas un zéro. Disponible 24 h seulement — d'où le
//                    webhook story_insights. SECTION ENTIÈRE NON VÉRIFIÉE
//                    CONTRE L'API : le compte de test n'avait aucune story
//                    active, rien de ce qui précède n'a été rejoué en
//                    conditions réelles (seuil des 5 vues, replies=0,
//                    navigation, webhook compris).
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
  // renvoie alors aucune donnée (erreur (#10) Not enough viewers). NON
  // VÉRIFIÉ CONTRE L'API (voir doc ci-dessus, section Stories entière).
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
  const reach = simpleMediaValue("reach", Math.round(followersTotal * reachPct));
  const viewsMultiplier = mediaType === "reel" ? between(r, 30, 80) / 10 : between(r, 12, 16) / 10;
  const views = simpleMediaValue("views", Math.round(reach * viewsMultiplier));
  const likes = mediaType === "story" ? null : simpleMediaValue("likes", Math.round(reach * 0.06));
  const comments = mediaType === "story" ? null : simpleMediaValue("comments", Math.round((likes ?? 0) * 0.03));
  const saved = mediaType === "story" ? null : simpleMediaValue("saved", between(r, 40, 300));
  const shares = simpleMediaValue("shares", between(r, 10, 90));
  // follows / profile_visits / profile_activity : FEED et STORY, jamais
  // REELS — vérifié le 08/09/2026, demandées sur un reel elles sont
  // simplement absentes de la réponse, sans erreur.
  const follows = mediaType === "reel" ? null : simpleMediaValue("follows", between(r, 5, 60));
  const profileVisits = mediaType === "reel" ? null : simpleMediaValue("profile_visits", between(r, 100, 900));
  const profileActivityTotal = profileVisits != null ? Math.round(profileVisits * 0.4) : null;
  const profileActivity =
    profileActivityTotal != null && profileActivityTotal > 0
      ? { total: profileActivityTotal, byAction: parseInsightsBreakdown(buildProfileActivityMetric(r, profileActivityTotal), (v) => ACTION_TYPE_LABELS[v] ?? v) }
      : null;
  // navigation (breakdown story_navigation_action_type) et shares sur les
  // stories : disponibles d'après la doc, mais section Stories entière NON
  // VÉRIFIÉE CONTRE L'API (voir doc ci-dessus).
  const navigation =
    mediaType === "story"
      ? { tapForward: between(r, 2000, 5000), tapBack: between(r, 200, 600), tapExit: between(r, 300, 900), swipeForward: between(r, 100, 500) }
      : null;
  const reposts = simpleMediaValue("reposts", between(r, 2, 40));
  const totalInteractions = simpleMediaValue("total_interactions", shares + (likes ?? 0) + (comments ?? 0) + (saved ?? 0));
  // reels_skip_rate : pourcentage direct avec une décimale (ex. 37.2 =
  // 37,2 %), jamais une fraction à multiplier par 100.
  const reelsSkipRate = mediaType === "reel" ? simpleMediaValue("reels_skip_rate", between(r, 180, 550) / 10) : null;
  // ig_reels_avg_watch_time : VÉRIFIÉ en millisecondes le 08/09/2026
  // (exemple observé : 4840 ms, titre Meta "Durée de visionnage moyenne des
  // reels (MILLISECONDES)").
  const avgWatchTimeMs = mediaType === "reel" ? simpleMediaValue("ig_reels_avg_watch_time", between(r, 4000, 12000)) : null;
  // total_views/total_likes/total_comments : NON VÉRIFIÉ CONTRE L'API (voir
  // doc ci-dessus) — agrégat multi-surfaces, Facebook Login.
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
// renvoie que 2 points (fenêtre 24 h par défaut) — AVEC, exactement 30
// points en un seul appel, pas de pagination nécessaire. end_time est
// revenu à 07:00:00+0000 sur tous les points (pas minuit UTC) : les
// journées suivent le fuseau du compte, ne jamais parser en supposant
// minuit — seule la date calendaire (parseInsightsTimeSeries) est fiable.
// Les jours sans activité sont présents avec value:0 : contrairement aux
// breakdowns, la série temporelle ne saute aucun jour, pas de trou à
// combler. Meta n'autorise jamais de breakdown avec metric_type=
// time_series ("If you request metric_type=time_series, breakdowns will
// not be included in the response"), donc cette courbe est globale, pas
// ventilée par format — voir mockAccountReachTotalsByFormat pour la
// répartition par format sur la période (un total, pas une série
// quotidienne).
export function mockAccountReachSeries(accountId: string, followersTotal: number, days = 30): AccountDailyPoint[] {
  const r = rng(`${accountId}:reach-series`);
  const base = Math.round(followersTotal * 0.02);
  const values: InsightsValuePoint[] = [];
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
// donc infaisable en un seul appel. Sur le compte de test (peu actif), la
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
  // CONTRE L'API (voir buildProfileLinksTapsMetric). Ne couvre PAS le clic
  // sur le lien en bio (voir profile_activity, niveau média) : deux
  // métriques distinctes, jamais additionnées. `null` si le profil ne porte
  // aucun bouton de contact (adresse, e-mail, téléphone) : Meta ne renvoie
  // alors aucune donnée, à ne jamais confondre avec 0.
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
// format observé tel quel : "Marseille, Provence-Alpes-Côte d'Azur" (région
// en anglais/GeoNames pour les pays non francophones, ex. "São Paulo, São
// Paulo (state)"). Traité comme une chaîne opaque (ni reparsée, ni
// retronquée) : couper sur la virgule casserait un nom de ville qui en
// contient une.
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

function buildCityDemographicsMetric(r: () => number, total: number, topShare: number): RawInsightsMetric {
  const weights = FRENCH_CITY_REGIONS.map(() => 0.3 + r());
  const sum = weights.reduce((s, w) => s + w, 0);
  const results = FRENCH_CITY_REGIONS.map(([city, region], i) => ({
    dimension_values: [`${city}, ${region}`],
    value: Math.round((total * topShare * weights[i]) / sum),
  }));
  return { name: "follower_demographics", period: "lifetime", total_value: { breakdowns: [{ dimension_keys: ["city"], results }] } };
}

// breakdown=country — VÉRIFIÉ le 08/09/2026 : les dimension_values sont des
// codes ISO 3166-1 alpha-2 ("FR", "BR", "IN", "US"...), jamais des noms de
// pays en clair. Table de correspondance pour l'affichage FR ; un code
// absent de la table est affiché tel quel plutôt que masqué, pour ne jamais
// perdre silencieusement un pays réel.
const ISO_COUNTRY_LABELS: Record<string, string> = {
  FR: "France", BE: "Belgique", CH: "Suisse", MA: "Maroc", DZ: "Algérie",
  GB: "Royaume-Uni", CA: "Canada", US: "États-Unis", DE: "Allemagne", ES: "Espagne",
  IT: "Italie", PT: "Portugal", NL: "Pays-Bas", BR: "Brésil", IN: "Inde",
};
const COUNTRY_CODES = ["FR", "BE", "CH", "MA", "GB", "CA", "US", "DE"];

function buildCountryDemographicsMetric(r: () => number, total: number): RawInsightsMetric {
  // Marque française : FR domine très largement, le reste se partage un
  // reliquat modeste (diaspora, e-commerce transfrontalier).
  const frShare = between(r, 78, 90) / 100;
  const weights = COUNTRY_CODES.slice(1).map(() => 0.3 + r());
  const sum = weights.reduce((s, w) => s + w, 0);
  const remaining = 1 - frShare;
  const results: InsightsBreakdownResult[] = [{ dimension_values: ["FR"], value: Math.round(total * frShare) }];
  COUNTRY_CODES.slice(1).forEach((code, i) => {
    results.push({ dimension_values: [code], value: Math.round((total * remaining * weights[i]) / sum) });
  });
  return { name: "follower_demographics", period: "lifetime", total_value: { breakdowns: [{ dimension_keys: ["country"], results }] } };
}

// breakdown=gender — VÉRIFIÉ le 08/09/2026 : trois valeurs "F", "M", "U",
// en EFFECTIFS ABSOLUS (jamais des pourcentages — la conversion se fait à
// l'affichage). "U" = non renseigné (Instagram ne demande pas le genre à
// l'inscription), PAS "autre" : sur le compte de test, U valait 93 % du
// total mesuré. On modélise ce même déséquilibre pour Eden Park plutôt que
// d'inventer une répartition F/M dominante qu'aucun appel n'a confirmée.
export interface GenderSplit {
  female: number;
  male: number;
  unspecified: number;
}

function buildGenderSplit(r: () => number, measuredTotal: number): GenderSplit {
  const unspecifiedShare = between(r, 75, 95) / 100;
  const unspecified = Math.round(measuredTotal * unspecifiedShare);
  const remaining = measuredTotal - unspecified;
  const female = Math.round(remaining * (between(r, 45, 55) / 100));
  return { female, male: remaining - female, unspecified };
}

// breakdown=age — VÉRIFIÉ le 08/09/2026 : SEPT tranches (13-17 comprise,
// 55-64 et 65+ séparées), en effectifs absolus.
const AGE_BRACKETS = ["13-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"];

function buildAgeSplit(r: () => number, measuredTotal: number): DemographicRow[] {
  const weights = [between(r, 2, 6), between(r, 8, 14), between(r, 26, 34), between(r, 22, 28), between(r, 14, 20), between(r, 8, 13), between(r, 4, 9)];
  const sum = weights.reduce((s, w) => s + w, 0);
  return AGE_BRACKETS.map((label, i) => ({ label, value: Math.round((measuredTotal * weights[i]) / sum) }));
}

export type EngagedAudienceResult =
  | { ok: true; rows: DemographicRow[] }
  | { ok: false; code: number; errorUserTitle: string; errorUserMsg: string };

// GET /{ig-user-id}/insights?metric=engaged_audience_demographics&
// period=lifetime&timeframe=this_month&metric_type=total_value&
// breakdown=city — À ISOLER dans son propre appel : groupée avec d'autres
// métriques, une erreur ici ferait tomber toute la requête. Comportement
// DIFFÉRENT de follower_demographics : sous le seuil (≥100 personnes par
// critère de répartition), Meta renvoie une vraie erreur, pas un jeu vide.
// VÉRIFIÉ le 08/09/2026 — mais UNIQUEMENT la forme d'erreur, le compte de
// test étant sous le seuil :
//   {"error":{"message":"Not enough users","code":3006,
//     "error_subcode":2874010,"is_transient":false,
//     "error_user_title":"Données démographiques indisponibles",
//     "error_user_msg":"Vous pourrez en savoir plus sur votre audience une
//       fois que cet indicateur aura plus de 100 personnes dans chaque
//       critère de répartition."}}
// error_user_msg est déjà traduit en français par Meta : à afficher tel
// quel, jamais remplacé par un message maison. La forme de réponse en cas
// de SUCCÈS (compte au-dessus du seuil) n'a JAMAIS été observée — supposée
// alignée sur follower_demographics par analogie, NON VÉRIFIÉE.
//
// SEUIL — NON VÉRIFIÉ NON PLUS, et c'est la seule métrique de la page dans
// ce cas : le message Meta dit "plus de 100 personnes dans CHAQUE CRITÈRE
// DE RÉPARTITION", ce qui se lit comme un seuil PAR VILLE, pas sur le total
// engagé. On teste donc ici si une ville au moins dépasse 100, plutôt que
// le total — mais cette lecture n'a jamais été rejouée contre l'API (compte
// de test sous le seuil global, donc a fortiori sous n'importe quel seuil
// par ville). Un compte à fort engagement mais dispersé sur tout le
// territoire (plausible pour Eden Park, marque nationale) peut dépasser
// 100 au total sans qu'aucune ville n'atteigne ce chiffre seule — d'où
// l'intérêt de ne pas se fier au total.
export function mockEngagedAudienceDemographics(accountId: string, followersTotal: number): EngagedAudienceResult {
  const r = rng(`${accountId}:engaged-demographics`);
  const engaged = Math.round(followersTotal * 0.08);
  const raw = buildCityDemographicsMetric(r, engaged, 0.4);
  const rows = parseInsightsBreakdown(raw, (v) => v).sort((a, b) => b.value - a.value);
  const anyCityAboveThreshold = rows.some((row) => row.value >= 100);
  if (!anyCityAboveThreshold) {
    return {
      ok: false,
      code: 3006,
      errorUserTitle: "Données démographiques indisponibles",
      errorUserMsg:
        "Vous pourrez en savoir plus sur votre audience une fois que cet indicateur aura plus de 100 personnes dans chaque critère de répartition.",
    };
  }
  return { ok: true, rows };
}

// GET /{ig-user-id}/insights?metric=follower_demographics&period=lifetime&
// timeframe=this_month&metric_type=total_value&breakdown=<city|country|
// gender|age> — un appel par breakdown, jamais mélangés. VÉRIFIÉ le
// 08/09/2026 pour LES QUATRE breakdowns : 45 résultats exactement pour city
// (plafond top 45, s'applique aussi à country), timeframe=this_month
// fonctionne partout, toutes les valeurs sont des effectifs absolus. Le
// total mesuré (measuredTotal) est INFÉRIEUR au nombre d'abonnés (observé :
// 2164 sur 2429, ≈ 89 %) — seuls les abonnés pour qui Meta a la donnée
// entrent dans le calcul, à ne jamais présenter comme exhaustif.
export function mockAudienceDemographics(accountId: string, followersTotal: number) {
  const r = rng(`${accountId}:demographics`);
  const measuredTotal = Math.round(followersTotal * (between(r, 82, 94) / 100));

  const followerCitiesRaw = buildCityDemographicsMetric(r, followersTotal, 0.35);
  const followerCountriesRaw = buildCountryDemographicsMetric(r, followersTotal);

  return {
    measuredTotal,
    followerCities: parseInsightsBreakdown(followerCitiesRaw, (v) => v).sort((a, b) => b.value - a.value),
    followerCountries: parseInsightsBreakdown(followerCountriesRaw, (v) => ISO_COUNTRY_LABELS[v] ?? v).sort((a, b) => b.value - a.value),
    genderSplit: buildGenderSplit(r, measuredTotal),
    ageSplit: buildAgeSplit(r, measuredTotal),
  };
}

export interface MentionItem {
  kind: "comment" | "post" | "tag";
  author: string;
  text: string;
  date: string;
}

// GET /{ig-user-id}/tags — VÉRIFIÉ le 08/09/2026 : endpoint accessible avec
// les scopes courants, renvoie {"data":[]} sur le compte de test (aucune
// mention à ce jour, structure confirmée). Webhook `mentions` (temps réel,
// captures en légende/commentaire) — NON VÉRIFIÉ CONTRE L'API : demande une
// URL publique de réception, jamais configurée. Les mentions en story ne
// sont de toute façon pas captées par ce webhook.
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

// Personas — section "Personas" d'Import/API, entièrement simulée
// aujourd'hui : ni la classification par LLM des publications (①), ni
// celle des commentaires (②/③), ne sont branchées. Dépendances réelles,
// une fois branchées :
//   ① Résonance — disponible dès le branchement de l'API : GET /media
//     (caption, media_product_type) + GET /{media-id}/insights (reach,
//     total_interactions). Un LLM classe chaque publication dans un seul
//     persona à partir de sa légende ; taux d'engagement par publication
//     = total_interactions ÷ reach ; MOYENNE par persona (jamais la
//     somme, sinon le volume de publication d'un persona pilote son
//     score) ; les quatre moyennes sont normalisées pour totaliser 100 %.
//   ②/③ Poids dans la conversation / Signature — nécessitent un
//     HISTORIQUE de commentaires accumulé par nos soins : GET
//     /{media-id}/comments (username, text, timestamp) ne renvoie que les
//     commentaires actuels, aucun rétroactif, et rien ne relie un
//     commentateur à un profil au premier appel. Compter 4 à 8 semaines
//     avant que ces deux indicateurs aient de la matière. Regrouper par
//     username, classer chaque commentaire (texte + persona de la
//     publication commentée), attribuer à chaque commentateur son
//     persona DOMINANT — compter les personnes, pas les commentaires.
//   ④ Trajectoire — résonance sur 30 jours vs 90 jours précédents ;
//     impossible avant 3 mois d'historique accumulé (les insights Meta
//     eux-mêmes ne remontent que 90 jours en arrière) — afficher
//     "Historique insuffisant" plutôt qu'un faux zéro en dessous de ce
//     seuil, jamais masqué silencieusement.
// "Part d'audience" ne doit JAMAIS être écrit ni suggéré nulle part ici :
// un persona est un archétype éditorial, pas un segment de population —
// on ne compte jamais d'individus qui "appartiendraient" à un persona.

export type PersonaKey = "casual-premium" | "rugby-lifestyle" | "urban-lifestyle" | "sport-outdoor";

export interface PersonaDefinition {
  key: PersonaKey;
  name: string;
  description: string;
  tags: string[];
}

export const PERSONA_DEFINITIONS: PersonaDefinition[] = [
  { key: "casual-premium", name: "Casual Premium", description: "Mode masculine élégante et décontractée.", tags: ["Mode", "Gastronomie", "Voyage", "Golf"] },
  { key: "rugby-lifestyle", name: "Rugby Lifestyle", description: "Segment fortement connecté à l'ADN rugby et sport chic.", tags: ["Rugby", "Sport", "Lifestyle", "Événements"] },
  { key: "urban-lifestyle", name: "Urban Lifestyle", description: "Audience plus contemporaine orientée mode, voyage et expériences.", tags: ["Mode", "Travel", "Restaurants", "Sneakers"] },
  { key: "sport-outdoor", name: "Sport & Outdoor", description: "Audience davantage orientée sport et activités extérieures.", tags: ["Running", "Outdoor", "Fitness"] },
];

// Palette dédiée aux personas, tokens uniquement — réutilisée à l'identique
// pour les cartes de la section Personas et pour les badges de la colonne
// Persona du tableau des commentateurs, c'est ce lien visuel qui rend les
// deux sections cohérentes.
export const PERSONA_COLORS: Record<PersonaKey, { text: string; bg: string; border: string }> = {
  "casual-premium": { text: "var(--bleu)", bg: "var(--bleu-bg)", border: "var(--bleu)" },
  "rugby-lifestyle": { text: "var(--vert-logo)", bg: "var(--vert-pastel)", border: "var(--vert-logo)" },
  "urban-lifestyle": { text: "var(--encre-froide)", bg: "var(--pastel-violet)", border: "var(--pastel-violet)" },
  "sport-outdoor": { text: "var(--encre)", bg: "var(--pastel-jaune)", border: "var(--pastel-jaune)" },
};

const PERSONA_SIGNATURES: Record<PersonaKey, { formatHighlight: string; timeWindow: string; vocabulary: string }> = {
  "casual-premium": {
    formatHighlight: "Post carrousel lookbook, +35 % vs moyenne du compte",
    timeWindow: "Commente surtout en fin de journée, 18h-20h",
    vocabulary: "Parle de « coupe », « matière », « intemporel »",
  },
  "rugby-lifestyle": {
    formatHighlight: "Reel coulisses de match, +52 % vs moyenne du compte",
    timeWindow: "Commente surtout en soirée, 19h-22h",
    vocabulary: "Parle de « match », « club », « les gars »",
  },
  "urban-lifestyle": {
    formatHighlight: "Story sondage produit, meilleur taux de réponse du compte",
    timeWindow: "Commente plutôt en journée, 12h-14h",
    vocabulary: "Parle de « look », « citytrip », « adresse »",
  },
  "sport-outdoor": {
    formatHighlight: "Reel entraînement en extérieur, +28 % vs moyenne du compte",
    timeWindow: "Commente tôt le matin, 6h-8h",
    vocabulary: "Parle de « sortie », « chrono », « performance »",
  },
};

export interface PersonaTrajectory {
  sufficientHistory: boolean;
  deltaPts: number | null;
  emergent: boolean;
}

export interface PersonaMetrics {
  key: PersonaKey;
  resonancePct: number;
  conversationPct: number;
  conversationDenominator: number;
  signature: { formatHighlight: string; timeWindow: string; vocabulary: string };
  trajectory: PersonaTrajectory;
}

export interface PersonasOverview {
  personas: (PersonaDefinition & { metrics: PersonaMetrics })[];
  publicationsClassified: number;
  distinctCommentersAnalyzed: number;
  periodMonths: number;
  summarySentence: string;
}

function normalizeToHundred(weights: number[]): number[] {
  const sum = weights.reduce((s, w) => s + w, 0);
  const rounded = weights.map((w) => Math.round((w / sum) * 100));
  const diff = 100 - rounded.reduce((s, v) => s + v, 0);
  if (diff !== 0) {
    const maxIdx = rounded.indexOf(Math.max(...rounded));
    rounded[maxIdx] += diff;
  }
  return rounded;
}

function buildPersonasSummarySentence(metrics: { name: string; resonancePct: number; trajectory: PersonaTrajectory }[]): string {
  const byResonance = [...metrics].sort((a, b) => b.resonancePct - a.resonancePct);
  const leader = byResonance[0];
  const emergent = metrics.find((m) => m.trajectory.sufficientHistory && m.trajectory.emergent && m.name !== leader.name);
  if (emergent) {
    return `${leader.name} reste le persona qui capte le plus d'engagement, mais ${emergent.name} progresse le plus vite sur les trois derniers mois.`;
  }
  return `${leader.name} reste le persona qui capte le plus d'engagement, dans un équilibre stable sur les trois derniers mois.`;
}

// GET /media (caption, media_product_type) + GET /{media-id}/insights
// (reach, total_interactions) pour ①, GET /{media-id}/comments pour ②/③
// — voir le commentaire d'en-tête au-dessus pour le détail des
// dépendances et ce qui est vérifié vs simulé. Classification par LLM non
// branchée : les quatre personas et leurs quatre indicateurs sont
// entièrement simulés ici.
export function mockPersonasOverview(accountId: string, followersTotal: number): PersonasOverview {
  const r = rng(`${accountId}:personas`);

  const resonanceWeights = PERSONA_DEFINITIONS.map(() => between(r, 40, 100));
  const resonancePcts = normalizeToHundred(resonanceWeights);

  const conversationWeights = PERSONA_DEFINITIONS.map(() => between(r, 40, 100));
  const conversationPcts = normalizeToHundred(conversationWeights);

  const distinctCommentersAnalyzed = Math.max(60, Math.round(followersTotal * (between(r, 8, 18) / 1000)));

  const personas = PERSONA_DEFINITIONS.map((def, i) => {
    const sufficientHistory = r() > 0.2;
    const deltaPts = sufficientHistory ? between(r, -6, 12) : null;
    const trajectory: PersonaTrajectory = {
      sufficientHistory,
      deltaPts,
      emergent: sufficientHistory && (deltaPts ?? 0) > 5,
    };
    const metrics: PersonaMetrics = {
      key: def.key,
      resonancePct: resonancePcts[i],
      conversationPct: conversationPcts[i],
      conversationDenominator: distinctCommentersAnalyzed,
      signature: PERSONA_SIGNATURES[def.key],
      trajectory,
    };
    return { ...def, metrics };
  });

  return {
    personas,
    publicationsClassified: Math.max(40, Math.round(between(r, 140, 220))),
    distinctCommentersAnalyzed,
    periodMonths: 3,
    summarySentence: buildPersonasSummarySentence(personas.map((p) => ({ name: p.name, resonancePct: p.metrics.resonancePct, trajectory: p.metrics.trajectory }))),
  };
}

// Persona dominant d'un commentateur (②) : classement par persona DOMINANT
// des commentaires qu'il a laissés, jamais un compte par commentaire. Sous
// 3 commentaires, aucune dominante fiable — pas de persona attribué.
// Simulé ici (voir le commentaire d'en-tête plus haut pour la vraie
// méthode et ses dépendances) : chaque commentateur reçoit un persona
// stable, dérivé de son identité, sans lien avec les pourcentages agrégés
// de mockPersonasOverview ci-dessus (deux échantillons différents).
function mockCommenterPersona(accountId: string, username: string, commentCount: number): PersonaKey | null {
  if (commentCount < 3) return null;
  const r = rng(`${accountId}:commenter-persona:${username}`);
  return PERSONA_DEFINITIONS[Math.floor(r() * PERSONA_DEFINITIONS.length)].key;
}

export interface TopCommenter {
  username: string;
  verified: boolean;
  commentCount: number;
  lastCommentDate: string;
  personaKey: PersonaKey | null;
}

const HANDLE_PREFIXES = [
  "sophie", "marc", "clara", "julien", "amandine", "romain", "lea", "thibault", "camille", "pierre",
  "manon", "hugo", "chloe", "antoine", "laura", "maxime", "eva", "nicolas", "sarah", "vincent",
  "juliette", "alexandre", "emma", "florian", "pauline", "kevin", "margaux", "yanis", "lucie", "baptiste",
  "ines", "theo", "louise", "gabriel", "zoe", "mathis", "anna", "leo", "nina", "raphael",
  "eloise", "adrien", "celia", "quentin", "victoria", "simon", "alicia", "benjamin", "oceane", "arthur",
];
const HANDLE_SUFFIXES = ["", ".paris", "92", "_rugby", ".fr", "75", "_official", ".eden", "13", "_style"];

// GET /{media-id}/comments — VÉRIFIÉ le 08/09/2026 : fonctionne, renvoie id,
// text, timestamp, USERNAME, like_count. Le classement nominatif ci-dessous
// est donc techniquement possible dès le premier commentaire lu — la partie
// non vérifiée, c'est NOTRE mécanisme de collecte : ni le webhook `comments`
// (temps réel, section suivante) ni une collecte périodique par sondage de
// cet endpoint n'ont été configurés ou testés en continu. NON VÉRIFIÉ
// CONTRE L'API sur cet aspect (l'accumulation elle-même, pas l'identité du
// commentateur qui est confirmée présente). count=50 correspond à
// l'affichage produit, pas à une limite API.
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
      personaKey: mockCommenterPersona(accountId, handle, commentCount),
    });
  }
  return rows.sort((a, b) => b.commentCount - a.commentCount);
}

export interface FollowerMovementCounts {
  nouveau: number;
  revenu: number;
  toujoursLa: number;
  parti: number;
}

export interface ArrivalExampleRow {
  username: string;
  verified: boolean;
  followedAt: string;
  movement: "nouveau" | "revenu";
  windowStart: string;
  windowEnd: string;
}

export interface DepartureExampleRow {
  username: string;
  verified: boolean;
  followedAt: string;
  windowStart: string;
  windowEnd: string;
  tenureDays: number;
}

export interface FollowerMovementsExample {
  counts: FollowerMovementCounts;
  arrivals: ArrivalExampleRow[];
  departures: DepartureExampleRow[];
}

function randomHandle(r: () => number, used: Set<string>): string {
  let handle = "";
  do {
    const prefix = HANDLE_PREFIXES[Math.floor(r() * HANDLE_PREFIXES.length)];
    const suffix = HANDLE_SUFFIXES[Math.floor(r() * HANDLE_SUFFIXES.length)];
    handle = `${prefix}${suffix}`;
  } while (used.has(handle));
  used.add(handle);
  return handle;
}

function daysBefore(anchorIso: string, days: number): string {
  const d = new Date(`${anchorIso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

// Exemple illustratif pour la section "Suivi nominatif" — la mécanique
// (comparaison des deux derniers imports : v_follower_movements/
// v_recent_departures/v_recent_arrivals) est réelle et déjà active, mais un
// exemple à comptes fictifs se lit mieux qu'un tableau clairsemé sur un
// compte dont peu de mouvements ont été identifiés récemment. Aucun
// mécanisme de révélation ici : ces identités sont déjà fictives, pas des
// données personnelles à protéger.
export function mockFollowerMovementsExample(accountId: string, followersTotal: number): FollowerMovementsExample {
  const r = rng(`${accountId}:movements-example`);
  const used = new Set<string>();
  const windowStart = "2026-08-01";
  const windowEnd = "2026-09-01";

  const nouveau = Math.max(1, Math.round(followersTotal * (between(r, 15, 35) / 1000)));
  const revenu = Math.max(0, Math.round(followersTotal * (between(r, 1, 4) / 1000)));
  const parti = Math.max(1, Math.round(followersTotal * (between(r, 5, 15) / 1000)));
  const toujoursLa = Math.max(0, followersTotal - nouveau - parti);

  const arrivals: ArrivalExampleRow[] = Array.from({ length: 5 }, (_, i) => ({
    username: randomHandle(r, used),
    verified: r() < 0.04,
    followedAt: daysBefore(windowEnd, between(r, 1, 30)),
    movement: i < 4 ? "nouveau" : "revenu",
    windowStart,
    windowEnd,
  }));

  const departures: DepartureExampleRow[] = Array.from({ length: 5 }, () => {
    const tenureDays = between(r, 20, 900);
    return {
      username: randomHandle(r, used),
      verified: r() < 0.02,
      followedAt: daysBefore(windowEnd, tenureDays),
      windowStart,
      windowEnd,
      tenureDays,
    };
  });

  return { counts: { nouveau, revenu, toujoursLa, parti }, arrivals, departures };
}

export interface LiveCommentSeed {
  author: string;
  text: string;
}

// Webhook `comments` (temps réel) — NON VÉRIFIÉ CONTRE L'API : demande une
// URL publique de réception, jamais configurée ni testée. Voir
// mockTopCommenters pour la nuance : l'identité du commentateur, elle, est
// confirmée présente dans /{media-id}/comments (endpoint de lecture ponctuelle).
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
