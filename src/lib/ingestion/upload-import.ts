// PRD §7.1 étapes 7-9 — création de l'import, upload vers Storage,
// passage en 'uploaded' (déclenche l'Edge Function process-import).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { ScanResult } from "./scan-zip";
import { makeThumbnail } from "./thumbnail";

export interface UploadProgress {
  phase: "creating" | "uploading" | "retrying" | "invoking" | "done" | "error";
  uploaded: number;
  total: number;
  message?: string;
}

const MAX_RETRY_PASSES = 3;

export interface UploadImportResult {
  importId: string;
  functionResult: unknown;
}

function sanitizeSegment(path: string): string {
  return path.replace(/[^a-zA-Z0-9._/-]/g, "_");
}

// upsert sur (import_id, source_path) — clé unique de la table (0006) — pour
// qu'une nouvelle tentative réécrive la même ligne au lieu d'en créer une
// seconde.
async function recordFile(supabase: SupabaseClient<Database>, row: Database["public"]["Tables"]["import_files"]["Insert"]) {
  const { error } = await supabase.from("import_files").upsert(row, { onConflict: "import_id,source_path" });
  if (error) throw new Error(`Enregistrement de ${row.source_path} : ${error.message}`);
}

async function uploadOneJsonFile(
  supabase: SupabaseClient<Database>,
  accountId: string,
  importId: string,
  f: ScanResult["jsonFiles"][number],
): Promise<boolean> {
  const objectPath = `${accountId}/${importId}/${sanitizeSegment(f.path)}`;
  const blob = new Blob([JSON.stringify(f.json)], { type: "application/json" });
  const { error } = await supabase.storage.from("raw-exports").upload(objectPath, blob, {
    contentType: "application/json",
    upsert: true,
  });
  await recordFile(supabase, {
    import_id: importId,
    source_path: f.path,
    category: f.category,
    storage_path: error ? null : `raw-exports/${objectPath}`,
    bytes: f.bytes,
    status: error ? "error" : "uploaded",
    error_message: error?.message ?? null,
  });
  return !error;
}

