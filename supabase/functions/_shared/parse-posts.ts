// PRD v1.0 §6.8, §7.4 — posts.json : objet racine `organic_insights_posts`
// (tableau), un élément par publication, avec `media_map_data` (une seule
// clé, mojibake « Miniature du média ») et `string_map_data`.
//
// Clés exactes confirmées contre un export réel (Eden Park) :
//   media_map_data['Miniature du média'].uri               -> "media/posts/18117474704481294.jpg"
//   media_map_data['Miniature du média'].creation_timestamp -> unix seconds
//   media_map_data['Miniature du média'].title              -> légende (mojibake, emoji inclus)
//   string_map_data['Timestamp de la création'].timestamp   -> unix seconds (la clé `value` est vide,
//                                                              c'est bien le champ `timestamp` de l'entrée qui porte la donnée)
//   string_map_data['Visites du profil']                    -> profile_visits
//   string_map_data['Impressions']                          -> impressions
//   string_map_data['Followers en plus']                    -> follows_gained
//   string_map_data['Comptes touchés']                      -> reach
//   string_map_data['Enregistrements']                      -> saves
//   string_map_data["J'aime"]                                -> likes
//   string_map_data['Commentaires']                         -> comments
//   string_map_data['Partages']                             -> shares
//   string_map_data['External link taps']                   -> external_taps
// media_key = l'identifiant numérique Instagram embarqué dans `uri`
// (stable, unique par publication) — pas le nom de fichier local, qui
// pourrait varier d'un export à l'autre.
//
// Piège observé sur l'export réel : au moins une publication (celle du 15
// juin dans l'exemple du PRD §4.8, « portée élevée, conversion forte ») a
// `media_map_data` entièrement vide — pas de uri, pas de vignette — alors
// que ses métriques dans `string_map_data` sont complètes et réelles. La
// perdre silencieusement biaiserait follow_conversion_rate (déjà utilisé
// comme exemple canonique dans le PRD). Repli sur le timestamp de création
// (présent dans les deux cas) comme media_key synthétique.
//
// Aucune indication de format (post/reel/story) n'est présente dans ce
// fichier : `organic_insights_posts` ne couvre, par son propre nom, que les
// publications statiques. media_type est donc fixé à 'post' pour tout ce
// fichier — à corriger si un fichier séparé pour les reels est fourni un
// jour (le PRD v1.0 §6.8 prévoit 'reel'/'story'/'live'/'carousel' aussi).

import { fixMojibake } from "./mojibake.ts";
import { extractMediaKey, findExact, normalizeKey, parseFormattedInt, type StringMap } from "./parsing.ts";

interface RawMediaEntry {
  uri?: string;
  creation_timestamp?: number;
  title?: string;
}
interface RawPost {
  media_map_data?: Record<string, RawMediaEntry>;
  string_map_data?: StringMap;
}

export interface ParsedPost {
  mediaKey: string;
  permalink: string | null;
  publishedAt: Date;
  caption: string | null;
  thumbPath: string | null;
  reach: number | null;
  impressions: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  profileVisits: number | null;
  followsGained: number | null;
  externalTaps: number | null;
}

function cleanStringMap(raw: StringMap | undefined): StringMap {
  const cleaned: StringMap = {};
  for (const [k, v] of Object.entries(raw ?? {})) {
    cleaned[fixMojibake(k)] = { ...v, value: v.value ? fixMojibake(v.value) : v.value };
  }
  return cleaned;
}

/** §14 (proposé) — union des clés normalisées vues sur l'ensemble des
 * publications du fichier, pour l'empreinte de schéma (public.parser_label_map). */
export function collectPostKeys(json: unknown): string[] {
  if (!json || typeof json !== "object") return [];
  const posts = (json as Record<string, unknown>)["organic_insights_posts"];
  if (!Array.isArray(posts)) return [];
  const keys = new Set<string>();
  for (const raw of posts as RawPost[]) {
    for (const k of Object.keys(raw.string_map_data ?? {})) keys.add(normalizeKey(fixMojibake(k)));
  }
  return [...keys];
}

export function parsePostsFile(json: unknown): ParsedPost[] {
  if (!json || typeof json !== "object") return [];
  const posts = (json as Record<string, unknown>)["organic_insights_posts"];
  if (!Array.isArray(posts)) return [];

  const out: ParsedPost[] = [];
  for (const raw of posts as RawPost[]) {
    const mediaEntries = Object.values(raw.media_map_data ?? {});
    const media = mediaEntries[0];
    const map = cleanStringMap(raw.string_map_data);

    const timestampSeconds =
      Object.entries(map).find(([k]) => k.toLowerCase().startsWith("timestamp de la cr"))?.[1]?.timestamp
      ?? media?.creation_timestamp;
    if (!timestampSeconds) continue;
    const mediaKey = extractMediaKey(media?.uri) ?? `ts-${timestampSeconds}`;

    out.push({
      mediaKey,
      // Forcé à null (2026-09-04, deux tentatives) : media?.uri est le
      // chemin brut de l'export ("media/posts/xxxx.jpg"), pas une URL —
      // l'utiliser tel quel produisait un lien mort. Une reconstruction via
      // le shortcode Instagram (base64 du media_key) a été essayée puis
      // abandonnée : vérifiée en production, elle produit des liens qui ne
      // correspondent à aucune publication réelle (cf. parsing.ts, note
      // dans le bloc où mediaKeyToShortcode a été retiré) — rien ne garantit
      // que media_key soit le vrai media PK Instagram attendu par cet
      // algorithme. posts.json ne contient aucun permalink exploitable ;
      // mieux vaut ne pas afficher de lien que d'en afficher un faux.
      permalink: null,
      publishedAt: new Date(timestampSeconds * 1000),
      caption: media?.title ? fixMojibake(media.title) : null,
      // Forcé à null (2026-09-03) : media?.uri est le chemin brut de l'export
      // ("media/posts/xxxx.jpg"), qui ne correspond à aucun fichier jamais
      // uploadé — le dossier media/ n'est plus jamais fourni (régime
      // permanent, pas une anomalie). Le vrai chemin, quand une vignette
      // existe réellement en storage, se retrouve uniquement via
      // thumbByMediaKey dans process-import/index.ts.
      thumbPath: null,
      reach: parseFormattedInt(findExact(map, ["comptes touches"])),
      impressions: parseFormattedInt(findExact(map, ["impressions"])),
      likes: parseFormattedInt(findExact(map, ["j'aime", "jaime"])),
      comments: parseFormattedInt(findExact(map, ["commentaires"])),
      shares: parseFormattedInt(findExact(map, ["partages"])),
      saves: parseFormattedInt(findExact(map, ["enregistrements"])),
      profileVisits: parseFormattedInt(findExact(map, ["visites du profil"])),
      followsGained: parseFormattedInt(findExact(map, ["followers en plus"])),
      externalTaps: parseFormattedInt(findExact(map, ["external link taps"])),
    });
  }
  return out;
}
