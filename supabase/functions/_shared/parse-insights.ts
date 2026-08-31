// PRD §7.4 — audience_insights.json / profiles_reached.json /
// content_interactions.json : objet, clé variable selon le fichier, tableau
// d'un élément portant string_map_data.
//
// STATUT DE CONFIANCE :
// - parseAudienceInsights, parseReachInsights, parseInteractionInsights :
//   clés exactes confirmées contre un export réel (voir les blocs de
//   commentaires au-dessus de chaque fonction). Repli gracieux (valeur
//   nulle plutôt qu'échec) conservé pour toute clé non reconnue —
//   conformément à §7.2 étape 3, une étiquette non reconnue ne doit jamais
//   interrompre l'import.

import { fixMojibake } from "./mojibake.ts";
import {
  findByPrefix,
  findBySuffix,
  findExact,
  normalizeKey,
  parseEnglishDateRange,
  parseFormattedInt,
  parseLabeledPercentList,
  parseMetricNumber,
  parsePercent,
  type StringMap,
} from "./parsing.ts";

const WEEKDAYS: { name: string; iso: number }[] = [
  { name: "lundi", iso: 1 },
  { name: "mardi", iso: 2 },
  { name: "mercredi", iso: 3 },
  { name: "jeudi", iso: 4 },
  { name: "vendredi", iso: 5 },
  { name: "samedi", iso: 6 },
  { name: "dimanche", iso: 7 },
];

export function firstStringMap(json: unknown): StringMap | null {
  if (!json || typeof json !== "object") return null;
  const values = Object.values(json as Record<string, unknown>);
  const arr = values.find((v) => Array.isArray(v)) as unknown[] | undefined;
  if (!arr || arr.length === 0) return null;
  const first = arr[0] as { string_map_data?: StringMap };
  if (!first.string_map_data) return null;

  const cleaned: StringMap = {};
  for (const [k, v] of Object.entries(first.string_map_data)) {
    cleaned[fixMojibake(k)] = { ...v, value: v.value ? fixMojibake(v.value) : v.value };
  }
  return cleaned;
}

function periodOrFallback(
  map: StringMap | null,
  exportedAt: Date,
  fallback: { start: Date; end: Date },
): { start: Date; end: Date; usedFallback: boolean } {
  const raw = findByPrefix(map, ["date range", "periode", "période"]);
  const parsed = raw ? parseEnglishDateRange(raw, exportedAt) : null;
  return parsed ? { ...parsed, usedFallback: false } : { ...fallback, usedFallback: true };
}

export interface ParsedAudienceInsights {
  periodStart: Date;
  periodEnd: Date;
  usedFallbackPeriod: boolean;
  followersTotal: number | null;
  followersGained: number | null;
  followersLost: number | null;
  followersNet: number | null;
  growthPct: number | null;
  malePct: number | null;
  femalePct: number | null;
  geo: { kind: "country" | "city"; name: string; pct: number }[];
  age: { gender: "all" | "male" | "female"; ageBucket: string; pct: number }[];
  activity: { weekday: number; activeCount: number }[];
}

/**
 * Clés exactes confirmées (racine `organic_insights_audience`,
 * `string_map_data`) :
 *   'Période'                            -> "May 29 - Aug 26"
 *   'Followers'                          -> "102,497"   (le VRAI total)
 *   'Nombre de followers'                -> "+10.5% vs Feb 28 - May 28"
 *   'Followers en plus'                  -> "19,055"
 *   'Followers en moins'                 -> "9,260"
 *   'Total des followers'                -> "9,795"     (= net, PAS le total
 *                                            malgré le libellé — piège)
 *   'Pourcentage de followers en fonction de la ville'
 *   'Pourcentage de followers en fonction du pays'
 *   'Pourcentage de followers en fonction de l'âge pour tous les genres'
 *   'Pourcentage de followers hommes en fonction de l'âge'
 *   'Pourcentage de followers femmes en fonction de l'âge'
 *   'Pourcentage du total des followers hommes'
 *   'Pourcentage du total des de followers femmes'  (faute "des de" chez Meta)
 *   'Activité des followers : lundi'     -> "63.3K"     (+ 6 autres jours)
 * Les clés elles-mêmes sont en mojibake, corrigées comme les valeurs par
 * `firstStringMap`. Le format des listes géo/âge ("Pays: pct%, ...") est
 * confirmé pour la géo ; supposé identique pour l'âge par analogie.
 */
