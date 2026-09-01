"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCustomWindowAction } from "./actions";

export function DeleteWindowButton({ orgSlug, brandSlug, windowId }: { orgSlug: string; brandSlug: string; windowId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        style={{ border: 0, background: "none", cursor: "pointer", fontSize: 12, color: "var(--text-muted)", textDecoration: "underline", padding: 0 }}
      >
        Retirer
      </button>
    );
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12 }}>
      Confirmer ?
      <button
        onClick={() =>
          startTransition(async () => {
            await deleteCustomWindowAction(orgSlug, brandSlug, windowId);
            router.refresh();
          })
        }
        disabled={pending}
        style={{ border: 0, background: "none", cursor: "pointer", fontWeight: 700, color: "#7A2E22", padding: 0 }}
      >
        {pending ? "…" : "Oui"}
      </button>
      <button onClick={() => setConfirming(false)} disabled={pending} style={{ border: 0, background: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}>
        Non
      </button>
    </span>
  );
}
