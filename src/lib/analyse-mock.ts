// Page Analyse — générateur de métriques simulées, déterministe (seed
// dérivée de l'ID du contenu ou du compte) pour rester stable d'un rendu à
// l'autre. Ces valeurs illustrent ce que l'API Graph Meta renverrait une
// fois branchée — jamais présentées comme mesurées. Plages calibrées sur le
// catalogue validé : ne pas inventer de champ hors de ce catalogue.

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

export type MediaType = "post" | "reel" | "story";

export interface MediaInsights {
  reach: number;
  views: number;
  likes: number | null;
  comments: number | null;
  saved: number | null;
  shares: number;
  follows: number | null;
  profileVisits: number | null;
  profileActivity: number | null;
  navigation: { tapForward: number; tapBack: number; tapExit: number; swipeForward: number } | null;
  replies: number | null;
  repliesBlockedEurope: boolean;
  avgWatchTimeSeconds: number | null;
  totalLikes: number | null;
  totalComments: number | null;
  totalViews: number | null;
  tooFewViewers: boolean;
}

// Disponibilité stricte par type — cf. catalogue §3.E. Ne jamais renvoyer une
// valeur pour une cellule marquée indisponible dans la doc source.
export function mockMediaInsights(contentId: string, mediaType: MediaType, followersTotal: number): MediaInsights {
  const r = rng(contentId);

  // Une story sur ~12 (déterministe) tombe sous le seuil des 5 vues : Meta ne
  // renvoie alors aucune donnée (erreur (#10) Not enough viewers).
  const tooFewViewers = mediaType === "story" && hashSeed(contentId) % 12 === 0;
  if (tooFewViewers) {
    return {
      reach: 0, views: 0, likes: null, comments: null, saved: null, shares: 0, follows: null,
      profileVisits: null, profileActivity: null, navigation: null, replies: null,
      repliesBlockedEurope: false, avgWatchTimeSeconds: null, totalLikes: null, totalComments: null,
      totalViews: null, tooFewViewers: true,
    };
  }

  const reachPct = between(r, 17, 50) / 100;
  const reach = mediaType === "story" ? between(r, 10000, 18000) : Math.round(followersTotal * reachPct);
  const viewsMultiplier = mediaType === "reel" ? between(r, 30, 80) / 10 : between(r, 12, 16) / 10;
  const views = Math.round(reach * viewsMultiplier);
  const likes = mediaType === "story" ? null : Math.round(reach * 0.06);
  const comments = mediaType === "story" ? null : Math.round((likes ?? 0) * 0.03);
  const saved = mediaType === "story" ? null : between(r, 40, 300);
  const shares = between(r, 10, 90);
  const follows = mediaType === "reel" ? null : between(r, 5, 60);
  const profileVisits = mediaType === "reel" ? null : between(r, 100, 900);
  const profileActivity = mediaType === "reel" ? null : Math.round((profileVisits ?? 0) * 0.4);
  const navigation =
    mediaType === "story"
      ? { tapForward: between(r, 2000, 5000), tapBack: between(r, 200, 600), tapExit: between(r, 300, 900), swipeForward: between(r, 100, 500) }
      : null;
  const repliesBlockedEurope = mediaType === "story";
  const replies = mediaType === "story" ? 0 : null;
  const avgWatchTimeSeconds = mediaType === "reel" ? between(r, 4, 12) : null;
  const bump = () => 1 + between(r, 5, 15) / 100;
  const totalLikes = likes != null ? Math.round(likes * bump()) : null;
  const totalComments = comments != null ? Math.round(comments * bump()) : null;
  const totalViews = Math.round(views * bump());

  return {
    reach, views, likes, comments, saved, shares, follows, profileVisits, profileActivity,
    navigation, replies, repliesBlockedEurope, avgWatchTimeSeconds, totalLikes, totalComments,
    totalViews, tooFewViewers: false,
  };
}

export interface AccountDailyPoint {
  date: string;
  reach: number;
}

// Courbe de portée compte, 30 points quotidiens — §3.B, cadence J.
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

export interface AccountPeriodTotals {
  accountsEngaged: number;
  totalInteractions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  followsAndUnfollows: { follows: number; unfollows: number };
  profileLinksTaps: number;
}

export function mockAccountPeriodTotals(accountId: string, followersTotal: number): AccountPeriodTotals {
  const r = rng(`${accountId}:period-totals`);
  const likes = Math.round(followersTotal * (between(r, 8, 14) / 100));
  const comments = Math.round(likes * 0.05);
  const shares = between(r, 400, 1200);
  const saves = between(r, 800, 2400);
  return {
    accountsEngaged: Math.round(followersTotal * (between(r, 3, 6) / 100)),
    totalInteractions: likes + comments + shares + saves,
    likes, comments, shares, saves,
    followsAndUnfollows: { follows: between(r, 8000, 20000), unfollows: between(r, 4000, 11000) },
    profileLinksTaps: between(r, 600, 1800),
  };
}

export interface DemographicRow {
  label: string;
  value: number;
}

const CITIES = ["Paris", "Lyon", "Marseille", "Bordeaux", "Toulouse", "Lille", "Nantes", "Nice"];
const COUNTRIES = ["France", "Belgique", "Suisse", "Algérie", "Royaume-Uni", "Maroc", "Canada", "États-Unis"];

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

export function mockCompetitors(accountId: string): CompetitorProfile[] {
  const r = rng(`${accountId}:competitors`);
  return [
    { username: "lacoste", name: "Lacoste", followersCount: 3_200_000 + between(r, -50000, 50000), mediaCount: between(r, 4200, 4800) },
    { username: "sergeblanco", name: "Serge Blanco", followersCount: 42_000 + between(r, -2000, 2000), mediaCount: between(r, 900, 1200) },
    { username: "ralphlaurenfrance", name: "Ralph Lauren France", followersCount: 210_000 + between(r, -8000, 8000), mediaCount: between(r, 1800, 2400) },
  ];
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
