"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setIdentityAccessAction } from "../actions";
import { Button } from "@/components/ds";

// Bascule can_view_identities pour un brand_member. Réservée à l'agence
// (canWriteView côté page) — cf. set_brand_identity_access (0035) qui
// revérifie can_write() côté serveur, jamais confiance dans l'affichage.
export function IdentityAccessToggle({
  orgSlug,
  brandSlug,
  brandId,
  userId,
  enabled,
}: {
  orgSlug: string;
  brandSlug: string;
  brandId: string;
  userId: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    setBusy(true);
    setError(null);
    try {
      await setIdentityAccessAction(orgSlug, brandSlug, brandId, userId, !enabled);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
      <Button variant="secondaire" size="sm" onClick={handleToggle} disabled={busy}>
        {busy ? "…" : enabled ? "Révoquer l'accès aux identités" : "Autoriser l'accès aux identités"}
      </Button>
      {error && <span style={{ fontSize: 12, color: "#E8A398" }}>{error}</span>}
    </div>
  );
}
