"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { scanExportZip } from "@/lib/ingestion/scan-zip";
import { retryFailedImportFiles, type UploadProgress, type RetryFailedResult } from "@/lib/ingestion/upload-import";
import { Button } from "@/components/ds";

type Step = "idle" | "scanning" | "retrying" | "done" | "error";

// Ne redemande pas tout l'import : seuls les fichiers encore au statut
// 'error' sont ré-uploadés, en réutilisant le même ZIP redéposé (les
// fichiers déjà réussis sont ignorés, jamais retouchés — cf.
// retryFailedImportFiles dans upload-import.ts).
export function RetryFailedFiles({ accountId, importId, failedCount }: { accountId: string; importId: string; failedCount: number }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("idle");
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [result, setResult] = useState<RetryFailedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setStep("scanning");
      try {
        const scan = await scanExportZip(file);
        setStep("retrying");
        const supabase = createClient();
        const res = await retryFailedImportFiles(supabase, accountId, importId, scan, setProgress);
        setResult(res);
        setStep("done");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStep("error");
      }
    },
    [accountId, importId, router],
  );

  if (step === "idle") {
    return (
      <label
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--bleu)",
          textDecoration: "underline",
          marginTop: 4,
        }}
      >
        Redéposer le même export pour réessayer les {failedCount} fichier(s) en échec
        <input
          ref={inputRef}
          type="file"
          accept=".zip"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </label>
    );
  }

  if (step === "scanning" || step === "retrying") {
    return (
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
        {step === "scanning"
          ? "Analyse de l'archive…"
          : `Nouvelle tentative… ${progress?.uploaded ?? 0}/${progress?.total ?? failedCount}${progress?.message ? ` · ${progress.message}` : ""}`}
      </div>
    );
  }

  if (step === "done" && result) {
    return (
      <div style={{ fontSize: 12, marginTop: 4, color: result.stillFailing.length > 0 ? "#7A2E22" : "var(--bleu)" }}>
        {result.fixed} fichier(s) corrigé(s)
        {result.stillFailing.length > 0 ? `, ${result.stillFailing.length} encore en échec.` : "."}
        {result.reprocessed && " Les données corrigées ont été retraitées."}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
      <span style={{ fontSize: 12, color: "#7A2E22" }}>Erreur : {error}</span>
      <Button variant="lien" size="sm" onClick={() => setStep("idle")}>
        Réessayer
      </Button>
    </div>
  );
}
