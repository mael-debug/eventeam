// PRD v1.0 §6.8, Lot 5 — your_instagram_activity/media/{reels,stories,posts_N}.json.
//
// Structure réelle vérifiée sur un export Eden Park (inspection directe,
// pas une supposition) :
//   reels.json   -> { ig_reels_media: [ { media: [ { uri, creation_timestamp, title } ] } ] }
//   stories.json -> { ig_stories: [ { uri, creation_timestamp, title } ] }  (tableau plat, pas de media[])
//   posts_N.json -> tableau racine de [ { media: [ {uri, creation_timestamp, title}, ... ], title, creation_timestamp } ]
//                   (title au niveau de l'entrée pour un carrousel, PAS par image — plusieurs
//                   images peuvent partager la même légende et le même creation_timestamp)
//
// Aucun de ces trois fichiers ne porte de métrique (portée, likes, etc.) —
// confirmé en cherchant les media_key des reels dans organic_insights_posts
// (posts.json, déjà parsé) : aucune correspondance, les reels n'y figurent
// pas du tout. Les métriques par publication n'existent, dans cet export,
// que pour les posts statiques via logged_information/.../posts.json.
// reels.json/stories.json ne servent donc qu'à savoir CE QUI a été publié
// (légende, date), jamais à mesurer sa performance individuelle — écran
// Contenu : jamais mélangés à la grille classée par conversion, qui exige
// une métrique.

import { fixMojibake } from "./mojibake.ts";
import { extractMediaKey } from "./parsing.ts";

interface RawMediaItem {
  uri?: string;
  creation_timestamp?: number;
  title?: string;
}
interface RawReelEntry {
  media?: RawMediaItem[];
}
interface RawActivityPost {
  media?: RawMediaItem[];
  title?: string;
  creation_timestamp?: number;
}

export interface ParsedActivityMedia {
  mediaKey: string;
  publishedAt: Date;
  caption: string | null;
}

export function parseReelsFile(json: unknown): ParsedActivityMedia[] {
  if (!json || typeof json !== "object") return [];
  const entries = (json as Record<string, unknown>)["ig_reels_media"];
  if (!Array.isArray(entries)) return [];
  const out: ParsedActivityMedia[] = [];
  for (const entry of entries as RawReelEntry[]) {
    const m = entry.media?.[0];
    const mediaKey = extractMediaKey(m?.uri);
    if (!mediaKey || !m?.creation_timestamp) continue;
    out.push({ mediaKey, publishedAt: new Date(m.creation_timestamp * 1000), caption: m.title ? fixMojibake(m.title) : null });
  }
  return out;
}

export function parseStoriesFile(json: unknown): ParsedActivityMedia[] {
  if (!json || typeof json !== "object") return [];
  const entries = (json as Record<string, unknown>)["ig_stories"];
  if (!Array.isArray(entries)) return [];
  const out: ParsedActivityMedia[] = [];
  for (const m of entries as RawMediaItem[]) {
    const mediaKey = extractMediaKey(m?.uri);
    if (!mediaKey || !m?.creation_timestamp) continue;
    out.push({ mediaKey, publishedAt: new Date(m.creation_timestamp * 1000), caption: m.title ? fixMojibake(m.title) : null });
  }
  return out;
}

/** Légendes des publications statiques, indexées par media_key — pour
 * compléter les légendes de posts.json (logged_information/...) quand
 * elles sont vides, jamais pour créer de nouvelles publications (les
 * métriques restent la seule source de vérité sur QUELLES publications
 * existent, cf. parsePostsFile). */
export function parseActivityPostCaptions(json: unknown): Map<string, string> {
  const out = new Map<string, string>();
  if (!Array.isArray(json)) return out;
  for (const entry of json as RawActivityPost[]) {
    if (!entry.title) continue;
    const caption = fixMojibake(entry.title);
    for (const m of entry.media ?? []) {
      const mediaKey = extractMediaKey(m?.uri);
      if (mediaKey) out.set(mediaKey, caption);
    }
  }
  return out;
}
