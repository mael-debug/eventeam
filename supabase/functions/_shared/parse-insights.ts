// PRD §7.4 — audience_insights.json / profiles_reached.json /
// content_interactions.json : objet, clé variable selon le fichier, tableau
// d'un élément portant string_map_data.
//
// STATUT DE CONFIANCE :
// - parseAudienceInsights : clés exactes confirmées contre un export réel
//   (voir le bloc de commentaires au-dessus de la fonction).
// - parseReachInsights / parseInteractionInsights : profiles_reached.json et
//   content_interactions.json n'ont pas pu être vérifiés dans cette session
//   (fichiers non fournis). Recherche par préfixe normalisé, en français et
//   en anglais, avec repli gracieux (valeur nulle plutôt qu'échec) si non
//   trouvé — conformément à §7.2 étape 3, une étiquette non reconnue ne doit
//   jamais interrompre l'import. À vérifier dès que ces fichiers seront
//   fournis.

import { fixMojibake } from "./mojibake.ts";
import {
  findByPrefix,
  findBySuffix,
  findExact,
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

function firstStringMap(json: unknown): StringMap | null {
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

export interface ParsedReachInsights {
  periodStart: Date;
  periodEnd: Date;
  usedFallbackPeriod: boolean;
  accountsReached: number | null;
  reachDeltaPct: number | null;
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

  const reachRaw = findByPrefix(map, ["accounts reached", "comptes touches", "portee"]);
  const impressionsRaw = findByPrefix(map, ["impressions"]);
  const visitsRaw = findByPrefix(map, ["profile visits", "visites du profil"]);
  const tapsRaw = findByPrefix(map, ["external link taps", "clics sur le lien externe", "clics externes"]);

  return {
    periodStart: start,
    periodEnd: end,
    usedFallbackPeriod: usedFallback,
    accountsReached: parseFormattedInt(reachRaw),
    reachDeltaPct: parsePercent(reachRaw),
    impressions: parseFormattedInt(impressionsRaw),
    impressionsDeltaPct: parsePercent(impressionsRaw),
    profileVisits: parseFormattedInt(visitsRaw),
    profileVisitsDeltaPct: parsePercent(visitsRaw),
    externalTaps: parseFormattedInt(tapsRaw),
    externalTapsDeltaPct: parsePercent(tapsRaw),
  };
}

export interface ParsedInteractionInsights {
  interactions: number | null;
  deltaPct: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
}

export function parseInteractionInsights(json: unknown): ParsedInteractionInsights {
  const map = firstStringMap(json);
  const interactionsRaw = findByPrefix(map, ["interactions"]);

  return {
    interactions: parseFormattedInt(interactionsRaw),
    deltaPct: parsePercent(interactionsRaw),
    likes: parseFormattedInt(findByPrefix(map, ["likes", "mentions j'aime", "jaime"])),
    comments: parseFormattedInt(findByPrefix(map, ["comments", "commentaires"])),
    shares: parseFormattedInt(findByPrefix(map, ["shares", "partages"])),
    saves: parseFormattedInt(findByPrefix(map, ["saves", "enregistrements"])),
  };
}
