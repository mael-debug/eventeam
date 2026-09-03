"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds";

// Import dont le parsing a réussi (tous les fichiers 'parsed') mais dont le
// recalcul asynchrone (migration 0046) a échoué — le job pg_cron
// run_pending_recomputes() a basculé le statut à 'failed' avec le détail
// dans error_message. Rien à ré-uploader : repasser à 'computing' suffit,
// le prochain cycle de cron (une minute au plus) reprend le calcul.
export function RetryRecompute({ importId }: { importId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRetry = async () => {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("retry_recompute", { p_import_id: importId });
      if (error) throw error;
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
      <Button variant="lien" size="sm" onClick={handleRetry} disabled={busy}>
        {busy ? "Relance…" : "Relancer le calcul"}
      </Button>
      {error && <span style={{ fontSize: 12, color: "#7A2E22" }}>{error}</span>}
    </div>
  );
}
