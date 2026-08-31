// PRD §7.3, §7.4 — utilitaires de parsing tolérants pour les valeurs
// formatées des exports Instagram (nombres, pourcentages, intervalles de
// dates anglais à année implicite) et la correspondance de clés
// string_map_data par préfixe normalisé (jamais par égalité exacte : les
// libellés varient selon la langue du compte et sont eux-mêmes affectés par
// le mojibake).

export function normalizeKey(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export interface StringMapEntry {
  value?: string;
  href?: string;
  timestamp?: number;
}
export type StringMap = Record<string, StringMapEntry>;

/** Cherche la première clé de `map` dont la forme normalisée commence par
 * l'un des préfixes donnés (eux-mêmes normalisés), et retourne sa `value`. */
export function findByPrefix(map: StringMap | null | undefined, prefixes: string[]): string | null {
  if (!map) return null;
  const entries = Object.entries(map);
  for (const prefix of prefixes) {
    const normPrefix = normalizeKey(prefix);
    const hit = entries.find(([k]) => normalizeKey(k).startsWith(normPrefix));
    if (hit) return hit[1]?.value ?? null;
  }
  return null;
}

/** "102,497" -> 102497. Tolère les séparateurs de milliers et un signe. */
export function parseFormattedInt(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d-]/g, "");
  if (!cleaned || cleaned === "-") return null;
  const n = parseInt(cleaned, 10);
  return Number.isNaN(n) ? null : n;
}

/** "+10.5% vs Feb 28 - May 28" -> 10.5 */
export function parsePercent(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const match = raw.match(/(-?\d+(?:[.,]\d+)?)\s*%/);
  if (!match) return null;
  return parseFloat(match[1].replace(",", "."));
}

const MONTHS: Record<string, number> = {
  jan: 0, january: 0, janvier: 0,
  feb: 1, february: 1, fevrier: 1,
  mar: 2, march: 2, mars: 2,
  apr: 3, april: 3, avril: 3,
  may: 4, mai: 4,
  jun: 5, june: 5, juin: 5,
  jul: 6, july: 6, juillet: 6,
  aug: 7, august: 7, aout: 7,
  sep: 8, sept: 8, september: 8, septembre: 8,
  oct: 9, october: 9, octobre: 9,
  nov: 10, november: 10, novembre: 10,
  dec: 11, december: 11, decembre: 11,
};

function parseMonthDay(part: string): { month: number; day: number } | null {
  const m = part.trim().match(/^([A-Za-zÀ-ÿ]+)\.?\s+(\d{1,2})$/);
  if (!m) return null;
  const month = MONTHS[normalizeKey(m[1])];
  if (month === undefined) return null;
  return { month, day: parseInt(m[2], 10) };
}

/** Parse un intervalle "May 29 - Aug 26" (§7.4) : l'année n'est jamais
 * indiquée, elle se déduit de `referenceDate` (date de génération de
 * l'export) en supposant que l'intervalle se termine avant ou à cette
 * date, et ne franchit l'année que si le mois de fin précède le mois de
 * début (ex. "Dec 15 - Jan 10"). */
export function parseEnglishDateRange(
  raw: string,
  referenceDate: Date,
): { start: Date; end: Date } | null {
  const parts = raw.split(/\s+-\s+/);
  if (parts.length !== 2) return null;
  const startPart = parseMonthDay(parts[0]);
  const endPart = parseMonthDay(parts[1]);
  if (!startPart || !endPart) return null;

  let year = referenceDate.getUTCFullYear();
  let end = new Date(Date.UTC(year, endPart.month, endPart.day));
  if (end.getTime() > referenceDate.getTime()) {
    year -= 1;
    end = new Date(Date.UTC(year, endPart.month, endPart.day));
  }
  let startYear = year;
  let start = new Date(Date.UTC(startYear, startPart.month, startPart.day));
  if (start.getTime() > end.getTime()) {
    startYear -= 1;
    start = new Date(Date.UTC(startYear, startPart.month, startPart.day));
  }
  return { start, end };
}