export function parseAudienceInsights(
  json: unknown,
  exportedAt: Date,
  fallbackPeriod: { start: Date; end: Date },
): ParsedAudienceInsights {
  const map = firstStringMap(json);
  const { start, end, usedFallback } = periodOrFallback(map, exportedAt, fallbackPeriod);

  const geo: ParsedAudienceInsights["geo"] = [
    ...parseLabeledPercentList(findByPrefix(map, ["pourcentage de followers en fonction du pays"])).map(
      (e) => ({ kind: "country" as const, ...e }),
    ),
    ...parseLabeledPercentList(findByPrefix(map, ["pourcentage de followers en fonction de la ville"])).map(
      (e) => ({ kind: "city" as const, ...e }),
    ),
  ];

  const age: ParsedAudienceInsights["age"] = [
    ...parseLabeledPercentList(
      findByPrefix(map, ["pourcentage de followers en fonction de l'age pour tous les genres"]),
    ).map((e) => ({ gender: "all" as const, ageBucket: e.name, pct: e.pct })),
    ...parseLabeledPercentList(findByPrefix(map, ["pourcentage de followers hommes en fonction de l'age"])).map(
      (e) => ({ gender: "male" as const, ageBucket: e.name, pct: e.pct }),
    ),
    ...parseLabeledPercentList(findByPrefix(map, ["pourcentage de followers femmes en fonction de l'age"])).map(
      (e) => ({ gender: "female" as const, ageBucket: e.name, pct: e.pct }),
    ),
  ];

  const activity: ParsedAudienceInsights["activity"] = WEEKDAYS.map(({ name, iso }) => {
    const raw = findByPrefix(map, [`activite des followers : ${name}`]);
    const activeCount = parseMetricNumber(raw);
    return activeCount === null ? null : { weekday: iso, activeCount };
  }).filter((x): x is { weekday: number; activeCount: number } => x !== null);

  return {
    periodStart: start,
    periodEnd: end,
    usedFallbackPeriod: usedFallback,
    followersTotal: parseFormattedInt(findExact(map, ["followers"])),
    followersGained: parseFormattedInt(findByPrefix(map, ["followers en plus"])),
    followersLost: parseFormattedInt(findByPrefix(map, ["followers en moins"])),
    followersNet: parseFormattedInt(findExact(map, ["total des followers"])),
    growthPct: parsePercent(findByPrefix(map, ["nombre de followers"])),
    malePct: parsePercent(findBySuffix(map, ["followers hommes"])),
    femalePct: parsePercent(findBySuffix(map, ["followers femmes"])),
    geo,
    age,
    activity,
  };
}

/**
 * Clés exactes confirmées contre un export réel (Eden Park), racine
 * `organic_insights_reach`, string_map_data :
 *   'Période'                              -> "May 29 - Aug 26"
 *   'Comptes touchés'                      -> "3359140"        (SANS séparateur de milliers,
 *                                              contrairement à 'Impressions' du même fichier — piège)
 *   'Nombre de comptes touchés'            -> "+59.4% vs Feb 28 - May 28"
 *   'Followers'                            -> "1%"             (part de PORTÉE ici — sans rapport
 *                                              avec 'Followers' = 102 497 dans audience_insights.json,
 *                                              piège le plus dangereux : ne jamais partager une
 *                                              correspondance de libellés entre fichiers)
 *   'Non-followers'                        -> "99%"
 *   'Impressions'                          -> "15,570,962"     (AVEC séparateur)
 *   'Nombre d'impressions'                 -> "+93.4%"         (SANS le suffixe « vs ... », contrairement
 *                                              aux autres champs de variation — parsePercent ne dépend
 *                                              pas de ce suffixe, aucun changement nécessaire pour ce piège)
 *   'Visites du profil'                    -> "103,643"
 *   'Nombre de visites sur le profil'      -> "-6.3%"
 *   'Appuis sur les liens externes'        -> "3,427"
 *   'Nombre d'appuis sur des liens externes' -> "-20.7%"
 * Note : chaque compteur et sa variation sont deux clés DISTINCTES (piège
 * de l'implémentation précédente, jamais vérifiée contre un export réel :
 * le delta était calculé à partir de la clé du compteur, qui ne contient
 * jamais de %, donnant toujours null).
 */
