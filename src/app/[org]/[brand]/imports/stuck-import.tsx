"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds";

// Import resté au statut 'uploading' sans jamais atteindre le serveur
// (started_at absent) : la page a été quittée pendant l'envoi. Rien à
// reprendre — l'insert des fichiers déjà envoyés n'a peut-être pas eu le
// temps de s'exécuter — donc uniquement une suppression sécurisée
// (delete_stuck_import refuse tout import déjà pris en charge par
// process-import) suivie d'un nouvel essai.
export function StuckImport({ importId }: { importId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("delete_stuck_import", { p_import_id: importId });
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
        Cet import a été interrompu avant d&apos;atteindre le serveur (page quittée pendant l&apos;envoi) — rien n&apos;a été traité.
      </div>
      <Button variant="lien" size="sm" onClick={handleDelete} disabled={busy}>
        {busy ? "Suppression…" : "Retirer et réessayer"}
      </Button>
      {error && <span style={{ fontSize: 12, color: "#7A2E22" }}>{error}</span>}
    </div>
  );
}