async function uploadOneMediaFile(
  supabase: SupabaseClient<Database>,
  accountId: string,
  importId: string,
  m: ScanResult["mediaFiles"][number],
): Promise<boolean> {
  let thumbPath: string | null = null;
  let errorMessage: string | null = null;
  try {
    const thumb = await makeThumbnail(m.bytes, m.mimeType);
    const objectPath = `${accountId}/${sanitizeSegment(m.path).replace(/\.(jpg|jpeg|png)$/i, "")}.jpg`;
    const { error } = await supabase.storage.from("media-thumbs").upload(objectPath, thumb, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (error) throw error;
    thumbPath = `media-thumbs/${objectPath}`;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
  }
  await recordFile(supabase, {
    import_id: importId,
    source_path: m.path,
    category: "media",
    storage_path: thumbPath,
    bytes: m.bytes.length,
    status: thumbPath ? "uploaded" : "error",
    error_message: errorMessage,
  });
  return thumbPath !== null;
}

export async function uploadImport(
  supabase: SupabaseClient<Database>,
  accountId: string,
  scan: ScanResult,
  onProgress?: (p: UploadProgress) => void,
): Promise<UploadImportResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentification requise");

  const importId = crypto.randomUUID();
  const storagePrefix = `raw-exports/${accountId}/${importId}`;
  const totalFiles = scan.jsonFiles.length + scan.mediaFiles.length;

  onProgress?.({ phase: "creating", uploaded: 0, total: totalFiles });

  const { error: insertError } = await supabase.from("imports").insert({
    id: importId,
    account_id: accountId,
    uploaded_by: user.id,
    status: "uploading",
    exported_at: new Date().toISOString(),
    files_expected: totalFiles,
    parser_version: "2026-lot2.1",
    storage_prefix: storagePrefix,
  });
  if (insertError) throw new Error(`Création de l'import : ${insertError.message}`);

  let uploaded = 0;

  // Un enregistrement import_files par fichier, immédiatement après son
  // envoi — pas un insert groupé en fin de boucle. Si la page est quittée
  // en cours d'envoi (onglet fermé, navigation), les fichiers déjà envoyés
  // restent visibles dans l'historique au lieu de disparaître sans trace
  // (l'insert groupé perdait tout le lot si la boucle n'allait pas à son
  // terme, laissant un import 'uploading' sans aucun fichier enregistré).
  let failedJson = new Map(scan.jsonFiles.map((f) => [f.path, f]));
  let failedMedia = new Map(scan.mediaFiles.map((m) => [m.path, m]));

  for (const [path, f] of failedJson) {
    const ok = await uploadOneJsonFile(supabase, accountId, importId, f);
    uploaded++;
    onProgress?.({ phase: "uploading", uploaded, total: totalFiles, message: path });
    if (ok) failedJson.delete(path);
  }

  for (const [path, m] of failedMedia) {
    const ok = await uploadOneMediaFile(supabase, accountId, importId, m);
    uploaded++;
    onProgress?.({ phase: "uploading", uploaded, total: totalFiles, message: path });
    if (ok) failedMedia.delete(path);
  }

  // Nouvelles tentatives bornées avant de considérer l'import terminé — un
  // échec transitoire (comme la politique RLS manquante trouvée cette
  // session) ne doit pas se figer en échec définitif si le fichier peut
  // réussir dès le passage suivant.
  for (let pass = 1; pass <= MAX_RETRY_PASSES && (failedJson.size > 0 || failedMedia.size > 0); pass++) {
    const remaining = failedJson.size + failedMedia.size;
    onProgress?.({ phase: "retrying", uploaded: totalFiles - remaining, total: totalFiles, message: `passe ${pass}/${MAX_RETRY_PASSES} — ${remaining} fichier(s)` });

    const retryJson = failedJson;
    failedJson = new Map();
    for (const [path, f] of retryJson) {
      const ok = await uploadOneJsonFile(supabase, accountId, importId, f);
      if (!ok) failedJson.set(path, f);
    }

    const retryMedia = failedMedia;
    failedMedia = new Map();
    for (const [path, m] of retryMedia) {
      const ok = await uploadOneMediaFile(supabase, accountId, importId, m);
      if (!ok) failedMedia.set(path, m);
    }
  }

  const { error: statusError } = await supabase
    .from("imports")
    .update({ status: "uploaded" })
    .eq("id", importId);
  if (statusError) throw new Error(`Passage en statut uploaded : ${statusError.message}`);

  onProgress?.({ phase: "invoking", uploaded: totalFiles, total: totalFiles });

  const { data: functionResult, error: fnError } = await supabase.functions.invoke("process-import", {
    body: { import_id: importId },
  });
  if (fnError) throw new Error(`Traitement de l'import : ${fnError.message}`);

  onProgress?.({ phase: "done", uploaded: totalFiles, total: totalFiles });

  return { importId, functionResult };
}

export interface RetryFailedResult {
  fixed: number;
  stillFailing: string[];
  reprocessed: boolean;
}

