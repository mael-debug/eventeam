import { Card } from "@/components/ds";
import { pct } from "@/lib/format";
import type { MockBrandFitDimension } from "./mock-audience-intelligence";

export function AudienceBrandFit({ score, dimensions, insight }: { score: number; dimensions: MockBrandFitDimension[]; insight: string }) {
  const maxScore = Math.max(...dimensions.map((d) => d.score), 0);

  return (
    <Card variant="claire" interactive={false}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Votre audience correspond-elle à votre positionnement ?</h3>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontSize: "clamp(40px, 5vw, 56px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, color: "var(--vert-logo)" }}>{score}</span>
          <span style={{ fontSize: 18, color: "var(--text-muted)", fontWeight: 700 }}>/ 100</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {dimensions.map((d) => (
            <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 170, fontSize: 14, flex: "0 0 auto" }}>{d.name}</span>
              <div style={{ flex: 1, height: 8, background: "var(--creme-fonce)", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ width: `${maxScore > 0 ? (d.score / maxScore) * 100 : 0}%`, height: "100%", background: "var(--bleu)" }} />
              </div>
              <span style={{ width: 44, textAlign: "right", fontSize: 14, flex: "0 0 auto" }}>{pct(d.score, 0)}</span>
            </div>
          ))}
        </div>

        <div style={{ background: "var(--vert-pastel)", borderRadius: 14, padding: "12px 16px", fontSize: 13, color: "var(--bleu)", lineHeight: 1.5, textWrap: "pretty" }}>
          {insight}
        </div>
      </div>
    </Card>
  );
}
