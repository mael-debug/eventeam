"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { scanExportZip } from "@/lib/ingestion/scan-zip";
import { scanExportFolder } from "@/lib/ingestion/scan-folder";
import { createCollector, type ScanResult } from "@/lib/ingestion/collect";
import { readDroppedSources, type DroppedSource } from "@/lib/ingestion/read-dropped-entries";
import { uploadImport, fetchImportOutcome, type UploadProgress, type ImportOutcome } from "@/lib/ingestion/upload-import";
import { Button, Badge, Card } from "@/components/ds";

// webkitdirectory n'est pas dans les types React par défaut — augmentation
// plutôt qu'un `as any` sur l'élément.
declare module "react" {
  interface InputHTMLAttributes<T> {
    webkitdirectory?: string;
  }
}

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
  const [outcome, setOutcome] = useState<ImportOutcome | null>(null);
  const [followerCounts, setFollowerCounts] = useState<{ followers: number; following: number } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Point d'entrée unique : un ZIP, un dossier, ou un mélange des deux (drop
  // multiple) alimentent tous le même collecteur — un seul ScanResult, donc
  // un seul import, quelle que soit la façon dont les sources arrivent.
  const handleSources = useCallback(async (sources: DroppedSource[]) => {
    if (sources.length === 0) return;
    setError(null);
    setStep("scanning");
    setScanProgress(0);
    try {
      const collector = createCollector((n) => setScanProgress(n));
      for (const source of sources) {
        if (source.kind === "zip") {
          await scanExportZip(source.file, undefined, collector);
        } else {
          await scanExportFolder(source.files, undefined, collector);
        }
      }
      setScan(collector.result());
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
      setFollowerCounts({ followers: fr?.followers ?? 0, following: fr?.following ?? 0 });
      setOutcome(await fetchImportOutcome(supabase, result.importId));
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
    setOutcome(null);
    setFollowerCounts(null);
    if (zipInputRef.current) zipInputRef.current.value = "";
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  const handleDrop = useCallback(
    async (e: DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      setDragActive(false);
      // Un dossier n'apparaît jamais dans e.dataTransfer.files — seul
      // items[].webkitGetAsEntry() permet de le détecter et de le marcher.
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        const sources = await readDroppedSources(e.dataTransfer.items);
        void handleSources(sources);
        return;
      }
      const files = Array.from(e.dataTransfer.files ?? []);
      void handleSources(files.map((file) => ({ kind: "zip" as const, file })));
    },
    [handleSources],
  );

  const ignored = scan?.inventory.filter((e) => !e.willIngest) ?? [];
  const included = scan?.inventory.filter((e) => e.willIngest) ?? [];

  const jsonOutcomeFiles = outcome?.files.filter((f) => f.category !== "media") ?? [];
  const failedFiles = jsonOutcomeFiles.filter((f) => f.status === "error");
  const importFailed = outcome?.status === "failed";
  const partialFailure = !importFailed && failedFiles.length > 0;

  return (
    <Card variant="claire" interactive={false}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>@{accountHandle}</span>
          {step !== "idle" && (
            <Button variant="lien" size="sm" onClick={reset}>
              Recommencer
            </Button>
          )}
        </div>

        {step === "idle" && (
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            style={{
              display: "flex",
              cursor: "pointer",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              borderRadius: 12,
              border: `2px dashed ${dragActive ? "var(--bleu)" : "var(--bordure)"}`,
              background: dragActive ? "var(--bleu-bg)" : "transparent",
              padding: "32px 16px",
              fontSize: 14,
              color: "var(--text-muted)",
              textAlign: "center",
            }}
          >
            <span>Déposer un ou plusieurs ZIP, ou un dossier déjà décompressé, de l&apos;export Instagram</span>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              <Button
                variant="secondaire"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  zipInputRef.current?.click();
                }}
              >
                Choisir un ou des ZIP
              </Button>
              <Button
                variant="secondaire"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  folderInputRef.current?.click();
                }}
              >
                Choisir un dossier
              </Button>
            </div>
            <input
              ref={zipInputRef}
              type="file"
              accept=".zip"
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                void handleSources(files.map((file) => ({ kind: "zip" as const, file })));
              }}
            />
            <input
              ref={folderInputRef}
              type="file"
              webkitdirectory=""
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length > 0) void handleSources([{ kind: "folder", files }]);
              }}
            />
          </label>
        )}

        {step === "scanning" && (
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Analyse en cours… {scanProgress} fichiers examinés.</p>
        )}

        {step === "reviewing" && scan && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 14 }}>
              <strong>{included.length}</strong> fichier(s) seront importés, <strong>{ignored.length}</strong> ignorés (hors liste
              blanche) — inventaire avant tout traitement.
            </p>
            <div style={{ maxHeight: 192, overflow: "auto", borderRadius: 10, border: "1px solid var(--bordure-carte)", fontSize: 12 }}>
              {scan.inventory.map((e, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: i < scan.inventory.length - 1 ? "1px solid var(--bordure-carte)" : "none",
                    padding: "6px 10px",
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.path}</span>
                  {e.willIngest ? (
                    <Badge variant="forfait" style={{ marginLeft: 8, flex: "0 0 auto" }}>
                      {CATEGORY_LABEL[e.category!] ?? e.category}
                    </Badge>
                  ) : (
                    <Badge variant="statut" style={{ marginLeft: 8, flex: "0 0 auto", color: "var(--text-muted)" }}>
                      ignoré
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            {!scan.jsonFiles.some((f) => f.category === "followers") && (
              <p style={{ fontSize: 14, color: "#8A5A00" }}>
                Aucun fichier d&apos;abonnés détecté — vérifiez que l&apos;export contient bien connections/followers_and_following.
              </p>
            )}
            <Button onClick={handleConfirm}>Importer {included.length} fichier(s)</Button>
          </div>
        )}

        {step === "uploading" && uploadProgress && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
              {uploadProgress.phase === "invoking"
                ? "Traitement en cours (analyse des fichiers, recalcul du moteur)…"
                : uploadProgress.phase === "retrying"
                  ? `Nouvelle tentative sur les fichiers en échec — ${uploadProgress.message ?? ""}`
                  : `Envoi… ${uploadProgress.uploaded}/${uploadProgress.total}${uploadProgress.message ? ` · ${uploadProgress.message}` : ""}`}
            </p>
            <div style={{ height: 6, borderRadius: 999, background: "var(--creme-fonce)", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  background: "var(--bleu)",
                  width:
                    uploadProgress.phase === "invoking"
                      ? "100%"
                      : `${Math.round((uploadProgress.uploaded / Math.max(1, uploadProgress.total)) * 100)}%`,
                  transition: "width .2s ease",
                }}
              />
            </div>
          </div>
        )}

        {step === "done" && outcome && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {importFailed ? (
              <div style={{ background: "#FBE9E7", border: "1px solid #E8AFA7", borderRadius: 12, padding: "12px 14px", fontSize: 14, color: "#7A2E22" }}>
                Échec de l&apos;import. {outcome.errorMessage ?? "Erreur inconnue."}
              </div>
            ) : partialFailure ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ background: "var(--pastel-jaune)", borderRadius: 12, padding: "12px 14px", fontSize: 14, color: "var(--encre)" }}>
                  Import partiellement réussi — {jsonOutcomeFiles.length - failedFiles.length} sur {jsonOutcomeFiles.length} fichier(s)
                  traité(s). {followerCounts && `${followerCounts.followers} abonnés et ${followerCounts.following} comptes suivis importés.`}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {failedFiles.map((f) => (
                    <div key={f.path} style={{ fontSize: 13, color: "#7A2E22" }}>
                      <strong>{f.path}</strong> — {f.errorMessage ?? "erreur inconnue"}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ background: "var(--vert-pastel)", borderRadius: 12, padding: "12px 14px", fontSize: 14, color: "var(--bleu)" }}>
                Import réussi — {jsonOutcomeFiles.length} fichier(s) traité(s).{" "}
                {followerCounts && `${followerCounts.followers} abonnés et ${followerCounts.following} comptes suivis importés.`}
              </div>
            )}
          </div>
        )}

        {step === "error" && (
          <div style={{ background: "#FBE9E7", border: "1px solid #E8AFA7", borderRadius: 12, padding: "12px 14px", fontSize: 14, color: "#7A2E22" }}>
            Erreur : {error}
          </div>
        )}
      </div>
    </Card>
  );
}
