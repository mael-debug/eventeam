"use client";

// Community Intelligence — révélation d'identités pour les arrivées
// (nouveaux + revenus), miroir de reveal-departures.tsx pour v_recent_arrivals
// (0059). Même mécanisme (reveal_usernames est déjà générique, indépendant
// du sens du mouvement) — dupliqué plutôt que généralisé : les deux listes
// n'ont pas les mêmes colonnes (pas d'ancienneté ici, un mouvement nouveau/
// revenu à la place), une abstraction commune n'aurait rien clarifié.

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds";

export interface ArrivalRow {
  profileId: number;
  followedAtLabel: string;
  cohortLabel: string;
  movement: "nouveau" | "revenu";
  arrivedLabel: string;
}

const MOVEMENT_LABEL: Record<ArrivalRow["movement"], string> = { nouveau: "Nouveau", revenu: "Revenu" };

export function RevealArrivals({ accountId, rows }: { accountId: string; rows: ArrivalRow[] }) {
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
              <th style={{ padding: "0 0 10px", fontWeight: 600 }}>Mouvement</th>
              <th style={{ padding: "0 0 10px", fontWeight: 600, textAlign: "right" }}>Arrivée</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.profileId} style={{ borderTop: "1px solid var(--bordure-carte)" }}>
                <td style={{ padding: "11px 0", fontWeight: 600 }}>{revealed ? `@${revealed[r.profileId] ?? "?"}` : `compte #${r.profileId}`}</td>
                <td style={{ padding: "11px 0", color: "var(--text-muted)" }}>{r.followedAtLabel}</td>
                <td style={{ padding: "11px 0", color: "var(--text-muted)" }}>{r.cohortLabel}</td>
                <td style={{ padding: "11px 0" }}>{MOVEMENT_LABEL[r.movement]}</td>
                <td style={{ padding: "11px 0", textAlign: "right", color: "var(--text-muted)" }}>{r.arrivedLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
