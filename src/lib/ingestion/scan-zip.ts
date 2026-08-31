// PRD §5.2, §7.1 étapes 1-6 — décompression en flux (fflate), sans jamais
// charger le ZIP entier en mémoire. Seuls les fichiers de la liste blanche
// (§5.4) sont décompressés et conservés ; tout le reste est ignoré au
// niveau de l'entrée elle-même (jamais décompressé).

import { Unzip, UnzipInflate, type UnzipFile } from "fflate";
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

function mimeFromPath(path: string): string {
  return /\.png$/i.test(path) ? "image/png" : "image/jpeg";
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

/** Décompresse le ZIP en flux et construit l'inventaire complet — ce qui
 * sera traité, ce qui sera ignoré, avec le motif (§7.1 étape 3). Seuls les
 * fichiers de la liste blanche sont réellement décompressés en mémoire. */
export async function scanExportZip(
  file: File,
  onProgress?: (processedEntries: number) => void,
): Promise<ScanResult> {
  const inventory: InventoryEntry[] = [];
  const jsonFiles: ExtractedJsonFile[] = [];
  const mediaFiles: ExtractedMediaFile[] = [];
  let processed = 0;

  const unzipper = new Unzip();
  unzipper.register(UnzipInflate);

  unzipper.onfile = (entry: UnzipFile) => {
    processed++;
    onProgress?.(processed);

    if (entry.name.endsWith("/")) return;

    const match = classifyPath(entry.name);
    inventory.push({
      path: entry.name,
      category: match?.category ?? null,
      label: match?.label ?? null,
      willIngest: match !== null,
    });

    if (!match) return; // hors liste blanche : jamais décompressé (§5.4, §9.1)

    const chunks: Uint8Array[] = [];
    entry.ondata = (err, data, final) => {
      if (err) return;
      chunks.push(data);
      if (!final) return;

      const full = concat(chunks);
      if (match.category === "media") {
        mediaFiles.push({ path: entry.name, bytes: full, mimeType: mimeFromPath(entry.name) });
        return;
      }
      try {
        const text = new TextDecoder("utf-8").decode(full);
        jsonFiles.push({
          path: entry.name,
          category: match.category,
          json: JSON.parse(text),
          bytes: full.length,
        });
      } catch {
        // JSON illisible : ignoré sans bloquer le reste de l'import (§7.2 étape 3).
      }
    };
    entry.start();
  };

  const reader = file.stream().getReader();
  for (;;) {
    const { done, value } = await reader.read();
    unzipper.push(value ?? new Uint8Array(0), done);
    if (done) break;
  }

  return { inventory, jsonFiles, mediaFiles };
}
