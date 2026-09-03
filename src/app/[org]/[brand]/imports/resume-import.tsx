"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds";

// Import resté au statut 'parsing' sans jamais atteindre 'completed' ni
// 'failed' : sur un compte volumineux, une invocation de process-import
// peut se faire tuer par la plateforme en cours de route (budget CPU par
// invocation dépassé — jamais un échec applicatif, error_message reste
// null). Les fichiers déjà envoyés restent en storage, rien à redéposer :
// un simple nouvel appel suffit, process-import reprend en sautant tout ce
// qui est déjà 'parsed' (cf. en-tête de processImport côté Edge Function).
export function ResumeImport({ importId }: { importId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResume = async () => {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.functions.invoke("process-import", { body: { import_id: importId } });
      if (error) throw error;
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
      <div style={{ background: "var(--pastel-jaune)", borderRadius: 10, padding: "8px 12px", fontSize: 12.5, color: "var(--encre)" }}>
        Le traitement a été interrompu en cours de route (compte volumineux) — rien à redéposer, il reprend là où il s&apos;est arrêté.
      </div>
      <Button variant="lien" size="sm" onClick={handleResume} disabled={busy}>
        {busy ? "Reprise…" : "Reprendre le traitement"}
      </Button>
      {error && <span style={{ fontSize: 12, color: "#7A2E22" }}>{error}</span>}
    </div>
  );
}
