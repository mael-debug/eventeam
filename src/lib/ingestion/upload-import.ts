// PRD §7.1 étapes 7-9 — création de l'import, upload vers Storage,
// passage en 'uploaded' (déclenche l'Edge Function process-import).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { ScanResult } from "./scan-zip";
import { makeThumbnail } from "./thumbnail";

export interface UploadProgress {
  phase: "creating" | "uploading" | "invoking" | "done" | "error";
  uploaded: number;
  total: number;
  message?: string;
}

export interface UploadImportResult {
  importId: string;
  functionResult: unknown;
}

function sanitizeSegment(path: string): string {
  return path.replace(/[^a-zA-Z0-9._/-]/g, "_");
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
  async function recordFile(row: Database["public"]["Tables"]["import_files"]["Insert"]) {
    const { error } = await supabase.from("import_files").insert(row);
    if (error) throw new Error(`Enregistrement de ${row.source_path} : ${error.message}`);
  }

  for (const f of scan.jsonFiles) {
    const objectPath = `${accountId}/${importId}/${sanitizeSegment(f.path)}`;
    const blob = new Blob([JSON.stringify(f.json)], { type: "application/json" });
    const { error } = await supabase.storage.from("raw-exports").upload(objectPath, blob, {
      contentType: "application/json",
      upsert: true,
    });
    await recordFile({
      import_id: importId,
      source_path: f.path,
      category: f.category,
      storage_path: error ? null : `raw-exports/${objectPath}`,
      bytes: f.bytes,
      status: error ? "error" : "uploaded",
      error_message: error?.message ?? null,
    });
    uploaded++;
    onProgress?.({ phase: "uploading", uploaded, total: totalFiles, message: f.path });
  }

  for (const m of scan.mediaFiles) {
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
    await recordFile({
      import_id: importId,
      source_path: m.path,
      category: "media",
      storage_path: thumbPath,
      bytes: m.bytes.length,
      status: thumbPath ? "uploaded" : "error",
      error_message: errorMessage,
    });
    uploaded++;
    onProgress?.({ phase: "uploading", uploaded, total: totalFiles, message: m.path });
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
