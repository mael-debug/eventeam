// PRD §7.3, §7.4 — utilitaires de parsing tolérants pour les valeurs
// formatées des exports Instagram (nombres, pourcentages, intervalles de
// dates anglais à année implicite) et la correspondance de clés
// string_map_data par préfixe normalisé (jamais par égalité exacte : les
// libellés varient selon la langue du compte et sont eux-mêmes affectés par
// le mojibake).

// media_key = identifiant numérique Instagram embarqué dans un chemin de
// fichier media (uri d'export ou source_path de storage). Piège confirmé
// contre un export réel : un chemin comme "media/reels/202608/186144...mp4"
// contient DEUX suites de 6+ chiffres — le dossier "202608" (année-mois) et
// le vrai identifiant du fichier — et un /(\d{6,})/ sur le chemin complet
// attrape le premier, donc le dossier, pas le fichier. Se limiter au nom de
// fichier (dernier segment du chemin) élimine ce piège : seul l'identifiant
// réel y figure.
export function extractMediaKey(pathOrUri: string | undefined | null): string | null {
  if (!pathOrUri) return null;
  const filename = pathOrUri.split("/").pop() ?? pathOrUri;
  const match = filename.match(/(\d{6,})/);
  return match ? match[1] : null;
}

// Encodage (non documenté par Meta, mais stable et public depuis des années,
// utilisé par de nombreux outils tiers) qui transforme le media_key numérique
// en shortcode Instagram : base64 avec l'alphabet propre à Instagram,
// chiffres de poids fort en premier. BigInt obligatoire — le media_key réel
// (ex. 18117474704481294, 17 chiffres) dépasse Number.MAX_SAFE_INTEGER.
// Sert à reconstruire un lien https://www.instagram.com/p/<shortcode>/ :
// posts.json (export Meta) ne contient aucun permalink direct.
const SHORTCODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
export function mediaKeyToShortcode(mediaKey: string): string | null {
  if (!/^\d+$/.test(mediaKey)) return null;
  let id = BigInt(mediaKey);
  if (id <= 0n) return null;
  let shortcode = "";
  while (id > 0n) {
    shortcode = SHORTCODE_ALPHABET[Number(id % 64n)] + shortcode;
    id /= 64n;
  }
  return shortcode;
}

export function normalizeKey(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "") // apostrophes typographiques ("J'aime", "l'âge") vs droites : ignorées
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " "); // \s couvre aussi l'espace insécable U+00A0
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

/** Égalité exacte (après normalisation). Nécessaire quand un libellé est un
 * préfixe strict d'un autre — ex. 'Followers' vs 'Followers en plus' : une
 * recherche par préfixe sur "followers" matcherait les deux. */
export function findExact(map: StringMap | null | undefined, keys: string[]): string | null {
  if (!map) return null;
  const entries = Object.entries(map);
  for (const key of keys) {
    const normKey = normalizeKey(key);
    const hit = entries.find(([k]) => normalizeKey(k) === normKey);
    if (hit) return hit[1]?.value ?? null;
  }
  return null;
}

/** Comme `findByPrefix`, mais discrimine sur la FIN de la clé plutôt que le
 * début. Nécessaire quand deux libellés partagent un préfixe et ne se
 * distinguent qu'à la fin — ex. "Pourcentage du total des followers
 * hommes" vs "Pourcentage du total des de followers femmes" (faute de
 * frappe "des de" côté Meta, un simple préfixe matcherait les deux). */
export function findBySuffix(map: StringMap | null | undefined, suffixes: string[]): string | null {
  if (!map) return null;
  const entries = Object.entries(map);
  for (const suffix of suffixes) {
    const normSuffix = normalizeKey(suffix);
    const hit = entries.find(([k]) => normalizeKey(k).endsWith(normSuffix));
    if (hit) return hit[1]?.value ?? null;
  }
  return null;
}

/** §14 (proposé) — clés normalisées d'un StringMap, pour comparaison contre
 * public.parser_label_map (empreinte de schéma / détection de dérive). */
export function normalizedKeysOf(map: StringMap | null | undefined): string[] {
  if (!map) return [];
  return Object.keys(map).map(normalizeKey);
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

/** "63.3K" -> 63300, "1.2M" -> 1200000, "102,497" -> 102497. Les activités
 * par jour de semaine sont abrégées avec un suffixe K/M ; les autres
 * compteurs ne le sont pas mais passent par ici sans dommage. */
export function parseMetricNumber(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const m = raw.trim().match(/^([+-]?[\d.,]+)\s*([kKmMbB])?$/);
  if (!m) return parseFormattedInt(raw);
  const n = parseFloat(m[1].replace(/,/g, ""));
  if (Number.isNaN(n)) return null;
  const mult = { k: 1_000, m: 1_000_000, b: 1_000_000_000 }[m[2]?.toLowerCase() as "k" | "m" | "b"] ?? 1;
  return Math.round(n * mult);
}

/** "France: 41.1%, Algeria: 13.9%, ..." -> [{name:"France", pct:41.1}, ...].
 * Format observé pour les répartitions géographiques ; utilisé aussi pour
 * les tranches d'âge par analogie (non vérifié indépendamment). */
export function parseLabeledPercentList(raw: string | null | undefined): { name: string; pct: number }[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((part) => {
      const [name, pctRaw] = part.split(":");
      if (!name || !pctRaw) return null;
      const pct = parsePercent(pctRaw);
      return pct === null ? null : { name: name.trim(), pct };
    })
    .filter((x): x is { name: string; pct: number } => x !== null);
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
