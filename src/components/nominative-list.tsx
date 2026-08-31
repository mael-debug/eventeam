"use client";

// Community Intelligence — écran Listes (§8.6). Étend le motif de
// reveal-departures.tsx avec l'export CSV et la demande d'effacement.
// Ni l'export ni l'effacement ne sont exécutés côté client sans passer par
// log_identity_action() (0027, même garde can_view_identities que
// reveal_usernames) — chaque action reste journalisée dans audit_log.
// L'effacement est une DEMANDE journalisée, pas une suppression immédiate :
// private_identity.profiles peut être partagé entre plusieurs comptes, une
// suppression directe depuis un seul écran n'a pas la portée nécessaire
// pour être sûre.

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds";

export interface ListRow {
  profileId: number;
  followedAtLabel: string;
  cohortLabel: string;
  intervalLabel: string;
}

function toCsv(rows: { id: string; followedAtLabel: string; cohortLabel: string; intervalLabel: string }[]): string {
  const header = "Identifiant,Abonné depuis,Cohorte,Intervalle de départ";
  const lines = rows.map((r) => [r.id, r.followedAtLabel, r.cohortLabel, r.intervalLabel].map((v) => `"${v.replace(/"/g, '""')}"`).join(","));
  return [header, ...lines].join("\n");
}

export function NominativeList({ accountId, rows }: { accountId: string; rows: ListRow[] }) {
  const [revealed, setRevealed] = useState<Record<number, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requested, setRequested] = useState<Set<number>>(new Set());

  async function toggleReveal() {
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

  async function exportCsv() {
    if (!revealed) return;
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("log_identity_action", {
      p_account: accountId,
      p_action: "export_csv",
      p_profile_ids: rows.map((r) => r.profileId),
    });
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    const csv = toCsv(rows.map((r) => ({ id: `@${revealed[r.profileId] ?? r.profileId}`, followedAtLabel: r.followedAtLabel, cohortLabel: r.cohortLabel, intervalLabel: r.intervalLabel })));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "listes-nominatives.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function requestErasure(profileId: number) {
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("log_identity_action", {
      p_account: accountId,
      p_action: "erasure_requested",
      p_profile_ids: [profileId],
    });
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setRequested((prev) => new Set(prev).add(profileId));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
        <Button variant="secondaire" size="sm" onClick={toggleReveal} disabled={loading}>
          {revealed ? "Masquer les identités" : loading ? "Chargement…" : "Révéler les identités"}
        </Button>
        <Button variant="encre" size="sm" onClick={exportCsv} disabled={!revealed} title={revealed ? undefined : "Révélez les identités avant d'exporter"}>
          Exporter en CSV
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
        <table style={{ width: "100%", minWidth: 700, fontSize: 14, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--text-muted)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              <th style={{ padding: "0 0 10px", fontWeight: 600 }}>Identifiant</th>
              <th style={{ padding: "0 0 10px", fontWeight: 600 }}>Abonné depuis</th>
              <th style={{ padding: "0 0 10px", fontWeight: 600 }}>Cohorte</th>
              <th style={{ padding: "0 0 10px", fontWeight: 600 }}>Intervalle de départ</th>
              <th style={{ padding: "0 0 10px", fontWeight: 600, textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.profileId} style={{ borderTop: "1px solid var(--bordure-carte)" }}>
                <td style={{ padding: "11px 0", fontWeight: 600 }}>{revealed ? `@${revealed[r.profileId] ?? "?"}` : `compte #${r.profileId}`}</td>
                <td style={{ padding: "11px 0", color: "var(--text-muted)" }}>{r.followedAtLabel}</td>
                <td style={{ padding: "11px 0", color: "var(--text-muted)" }}>{r.cohortLabel}</td>
                <td style={{ padding: "11px 0" }}>{r.intervalLabel}</td>
                <td style={{ padding: "11px 0", textAlign: "right" }}>
                  {requested.has(r.profileId) ? (
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Effacement demandé</span>
                  ) : (
                    <button
                      onClick={() => requestErasure(r.profileId)}
                      style={{ cursor: "pointer", background: "none", border: 0, padding: 0, fontSize: 13, fontWeight: 600, color: "var(--bleu)", textDecoration: "underline" }}
                    >
                      Demander l&apos;effacement
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
