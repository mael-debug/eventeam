"use client";

// Community Intelligence — révélation d'identités (§6.3/§8.6). Appelle
// reveal_usernames() directement depuis le navigateur : la fonction est
// security definer, journalise chaque appel dans audit_log, et vérifie
// désormais can_view_identities (0025) — donc rien de plus à faire ici
// côté autorisation, le rôle est déjà vérifié en amont pour décider
// d'afficher ce composant.

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds";

export interface DepartureRow {
  profileId: number;
  followedAtLabel: string;
  cohortLabel: string;
  departedLabel: string;
  tenureLabel: string;
}

export function RevealDepartures({ accountId, rows }: { accountId: string; rows: DepartureRow[] }) {
  const [revealed, setRevealed] = useState<Record<number, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (revealed) {
      setRevealed(null);
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("reveal_usernames", {
      p_account: accountId,
      p_ids: rows.map((r) => r.profileId),
    });
    setLoading(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setRevealed(Object.fromEntries((data ?? []).map((r) => [r.profile_id, r.username])));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="secondaire" size="sm" onClick={toggle} disabled={loading}>
          {revealed ? "Masquer les identités" : loading ? "Chargement…" : "Révéler les identités"}
        </Button>
      </div>
      {error && <div style={{ fontSize: 13, color: "#7A2E22" }}>{error}</div>}
      {revealed && (
        <div style={{ background: "var(--pastel-jaune)", borderRadius: 12, padding: "12px 16px", fontSize: 13, lineHeight: 1.5 }}>
          Données personnelles affichées. L&apos;usage se limite à l&apos;analyse interne, la consultation est journalisée, et la
          republication de ces identifiants est interdite.
        </div>
      )}
      <div style={{ overflowX: "auto", minWidth: 0 }}>
        <table style={{ width: "100%", minWidth: 620, fontSize: 14, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--text-muted)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              <th style={{ padding: "0 0 10px", fontWeight: 600 }}>Compte</th>
              <th style={{ padding: "0 0 10px", fontWeight: 600 }}>Abonné depuis</th>
              <th style={{ padding: "0 0 10px", fontWeight: 600 }}>Cohorte</th>
              <th style={{ padding: "0 0 10px", fontWeight: 600 }}>Parti</th>
              <th style={{ padding: "0 0 10px", fontWeight: 600, textAlign: "right" }}>Ancienneté</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.profileId} style={{ borderTop: "1px solid var(--bordure-carte)" }}>
                <td style={{ padding: "11px 0", fontWeight: 600 }}>{revealed ? `@${revealed[r.profileId] ?? "?"}` : `compte #${r.profileId}`}</td>
                <td style={{ padding: "11px 0", color: "var(--text-muted)" }}>{r.followedAtLabel}</td>
                <td style={{ padding: "11px 0", color: "var(--text-muted)" }}>{r.cohortLabel}</td>
                <td style={{ padding: "11px 0" }}>{r.departedLabel}</td>
                <td style={{ padding: "11px 0", textAlign: "right", color: "var(--text-muted)" }}>{r.tenureLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
