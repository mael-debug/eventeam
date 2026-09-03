// Deuxième source d'import possible en plus du ZIP : un dossier déjà
// décompressé (sélection via <input webkitdirectory> ou glisser-déposer).
// Même contrat de sortie que scan-zip.ts, via le même collecteur partagé.

import { classifyPath } from "./whitelist";
import { createCollector, yieldToBrowser, type Collector } from "./collect";

const YIELD_EVERY = 50;

/** Parcourt une sélection de fichiers issue d'un dossier et alimente le
 * collecteur. Le chemin classifié est webkitRelativePath (chemin relatif au
 * dossier choisi), pas file.name — sinon toute la hiérarchie de dossiers
 * (connections/, your_instagram_activity/, etc.) serait perdue et plus
 * aucun fichier ne matcherait la liste blanche.
 *
 * classifyPath() est vérifié AVANT tout file.arrayBuffer() : lire un
 * fichier hors liste blanche en mémoire pour rien violerait §9.1. */
export async function scanExportFolder(
  files: File[],
  onProgress?: (processedEntries: number) => void,
  collector: Collector = createCollector(onProgress),
) {
  let i = 0;
  for (const file of files) {
    const path = file.webkitRelativePath || file.name;

    if (classifyPath(path)) {
      collector.offer(path, new Uint8Array(await file.arrayBuffer()));
    } else {
      collector.offer(path, new Uint8Array(0)); // hors liste blanche : jamais lu en mémoire
    }

    i++;
    if (i % YIELD_EVERY === 0) await yieldToBrowser();
  }

  return collector.result();
}
