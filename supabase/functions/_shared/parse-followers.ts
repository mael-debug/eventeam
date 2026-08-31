// PRD §7.4 — formats followers_*.json (tableau racine) et following.json
// (objet, clé relationships_following), même forme interne : string_list_data.
//
// Piège confirmé contre un export réel (Eden Park) : dans following.json,
// string_list_data[].value est absent — seul href est présent
// ("https://www.instagram.com/_u/karimbenzema"), alors que
// followers_*.json porte bien `value`. C'est la cause d'un import qui
// "réussissait" (aucune erreur) tout en n'important 0 compte suivi.
// Le pseudo se retrouve en dernier segment du chemin de l'URL — repli sur
// href quand value est absent, pour les deux fichiers (pas seulement
// following.json, au cas où le même piège existerait un jour côté
// followers).

import { fixMojibake } from "./mojibake.ts";

interface RawStringListEntry {
  href?: string;
  value?: string;
  timestamp?: number;
}
interface RawStringListContainer {
  string_list_data?: RawStringListEntry[];
}

export interface ParsedFollower {
  username: string;
  followedAt: Date;
}

function usernameFromHref(href: string | undefined): string | null {
  if (!href) return null;
  try {
    const segments = new URL(href).pathname.split("/").filter(Boolean);
    return segments[segments.length - 1] || null;
  } catch {
    return null;
  }
}

function extractFromContainers(containers: RawStringListContainer[]): ParsedFollower[] {
  const out: ParsedFollower[] = [];
  for (const c of containers) {
    for (const entry of c.string_list_data ?? []) {
      const rawUsername = entry.value ?? usernameFromHref(entry.href);
      if (!rawUsername || !entry.timestamp) continue;
      out.push({
        username: fixMojibake(rawUsername).toLowerCase().trim(),
        followedAt: new Date(entry.timestamp * 1000),
      });
    }
  }
  return out;
}

export function parseFollowersFile(json: unknown): ParsedFollower[] {
  if (!Array.isArray(json)) return [];
  return extractFromContainers(json as RawStringListContainer[]);
}

export function parseFollowingFile(json: unknown): ParsedFollower[] {
  if (!json || typeof json !== "object") return [];
  const containers = (json as Record<string, unknown>)["relationships_following"];
  if (!Array.isArray(containers)) return [];
  return extractFromContainers(containers as RawStringListContainer[]);
}
