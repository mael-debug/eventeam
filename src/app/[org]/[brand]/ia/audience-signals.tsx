import { Card } from "@/components/ds";
import { signedPct } from "@/lib/format";
import type { MockSignal } from "./mock-audience-intelligence";

export function AudienceSignals({ signals }: { signals: MockSignal[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {signals.map((s) => (
          <Card key={s.name} variant="claire" interactive={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
              <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: s.direction === "UP" ? "var(--vert-logo)" : "#C0392B" }}>
                {signedPct(s.change, 0)}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{s.name}</span>
              <span style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{s.description}</span>
            </div>
          </Card>
        ))}
      </div>
      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Évolution fictive pour démonstration.</span>
    </div>
  );
}