// Reprend un import déjà traité (au moins une fois par uploadImport) sans
// tout renvoyer : seuls les fichiers encore au statut 'error' dans
// import_files sont ré-uploadés, à partir du même ZIP redéposé (les octets
// originaux n'existent nulle part côté serveur — process-import ne
// conserve jamais les médias hors liste blanche, §5.4/§9.1 — redéposer le
// ZIP est donc la seule source possible). Les chemins réussis sont
// simplement ignorés, jamais retouchés.
export async function retryFailedImportFiles(
  supabase: SupabaseClient<Database>,
  accountId: string,
  importId: string,
  scan: ScanResult,
  onProgress?: (p: UploadProgress) => void,
): Promise<RetryFailedResult> {
  const { data: errorRows, error: fetchError } = await supabase
    .from("import_files")
    .select("source_path, category")
    .eq("import_id", importId)
    .eq("status", "error");
  if (fetchError) throw new Error(`Lecture des fichiers en échec : ${fetchError.message}`);

  const failedPaths = new Set((errorRows ?? []).map((r) => r.source_path));
  let failedJson = new Map(scan.jsonFiles.filter((f) => failedPaths.has(f.path)).map((f) => [f.path, f]));
  let failedMedia = new Map(scan.mediaFiles.filter((m) => failedPaths.has(m.path)).map((m) => [m.path, m]));
  const totalToRetry = failedJson.size + failedMedia.size;
  const fixedNonMediaPaths = new Set<string>();
  let uploaded = 0;

  for (let pass = 1; pass <= MAX_RETRY_PASSES && failedJson.size + failedMedia.size > 0; pass++) {
    const retryJson = failedJson;
    failedJson = new Map();
    for (const [path, f] of retryJson) {
      const ok = await uploadOneJsonFile(supabase, accountId, importId, f);
      uploaded++;
      onProgress?.({ phase: "retrying", uploaded, total: totalToRetry, message: `passe ${pass}/${MAX_RETRY_PASSES} — ${path}` });
      if (ok) fixedNonMediaPaths.add(path);
      else failedJson.set(path, f);
    }

    const retryMedia = failedMedia;
    failedMedia = new Map();
    for (const [path, m] of retryMedia) {
      const ok = await uploadOneMediaFile(supabase, accountId, importId, m);
      uploaded++;
      onProgress?.({ phase: "retrying", uploaded, total: totalToRetry, message: `passe ${pass}/${MAX_RETRY_PASSES} — ${path}` });
      if (!ok) failedMedia.set(path, m);
    }
  }

  const stillFailing = [...failedJson.keys(), ...failedMedia.keys()];
  let reprocessed = false;

  // Les vignettes ne passent jamais par process-import (elles ne sont pas
  // dans sa liste blanche de catégories) : les corriger n'a jamais besoin
  // de relancer le moteur. Un fichier de données (followers/following/
  // insights/content/chat) corrigé, en revanche, n'a encore jamais été
  // ingéré — sans quoi ses lignes restent absentes des tables de calcul.
  if (fixedNonMediaPaths.size > 0) {
    onProgress?.({ phase: "invoking", uploaded: totalToRetry, total: totalToRetry });
    const { error: fnError } = await supabase.functions.invoke("process-import", { body: { import_id: importId } });
    if (fnError) throw new Error(`Traitement de l'import : ${fnError.message}`);
    reprocessed = true;
  }

  onProgress?.({ phase: "done", uploaded: totalToRetry, total: totalToRetry });

  return { fixed: totalToRetry - stillFailing.length, stillFailing, reprocessed };
}

export interface ImportOutcome {
  status: string;
  errorMessage: string | null;
  files: { path: string; category: string; status: string; errorMessage: string | null; rowsIngested: number | null }[];
}

// Lu après le retour de la Function : process-import ne fait jamais échouer
// l'ensemble d'un import pour l'erreur d'un seul fichier (withFileTracking,
// §7.2 étape 3) — le succès/échec par fichier ne peut donc se lire qu'ici,
// dans import_files, jamais dans le seul statut de l'import.
export async function fetchImportOutcome(supabase: SupabaseClient<Database>, importId: string): Promise<ImportOutcome> {
  const [{ data: importRow }, { data: fileRows }] = await Promise.all([
    supabase.from("imports").select("status, error_message").eq("id", importId).single(),
    supabase.from("import_files").select("source_path, category, status, error_message, rows_ingested").eq("import_id", importId),
  ]);
  return {
    status: importRow?.status ?? "failed",
    errorMessage: importRow?.error_message ?? null,
    files: (fileRows ?? []).map((f) => ({
      path: f.source_path,
      category: f.category,
      status: f.status,
      errorMessage: f.error_message,
      rowsIngested: f.rows_ingested,
    })),
  };
}
