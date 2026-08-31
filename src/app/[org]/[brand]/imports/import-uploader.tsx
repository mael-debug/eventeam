"use client";

import { useCallback, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { scanExportZip, type ScanResult } from "@/lib/ingestion/scan-zip";
import { uploadImport, type UploadProgress } from "@/lib/ingestion/upload-import";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Step = "idle" | "scanning" | "reviewing" | "uploading" | "done" | "error";

const CATEGORY_LABEL: Record<string, string> = {
  followers: "Abonnés",
  following: "Comptes suivis",
  insights: "Insights",
  content: "Contenu (Lot 5)",
  chat: "Conversations (Lot 5)",
  media: "Vignettes",
};

export function ImportUploader({ accountId, accountHandle }: { accountId: string; accountHandle: string }) {
  const [step, setStep] = useState<Step>("idle");
  const [scanProgress, setScanProgress] = useState(0);
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setStep("scanning");
    setScanProgress(0);
    try {
      const result = await scanExportZip(file, (n) => setScanProgress(n));
      setScan(result);
      setStep("reviewing");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStep("error");
    }
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!scan) return;
    setStep("uploading");
    setError(null);
    try {
      const supabase = createClient();
      const result = await uploadImport(supabase, accountId, scan, setUploadProgress);
      const fr = result.functionResult as { followers?: number; following?: number } | null;
      setSummary(
        fr
          ? `${fr.followers ?? 0} abonnés et ${fr.following ?? 0} comptes suivis importés.`
          : "Import terminé.",
      );
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStep("error");
    }
  }, [scan, accountId]);

  const reset = () => {
    setStep("idle");
    setScan(null);
    setUploadProgress(null);
    setError(null);
    setSummary(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const ignored = scan?.inventory.filter((e) => !e.willIngest) ?? [];
  const included = scan?.inventory.filter((e) => e.willIngest) ?? [];

  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium">@{accountHandle}</span>
        {step !== "idle" && (
          <Button variant="ghost" size="sm" onClick={reset}>
            Recommencer
          </Button>
        )}
      </div>

      {step === "idle" && (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-neutral-300 py-8 text-sm text-neutral-500 hover:border-neutral-400">
          Déposer le ZIP d&apos;export Instagram ici
          <input
            ref={inputRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </label>
      )}

      {step === "scanning" && (
        <p className="text-sm text-neutral-500">Analyse de l&apos;archive… {scanProgress} fichiers examinés.</p>
      )}

      {step === "reviewing" && scan && (
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            <strong>{included.length}</strong> fichier(s) seront importés,{" "}
            <strong>{ignored.length}</strong> ignorés (hors liste blanche).
          </p>
          <div className="max-h-48 overflow-auto rounded-md border border-neutral-100 text-xs">
            {scan.inventory.map((e, i) => (
              <div key={i} className="flex items-center justify-between border-b border-neutral-50 px-2 py-1 last:border-0">
                <span className="truncate">{e.path}</span>
                {e.willIngest ? (
                  <Badge variant="success" className="ml-2 shrink-0">
                    {CATEGORY_LABEL[e.category!] ?? e.category}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="ml-2 shrink-0 text-neutral-400">
                    ignoré
                  </Badge>
                )}
              </div>
            ))}
          </div>
          {!scan.jsonFiles.some((f) => f.category === "followers") && (
            <p className="text-sm text-amber-700">
              Aucun fichier d&apos;abonnés détecté — vérifiez que l&apos;export contient bien
              connections/followers_and_following.
            </p>
          )}
          <Button onClick={handleConfirm}>Importer {included.length} fichier(s)</Button>
        </div>
      )}

      {step === "uploading" && uploadProgress && (
        <p className="text-sm text-neutral-500">
          {uploadProgress.phase === "invoking"
            ? "Traitement en cours…"
            : `Envoi… ${uploadProgress.uploaded}/${uploadProgress.total}`}
        </p>
      )}

      {step === "done" && (
        <p className="text-sm text-emerald-700">{summary}</p>
      )}

      {step === "error" && <p className="text-sm text-red-600">Erreur : {error}</p>}
    </div>
  );
}
