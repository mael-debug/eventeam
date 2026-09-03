// Convertit un glisser-déposer (DataTransferItemList) en sources
// exploitables par scanExportZip/scanExportFolder — un dossier n'apparaît
// jamais dans e.dataTransfer.files, il faut passer par
// DataTransferItem.webkitGetAsEntry() et marcher l'arborescence à la main.

export type DroppedSource = { kind: "zip"; file: File } | { kind: "folder"; files: File[] };

interface FileSystemEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  fullPath: string;
}
interface FileSystemFileEntry extends FileSystemEntry {
  file(cb: (file: File) => void, errCb?: (err: DOMException) => void): void;
}
interface FileSystemDirectoryEntry extends FileSystemEntry {
  createReader(): FileSystemDirectoryReader;
}
interface FileSystemDirectoryReader {
  readEntries(cb: (entries: FileSystemEntry[]) => void, errCb?: (err: DOMException) => void): void;
}

// readEntries() ne renvoie qu'un lot partiel par appel (une centaine
// d'entrées selon le navigateur) — boucler jusqu'à un tableau vide, sans
// quoi un gros dossier est silencieusement tronqué.
function readAllEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const all: FileSystemEntry[] = [];
    function readBatch() {
      reader.readEntries((batch) => {
        if (batch.length === 0) {
          resolve(all);
          return;
        }
        all.push(...batch);
        readBatch();
      }, reject);
    }
    readBatch();
  });
}

function readFile(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => entry.file(resolve, reject));
}

// webkitRelativePath n'est peuplé nativement que par <input webkitdirectory>
// — jamais par un File obtenu via un drop — alors que scanExportFolder s'en
// sert pour retrouver le chemin complet dans l'export (connections/...,
// your_instagram_activity/...). C'est un getter en lecture seule sur un
// vrai File, d'où defineProperty plutôt qu'une affectation directe.
function withRelativePath(file: File, path: string): File {
  Object.defineProperty(file, "webkitRelativePath", { value: path, configurable: true });
  return file;
}

async function walkDirectory(entry: FileSystemDirectoryEntry, out: File[]): Promise<void> {
  const children = await readAllEntries(entry.createReader());
  for (const child of children) {
    if (child.isDirectory) {
      await walkDirectory(child as FileSystemDirectoryEntry, out);
    } else {
      const file = await readFile(child as FileSystemFileEntry);
      // fullPath commence par "/" et inclut déjà le nom du dossier racine
      // déposé — cohérent avec webkitRelativePath natif d'un <input
      // webkitdirectory>, qui inclut lui aussi ce même dossier racine.
      out.push(withRelativePath(file, child.fullPath.replace(/^\//, "")));
    }
  }
}

/** Un item dont le nom finit en .zip devient une source "zip" (passée telle
 * quelle à scanExportZip) ; un dossier devient une source "folder" (tous
 * ses fichiers, chemins relatifs reconstruits, prêts pour
 * scanExportFolder). Un mix zip + dossier(s) dans le même drop est géré. */
export async function readDroppedSources(items: DataTransferItemList): Promise<DroppedSource[]> {
  const entries: FileSystemEntry[] = [];
  for (let i = 0; i < items.length; i++) {
    const entry = (items[i] as DataTransferItem & { webkitGetAsEntry?(): FileSystemEntry | null }).webkitGetAsEntry?.();
    if (entry) entries.push(entry);
  }

  const sources: DroppedSource[] = [];
  for (const entry of entries) {
    if (entry.isFile) {
      const file = await readFile(entry as FileSystemFileEntry);
      if (/\.zip$/i.test(entry.name)) {
        sources.push({ kind: "zip", file });
      } else {
        sources.push({ kind: "folder", files: [withRelativePath(file, entry.fullPath.replace(/^\//, ""))] });
      }
    } else if (entry.isDirectory) {
      const files: File[] = [];
      await walkDirectory(entry as FileSystemDirectoryEntry, files);
      sources.push({ kind: "folder", files });
    }
  }
  return sources;
}
