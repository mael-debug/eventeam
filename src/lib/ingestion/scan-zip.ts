// PRD §5.2, §7.1 étapes 1-6 — décompression en flux (fflate), sans jamais
// charger le ZIP entier en mémoire. Seuls les fichiers de la liste blanche
// (§5.4) sont décompressés et conservés ; tout le reste est ignoré au
// niveau de l'entrée elle-même (jamais décompressé).

import { Unzip, UnzipInflate, type UnzipFile } from "fflate";
import { classifyPath } from "./whitelist";
import { createCollector, yieldToBrowser, type Collector } from "./collect";

export type { ScanResult, InventoryEntry, ExtractedJsonFile, ExtractedMediaFile, Collector } from "./collect";

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

/** Décompresse le ZIP en flux et alimente le collecteur (partagé si fourni,
 * pour fusionner plusieurs sources en un seul import — §4). Seuls les
 * fichiers de la liste blanche sont réellement décompressés en mémoire ;
 * pour les autres, le collecteur est nourri directement sans décompression
 * afin d'obtenir malgré tout une ligne d'inventaire honnête (§5.4, §9.1). */
export async function scanExportZip(
  file: File,
  onProgress?: (processedEntries: number) => void,
  collector: Collector = createCollector(onProgress),
) {
  const unzipper = new Unzip();
  unzipper.register(UnzipInflate);

  unzipper.onfile = (entry: UnzipFile) => {
    if (entry.name.endsWith("/")) return;

    const match = classifyPath(entry.name);
    if (!match) {
      collector.offer(entry.name, new Uint8Array(0)); // hors liste blanche : jamais décompressé
      return;
    }

    const chunks: Uint8Array[] = [];
    entry.ondata = (err, data, final) => {
      if (err) return;
      chunks.push(data);
      if (!final) return;
      collector.offer(entry.name, concat(chunks));
    };
    entry.start();
  };

  // Lecture en petits paquets fixes (pas file.stream().getReader(), dont la
  // taille de chunk échappe à notre contrôle) avec une pause explicite après
  // chaque unzipper.push() : sur une archive de plusieurs milliers d'entrées
  // (ex. 4936 ici), fflate peut décompresser et émettre onfile/ondata pour
  // des centaines de fichiers en une seule fois si beaucoup tiennent dans un
  // même paquet — un bloc JS synchrone assez long pour déclencher « Page ne
  // répondant pas » côté navigateur, et empêcher scanProgress de jamais se
  // repeindre à l'écran (aucun rendu React ne passe sans rendre la main).
  const CHUNK_SIZE = 512 * 1024;

  let offset = 0;
  do {
    const slice = file.slice(offset, offset + CHUNK_SIZE);
    const chunk = new Uint8Array(await slice.arrayBuffer());
    offset += chunk.length;
    unzipper.push(chunk, offset >= file.size);
    await yieldToBrowser();
  } while (offset < file.size);

  return collector.result();
}
