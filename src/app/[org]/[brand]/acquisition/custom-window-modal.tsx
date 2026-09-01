"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ds";
import { createCustomWindowAction } from "./actions";

// Modale minimale (pas de composant dédié dans le design system pour
// l'instant) : recouvrement plein écran + carte centrée, fermeture par
// Échap/clic extérieur/bouton. Le formulaire appelle l'action serveur
// directement (pas de <form action=...> classique) pour pouvoir fermer la
// modale et rafraîchir la page une fois l'insertion terminée.
export function CustomWindowModal({ orgSlug, brandSlug, accountId }: { orgSlug: string; brandSlug: string; accountId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    const windowStart = String(formData.get("window_start") ?? "");
    const windowEnd = String(formData.get("window_end") ?? "");
    if (!windowStart || !windowEnd) {
      setError("Les deux dates sont requises.");
      return;
    }
    if (windowEnd < windowStart) {
      setError("La date de fin doit être après la date de début.");
      return;
    }
    startTransition(async () => {
      await createCustomWindowAction(orgSlug, brandSlug, accountId, formData);
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button variant="secondaire" size="sm" onClick={() => setOpen(true)}>
        + Ajouter une période
      </Button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: "fixed", inset: 0, background: "rgba(28,26,22,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div style={{ background: "var(--carte-claire)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 18, boxShadow: "var(--ombre-carte-hover)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Nouvelle période personnalisée</h2>
          <span style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
            Choisissez une plage de dates et un budget pour chiffrer une campagne dont vous connaissez les dates, même si le
            moteur n&apos;y a pas détecté de pic.
          </span>
        </div>

        <form
          action={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 600 }}>
            Nom (optionnel)
            <input
              name="label"
              placeholder="Ex. campagne rentrée"
              style={{ border: "1px solid var(--bordure)", background: "var(--surface-creme)", borderRadius: 10, padding: "8px 12px", fontSize: 14, color: "var(--encre)", outline: "none" }}
            />
          </label>
          <div style={{ display: "flex", gap: 12 }}>
            <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 600 }}>
              Du
              <input
                type="date"
                name="window_start"
                required
                style={{ border: "1px solid var(--bordure)", background: "var(--surface-creme)", borderRadius: 10, padding: "8px 12px", fontSize: 14, color: "var(--encre)", outline: "none" }}
              />
            </label>
            <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 600 }}>
              Au
              <input
                type="date"
                name="window_end"
                required
                style={{ border: "1px solid var(--bordure)", background: "var(--surface-creme)", borderRadius: 10, padding: "8px 12px", fontSize: 14, color: "var(--encre)", outline: "none" }}
              />
            </label>
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 600 }}>
            Budget dépensé (optionnel)
            <div style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid var(--bordure)", background: "var(--surface-creme)", borderRadius: 10, padding: "8px 12px" }}>
              <input
                name="budget_eur"
                inputMode="decimal"
                placeholder="—"
                style={{ border: 0, background: "transparent", outline: "none", width: "100%", fontSize: 14, color: "var(--encre)" }}
              />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>€</span>
            </div>
          </label>

          {error && <span style={{ fontSize: 13, color: "#7A2E22" }}>{error}</span>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
            <Button type="button" variant="lien" size="sm" onClick={() => setOpen(false)} disabled={pending}>
              Annuler
            </Button>
            <Button type="submit" variant="encre" size="sm" disabled={pending}>
              {pending ? "Ajout…" : "Ajouter"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