export interface ParsedReachInsights {
  periodStart: Date;
  periodEnd: Date;
  usedFallbackPeriod: boolean;
  accountsReached: number | null;
  reachDeltaPct: number | null;
  followerReachPct: number | null;
  nonFollowerReachPct: number | null;
  impressions: number | null;
  impressionsDeltaPct: number | null;
  profileVisits: number | null;
  profileVisitsDeltaPct: number | null;
  externalTaps: number | null;
  externalTapsDeltaPct: number | null;
}

export function parseReachInsights(
  json: unknown,
  exportedAt: Date,
  fallbackPeriod: { start: Date; end: Date },
): ParsedReachInsights {
  const map = firstStringMap(json);
  const { start, end, usedFallback } = periodOrFallback(map, exportedAt, fallbackPeriod);

  return {
    periodStart: start,
    periodEnd: end,
    usedFallbackPeriod: usedFallback,
    accountsReached: parseFormattedInt(findExact(map, ["comptes touches"])),
    reachDeltaPct: parsePercent(findByPrefix(map, ["nombre de comptes touches"])),
    followerReachPct: parsePercent(findExact(map, ["followers"])),
    nonFollowerReachPct: parsePercent(findExact(map, ["non-followers"])),
    impressions: parseFormattedInt(findExact(map, ["impressions"])),
    impressionsDeltaPct: parsePercent(findByPrefix(map, ["nombre dimpressions"])),
    profileVisits: parseFormattedInt(findExact(map, ["visites du profil"])),
    profileVisitsDeltaPct: parsePercent(findByPrefix(map, ["nombre de visites sur le profil"])),
    externalTaps: parseFormattedInt(findExact(map, ["appuis sur les liens externes"])),
    externalTapsDeltaPct: parsePercent(findByPrefix(map, ["nombre dappuis"])),
  };
}

/**
 * Clés exactes confirmées contre un export réel, racine
 * `organic_insights_interactions`, string_map_data. Un bloc par format,
 * chacun avec ses propres libellés (le pluriel varie : « Partages de
 * publications » mais « Partages des reels » — jamais de préfixe/suffixe
 * commun fiable entre formats, d'où une clé exacte par format plutôt qu'un
 * motif générique) :
 *   all     : 'Interactions avec le contenu' / 'Nombre d'interactions avec le contenu'
 *             + 'Comptes ayant interagi' / 'Nombre de comptes ayant interagi'
 *             + 'Comptes ayant interagi par type de followers' -> "Followers: 5.6%, Non-followers: 94.4%"
 *   posts   : 'Interactions avec les publications' / '... Nombre ...'
 *             'Mentions J'aime des publications', 'Commentaires sur les publications',
 *             'Partages de publications', 'Enregistrements de publications'
 *   stories : 'Interactions avec la story' / '... Nombre ...'
 *             'Réponses aux stories' (-> replies), 'Partages de stories'
 *   videos  : 'Interactions avec les vidéos' / '... Nombre ...' — aucune ventilation
 *             (pas dans l'énumération littérale du PRD, ajoutée au format check)
 *   reels   : 'Interactions avec les reels' / '... Nombre ...'
 *             'Mentions J'aime sur les reels', 'Commentaires sur les reels',
 *             'Partages des reels', 'Enregistrements de reels'
 *   lives   : 'Interactions avec les vidéos en direct' / '... Nombre ...' — aucune ventilation
 * Piège : un libellé cassé côté Meta (bug d'i18n, littéral `delta` non
 * substitué : « Vous avez interagi avec delta % de comptes en plus... »)
 * est ignoré explicitement — aucun champ ne le référence, et il n'existe
 * dans aucune des listes de correspondance ci-dessous.
 * Piège : les vidéos/lives peuvent valoir 0 (compte réel, pas une absence) —
 * parseFormattedInt("0") renvoie bien 0, jamais null.
 */
