"use client";

// Écran Évolution — fenêtre d'analyse choisie par l'utilisateur, sur tout
// l'historique d'imports du compte (pas seulement le dernier vs le
// précédent). Tout le calcul se fait ici, côté client, à partir des
// données déjà réelles passées en props par la page serveur : pas de
// nouvel aller-retour réseau à chaque changement de fenêtre.

import { useMemo, useState } from "react";
import { TrendLine } from "@/components/trend-line";
import { fr, shortDate } from "@/lib/format";

export interface EvolutionPoint {
  importId: string;
  label: string;
  windowStart: string | null;
  windowEnd: string | null;
  newArrivals: number;
  cumulativeArrivals: number;
  arrivalsCoverage: number | null;
  followersTotal: number | null;
  followersGained: number | null;
  followersLost: number | null;
  malePct: number | null;
  femalePct: number | null;
  insightsFrozen: boolean;
}

export function EvolutionExplorer({ points }: { points: EvolutionPoint[] }) {
  const [fromIndex, setFromIndex] = useState(0);
  const [toIndex, setToIndex] = useState(points.length - 1);

  const range = useMemo(() => points.slice(fromIndex, toIndex + 1), [points, fromIndex, toIndex]);

  function handleFrom(i: number) {
    setFromIndex(i);
    if (i > toIndex) setToIndex(i);
  }
  function handleTo(i: number) {
    setToIndex(i);
    if (i < fromIndex) setFromIndex(i);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)" }}>
          Du
          <select
            value={fromIndex}
            onChange={(e) => handleFrom(Number(e.target.value))}
            style={{ border: "1px solid var(--bordure)", background: "var(--carte-claire)", borderRadius: 999, padding: "7px 12px", fontSize: 13, fontWeight: 600, color: "var(--encre)" }}
          >
            {points.map((p, i) => (
              <option key={p.importId} value={i}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)" }}>
          Au
          <select
            value={toIndex}
            onChange={(e) => handleTo(Number(e.target.value))}
            style={{ border: "1px solid var(--bordure)", background: "var(--carte-claire)", borderRadius: 999, padding: "7px 12px", fontSize: 13, fontWeight: 600, color: "var(--encre)" }}
          >
            {points.map((p, i) => (
              <option key={p.importId} value={i}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {range.length} import{range.length > 1 ? "s" : ""} dans la fenêtre choisie
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        <div style={{ border: "1px solid var(--bordure-carte)", borderRadius: 18, padding: 20, background: "var(--carte-claire)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Abonnés identifiés nommément, cumulés</h3>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Comptes suivis dans les listes exportées, reconnus d&apos;un import à l&apos;autre — grandit avec
                l&apos;historique cumulé, jamais recalculé à la baisse.
              </span>
            </div>
            <TrendLine
              labels={range.map((p) => p.label)}
              series={[{ key: "cumulative", label: "Abonnés identifiés", color: "var(--bleu)", values: range.map((p) => p.cumulativeArrivals) }]}
            />
          </div>
        </div>

        <div style={{ border: "1px solid var(--bordure-carte)", borderRadius: 18, padding: 20, background: "var(--carte-claire)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Nouveaux abonnés identifiés, par import</h3>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Combien de comptes nommés sont apparus pour la première fois à chaque import.</span>
            </div>
            <TrendLine
              labels={range.map((p) => p.label)}
              series={[{ key: "new", label: "Nouveaux identifiés", color: "var(--vert-logo)", values: range.map((p) => p.newArrivals) }]}
            />
          </div>
        </div>
      </div>

      <div style={{ overflowX: "auto", minWidth: 0 }}>
        <table style={{ width: "100%", minWidth: 720, fontSize: 14, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--text-muted)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              <th style={{ padding: "0 8px 10px 0", fontWeight: 600 }}>Import</th>
              <th style={{ padding: "0 8px 10px", fontWeight: 600, textAlign: "right" }}>Abonnés (Meta)</th>
              <th style={{ padding: "0 8px 10px", fontWeight: 600, textAlign: "right" }}>Gagnés (Meta)</th>
              <th style={{ padding: "0 8px 10px", fontWeight: 600, textAlign: "right" }}>Perdus (Meta)</th>
              <th style={{ padding: "0 0 10px", fontWeight: 600 }}></th>
            </tr>
          </thead>
          <tbody>
            {range.map((p) => (
              <tr key={p.importId} style={{ borderTop: "1px solid var(--bordure-carte)" }}>
                <td style={{ padding: "10px 8px 10px 0", fontWeight: 600 }}>
                  {p.windowStart && p.windowEnd ? `${shortDate(p.windowStart)} → ${shortDate(p.windowEnd)}` : p.label}
                </td>
                <td style={{ padding: "10px 8px", textAlign: "right" }}>{fr(p.followersTotal)}</td>
                <td style={{ padding: "10px 8px", textAlign: "right", color: "var(--text-muted)" }}>{fr(p.followersGained)}</td>
                <td style={{ padding: "10px 8px", textAlign: "right", color: "var(--text-muted)" }}>{fr(p.followersLost)}</td>
                <td style={{ padding: "10px 0", textAlign: "right" }}>
                  {p.insightsFrozen && (
                    <span
                      style={{ fontSize: 11, fontWeight: 700, color: "var(--encre)", background: "var(--pastel-jaune)", borderRadius: 999, padding: "3px 9px", cursor: "help" }}
                      title="Ces chiffres Meta n'ont pas changé depuis l'import précédent — espacez vos exports d'au moins un mois pour qu'ils varient."
                    >
                      identique à l&apos;import précédent
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
          Ces trois colonnes viennent directement de Meta. La courbe « Abonnés identifiés » ci-dessus est calculée
          séparément, à partir des listes de comptes suivis, et reste fiable même quand ces colonnes ne bougent pas.
        </p>
      </div>
    </div>
  );
}
