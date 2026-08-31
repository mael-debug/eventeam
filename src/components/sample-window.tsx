// Community Intelligence — triple taille d'échantillon / fenêtre
// d'observation / niveau de confiance. Décision du 31/08 : un seul
// composant, utilisé partout où un croisement (cross_analyses) est affiché,
// pour que le vocabulaire de l'inférence (n=, fenêtre, confiance) ne
// diverge jamais d'un écran à l'autre.

import { fr, shortDate } from "@/lib/format";

const CONF_LABEL: Record<string, string> = { robuste: "robuste", indicatif: "indicatif", insuffisant: "insuffisant" };
const CONF_BG: Record<string, string> = {
  robuste: "var(--vert-pastel)",
  indicatif: "var(--pastel-jaune)",
  insuffisant: "var(--creme-fonce)",
};

export function SampleWindow({
  n,
  windowStart,
  windowEnd,
  confidence,
  reason,
}: {
  n: number | null;
  windowStart?: string | null;
  windowEnd?: string | null;
  confidence: string | null;
  reason?: string | null;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", fontSize: 12, color: "var(--text-muted)" }}>
        <span>n = {n != null ? fr(n) : "—"}</span>
        {windowStart && windowEnd && (
          <>
            <span>·</span>
            <span>
              {shortDate(windowStart)} → {shortDate(windowEnd)}
            </span>
          </>
        )}
        {confidence && (
          <span style={{ borderRadius: 999, padding: "3px 10px", fontWeight: 700, background: CONF_BG[confidence] ?? "var(--creme-fonce)", color: "var(--encre)" }}>
            confiance {CONF_LABEL[confidence] ?? confidence}
          </span>
        )}
      </div>
      {reason && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{reason}</div>}
    </div>
  );
}