export interface ParsedInteractionFormat {
  format: "all" | "posts" | "stories" | "videos" | "reels" | "lives";
  interactions: number | null;
  deltaPct: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  replies: number | null;
  accountsInteracted: number | null;
  accountsInteractedDeltaPct: number | null;
  accountsInteractedFollowerPct: number | null;
  accountsInteractedNonFollowerPct: number | null;
}

export function parseInteractionInsights(json: unknown): ParsedInteractionFormat[] {
  const map = firstStringMap(json);
  if (!map) return [];

  const accountsInteractedRaw = findExact(map, ["comptes ayant interagi par type de followers"]);
  const accountsInteractedSplit = accountsInteractedRaw ? parseLabeledPercentList(accountsInteractedRaw) : [];
  const accountsInteractedFollowerPct =
    accountsInteractedSplit.find((e) => normalizeKey(e.name) === "followers")?.pct ?? null;
  const accountsInteractedNonFollowerPct =
    accountsInteractedSplit.find((e) => normalizeKey(e.name) === "non-followers")?.pct ?? null;

  function block(
    format: ParsedInteractionFormat["format"],
    interactionsKey: string,
    deltaKey: string,
    fields: { likes?: string; comments?: string; shares?: string; saves?: string; replies?: string } = {},
  ): ParsedInteractionFormat {
    return {
      format,
      interactions: parseFormattedInt(findExact(map, [interactionsKey])),
      deltaPct: parsePercent(findExact(map, [deltaKey])),
      likes: fields.likes ? parseFormattedInt(findExact(map, [fields.likes])) : null,
      comments: fields.comments ? parseFormattedInt(findExact(map, [fields.comments])) : null,
      shares: fields.shares ? parseFormattedInt(findExact(map, [fields.shares])) : null,
      saves: fields.saves ? parseFormattedInt(findExact(map, [fields.saves])) : null,
      replies: fields.replies ? parseFormattedInt(findExact(map, [fields.replies])) : null,
      accountsInteracted: format === "all" ? parseFormattedInt(findExact(map, ["comptes ayant interagi"])) : null,
      accountsInteractedDeltaPct:
        format === "all" ? parsePercent(findExact(map, ["nombre de comptes ayant interagi"])) : null,
      accountsInteractedFollowerPct: format === "all" ? accountsInteractedFollowerPct : null,
      accountsInteractedNonFollowerPct: format === "all" ? accountsInteractedNonFollowerPct : null,
    };
  }

  return [
    block("all", "interactions avec le contenu", "nombre dinteractions avec le contenu"),
    block("posts", "interactions avec les publications", "nombre dinteractions avec les publications", {
      likes: "mentions jaime des publications",
      comments: "commentaires sur les publications",
      shares: "partages de publications",
      saves: "enregistrements de publications",
    }),
    block("stories", "interactions avec la story", "nombre dinteractions avec la story", {
      replies: "reponses aux stories",
      shares: "partages de stories",
    }),
    block("videos", "interactions avec les videos", "nombre dinteractions avec les videos"),
    block("reels", "interactions avec les reels", "nombre dinteractions avec les reels", {
      likes: "mentions jaime sur les reels",
      comments: "commentaires sur les reels",
      shares: "partages des reels",
      saves: "enregistrements de reels",
    }),
    block("lives", "interactions avec les videos en direct", "nombre dinteractions avec les videos en direct"),
  ];
}
