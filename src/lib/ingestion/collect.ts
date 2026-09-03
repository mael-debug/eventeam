// Lecteur commun aux deux sources d'import (ZIP et dossier décompressé) :
// à partir d'un couple (chemin, contenu déjà en mémoire), décide d'ignorer
// le fichier, de le parser en JSON ou de le garder en binaire (§5.4). Une
// seule implémentation de la liste blanche, du décodage UTF-8 et du
// try/catch sur JSON.parse — scan-zip.ts et scan-folder.ts s'appuient tous
// les deux dessus plutôt que de dupliquer cette logique.

import { classifyPath, type WhitelistEntry } from "./whitelist";

export interface InventoryEntry {
  path: string;
  category: WhitelistEntry["category"] | null;
  label: string | null;
  willIngest: boolean;
}

export interface ExtractedJsonFile {
  path: string;
  category: Exclude<WhitelistEntry["category"], "media">;
  json: unknown;
  bytes: number;
}

export interface ExtractedMediaFile {
  path: string;
  bytes: Uint8Array;
  mimeType: string;
}

export interface ScanResult {
  inventory: InventoryEntry[];
  jsonFiles: ExtractedJsonFile[];
  mediaFiles: ExtractedMediaFile[];
}

export interface Collector {
  offer(path: string, bytes: Uint8Array): void;
  result(): ScanResult;
}

function mimeFromPath(path: string): string {
  if (/\.png$/i.test(path)) return "image/png";
  if (/\.mp4$/i.test(path)) return "video/mp4";
  return "image/jpeg";
}

// Rend la main au navigateur — sur plusieurs milliers de fichiers, boucler
// sans pause bloque le rendu et une barre de progression ne se repeint
// jamais (aucun rendu React ne passe sans rendre la main).
export function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** Fusionne plusieurs sources (un ZIP, un dossier, ou plusieurs de chaque —
 * §4, cas "part 1" + "part 2" de Meta) dans un seul résultat. Sur collision
 * de chemin identique entre deux sources, la première occurrence est
 * conservée et la suivante journalisée plutôt qu'écrasée silencieusement. */
export function createCollector(onProgress?: (n: number) => void): Collector {
  const inventory: InventoryEntry[] = [];
  const jsonFiles: ExtractedJsonFile[] = [];
  const mediaFiles: ExtractedMediaFile[] = [];
  const seenPaths = new Set<string>();
  let processed = 0;

  function offer(path: string, bytes: Uint8Array) {
    processed++;
    onProgress?.(processed);

    if (seenPaths.has(path)) {
      console.warn(`[import] chemin en double entre plusieurs sources, première occurrence conservée : ${path}`);
      return;
    }
    seenPaths.add(path);

    const match = classifyPath(path);
    inventory.push({
      path,
      category: match?.category ?? null,
      label: match?.label ?? null,
      willIngest: match !== null,
    });
    if (!match) return; // hors liste blanche : jamais parsé, jamais retenu (§5.4, §9.1)

    if (match.category === "media") {
      mediaFiles.push({ path, bytes, mimeType: mimeFromPath(path) });
      return;
    }
    try {
      const text = new TextDecoder("utf-8").decode(bytes);
      jsonFiles.push({ path, category: match.category, json: JSON.parse(text), bytes: bytes.length });
    } catch {
      // JSON illisible : ignoré sans bloquer le reste de l'import (§7.2 étape 3).
    }
  }

  function result(): ScanResult {
    return { inventory, jsonFiles, mediaFiles };
  }

  return { offer, result };
}
