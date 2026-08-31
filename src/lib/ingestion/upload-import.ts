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
  const importFileRows: Database["public"]["Tables"]["import_files"]["Insert"][] = [];

  for (const f of scan.jsonFiles) {
    const objectPath = `${accountId}/${importId}/${sanitizeSegment(f.path)}`;
    const blob = new Blob([JSON.stringify(f.json)], { type: "application/json" });
    const { error } = await supabase.storage.from("raw-exports").upload(objectPath, blob, {
      contentType: "application/json",
      upsert: true,
    });
    importFileRows.push({
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
    importFileRows.push({
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

  if (importFileRows.length > 0) {
    const { error } = await supabase.from("import_files").insert(importFileRows);
    if (error) throw new Error(`Enregistrement des fichiers : ${error.message}`);
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
