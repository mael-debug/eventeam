// PRD §7.4 — audience_insights.json / profiles_reached.json /
// content_interactions.json : objet, clé variable selon le fichier, tableau
// d'un élément portant string_map_data.
//
// AVERTISSEMENT : les libellés exacts utilisés par Instagram dans ces
// fichiers n'ont pas pu être vérifiés contre un export réel dans cette
// session (aucun export Eden Park n'était disponible). Chaque champ est
// recherché par préfixe normalisé, en français et en anglais, avec repli
// gracieux (valeur nulle plutôt qu'échec) si non trouvé — conformément à
// §7.2 étape 3, une étiquette non reconnue ne doit jamais interrompre
// l'import. À affiner dès qu'un export réel est disponible.

import { fixMojibake } from "./mojibake.ts";
import {
  findByPrefix,
  parseEnglishDateRange,
  parseFormattedInt,
  parsePercent,
  type StringMap,
} from "./parsing.ts";

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
}

export function parseAudienceInsights(
  json: unknown,
  exportedAt: Date,
  fallbackPeriod: { start: Date; end: Date },
): ParsedAudienceInsights {
  const map = firstStringMap(json);
  const { start, end, usedFallback } = periodOrFallback(map, exportedAt, fallbackPeriod);

  const gained = parseFormattedInt(
    findByPrefix(map, ["follows", "gained", "gagnes", "nouveaux abonnes"]),
  );
  const lost = parseFormattedInt(
    findByPrefix(map, ["unfollows", "lost", "perdus", "desabonnements"]),
  );

  return {
    periodStart: start,
    periodEnd: end,
    usedFallbackPeriod: usedFallback,
    followersTotal: parseFormattedInt(findByPrefix(map, ["followers", "abonnes"])),
    followersGained: gained,
    followersLost: lost,
    followersNet: gained !== null && lost !== null ? gained - lost : null,
    growthPct: parsePercent(findByPrefix(map, ["growth", "croissance"])),
    malePct: parsePercent(findByPrefix(map, ["male", "hommes"])),
    femalePct: parsePercent(findByPrefix(map, ["female", "femmes"])),
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
