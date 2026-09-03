// your_instagram_activity/media/posts.json (SANS suffixe numérique, ~21 Mo)
// — structure confirmée contre un export réel (Eden Park All, transmise
// directement, pas une supposition) : tableau racine d'objets
// { timestamp, media: [], label_values: [...], fbid }, même famille que
// your_chat_information.json — RIEN À VOIR avec posts_N.json (media[]/title
// au niveau racine, cf. parseActivityPostCaptions dans
// parse-activity-media.ts). Ne jamais router ce fichier vers ce parseur-là.
//
//   { "timestamp": 1785234519, "media": [],
//     "label_values": [
//       { "label": "Légende", "value": "L'élégance du cuir..." },
//       { "label": "Marqué comme généré par l'IA", "value": "Vrai" },
//       { "label": "Est une publicité", "value": "Faux" },
//       { "label": "Collaboration commerciale", "value": "Faux" },
//       { "label": "Publié", "value": "Vrai" },
//       { "label": "Contenu multimédia", "media": [{ "uri": "media/other/18159195736450118.jpg", ... }] }
//     ],
//     "fbid": "18159195736450118" }
//
// fbid = media_key : c'est l'identifiant numérique Instagram embarqué dans
// l'uri de "Contenu multimédia" (confirmé), donc identique au media_key
// qu'extrait déjà parse-posts.ts depuis logged_information/.../posts.json.
// Jointure directe sur content.media_key — ce fichier n'est JAMAIS une
// source de nouvelles publications (seul le fichier à métriques fait foi
// sur QUELLES publications existent), uniquement un enrichissement d'une
// ligne content déjà là (cf. upsert_post_labels_batch, migration 0041).
//
// EXIF (§9.1) : toute entrée de label_values portant un champ `media` (ex.
// "Contenu multimédia") est ignorée SANS jamais lire son contenu — ce
// sous-objet porte l'EXIF complet (lens_model, device_id,
// date_time_original, résolutions du plan focal...), et comme media/ n'est
// plus jamais fourni, c'est la seule surface EXIF qui reste dans l'import.
// Filtré à l'ingestion, jamais stocké puis masqué au rendu.
//
// Seuls 5 libellés sont confirmés contre le JSON brut (ceux de l'exemple
// ci-dessus). Les autres cités comme existants (Type de story, Mode de
// publication, Hashtags, Lieu, Partenaire de marque, Métadonnées du reel)
// sont extraits en best-effort par correspondance exacte sur le libellé
// français attendu ; tout label_values non reconnu (label + value présents,
// pas de champ media) atterrit dans extraLabels plutôt que d'être perdu —
// à vérifier/durcir dès qu'un export réel confirme leur forme exacte.

import { fixMojibake } from "./mojibake.ts";
import { normalizeKey } from "./parsing.ts";

interface RawLabelValue {
  label?: string;
  value?: string;
  media?: unknown[];
}
interface RawPostLabelEntry {
  fbid?: string;
  label_values?: RawLabelValue[];
}

export interface ParsedPostLabels {
  mediaKey: string;
  caption: string | null;
  isAiGenerated: boolean | null;
  isAd: boolean | null;
  isBrandedContent: boolean | null;
  isPublished: boolean | null;
  storyType: string | null;
  publishMode: string | null;
  hashtags: string[] | null;
  location: string | null;
  brandPartner: string | null;
  extraLabels: Record<string, string> | null;
}

function toBool(raw: string | undefined): boolean | null {
  if (raw === undefined) return null;
  const v = raw.trim().toLowerCase();
  if (v === "vrai") return true;
  if (v === "faux") return false;
  return null;
}

export function parsePostLabelsFile(json: unknown): ParsedPostLabels[] {
  if (!Array.isArray(json)) return [];

  const out: ParsedPostLabels[] = [];
  for (const raw of json as RawPostLabelEntry[]) {
    if (!raw.fbid) continue;

    let caption: string | null = null;
    // "Marqué comme généré par l'IA" observé en double dans le même
    // label_values (Vrai puis Faux sur le même post, cause exacte non
    // identifiée). Choix explicite, documenté ici : true dès qu'AU MOINS
    // une occurrence dit Vrai — un find() sur la première occurrence
    // masquerait potentiellement un vrai signal de contenu généré par IA.
    let isAiGenerated: boolean | null = null;
    let isAd: boolean | null = null;
    let isBrandedContent: boolean | null = null;
    let isPublishedFlag: boolean | null = null;
    let isDraftFlag: boolean | null = null;
    let storyType: string | null = null;
    let publishMode: string | null = null;
    let hashtagsRaw: string | null = null;
    let location: string | null = null;
    let brandPartner: string | null = null;
    const extra: Record<string, string> = {};

    for (const entry of raw.label_values ?? []) {
      if (entry.media) continue; // EXIF (§9.1) — jamais lu, cf. en-tête
      if (!entry.label) continue;

      const label = normalizeKey(fixMojibake(entry.label));
      const value = entry.value !== undefined ? fixMojibake(entry.value) : undefined;

      switch (label) {
        case "legende":
          if (value) caption = value;
          continue;
        case "marque comme genere par lia": {
          const b = toBool(value);
          if (b === true) isAiGenerated = true;
          else if (b === false && isAiGenerated !== true) isAiGenerated = false;
          continue;
        }
        case "est une publicite":
          isAd = toBool(value);
          continue;
        case "collaboration commerciale":
          isBrandedContent = toBool(value);
          continue;
        case "publie":
          isPublishedFlag = toBool(value);
          continue;
        case "brouillon":
          isDraftFlag = toBool(value);
          continue;
        case "type de story":
          if (value) storyType = value;
          continue;
        case "mode de publication":
          if (value) publishMode = value;
          continue;
        case "hashtags":
          if (value) hashtagsRaw = value;
          continue;
        case "lieu":
          if (value) location = value;
          continue;
        case "partenaire de marque":
          if (value) brandPartner = value;
          continue;
        default:
          if (value !== undefined) extra[entry.label] = value;
      }
    }

    const isPublished = isPublishedFlag ?? (isDraftFlag === null ? null : !isDraftFlag);
    const hashtags = hashtagsRaw
      ? hashtagsRaw
          .split(/[,\s]+/)
          .map((h) => h.replace(/^#/, "").trim())
          .filter(Boolean)
      : null;

    out.push({
      mediaKey: raw.fbid,
      caption,
      isAiGenerated,
      isAd,
      isBrandedContent,
      isPublished,
      storyType,
      publishMode,
      hashtags: hashtags && hashtags.length > 0 ? hashtags : null,
      location,
      brandPartner,
      extraLabels: Object.keys(extra).length > 0 ? extra : null,
    });
  }
  return out;
}
