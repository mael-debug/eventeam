// PRD §7.4 — formats followers_*.json (tableau racine) et following.json
// (objet, clé relationships_following), même forme interne : string_list_data.

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

function extractFromContainers(containers: RawStringListContainer[]): ParsedFollower[] {
  const out: ParsedFollower[] = [];
  for (const c of containers) {
    for (const entry of c.string_list_data ?? []) {
      if (!entry.value || !entry.timestamp) continue;
      out.push({
        username: fixMojibake(entry.value).toLowerCase().trim(),
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
