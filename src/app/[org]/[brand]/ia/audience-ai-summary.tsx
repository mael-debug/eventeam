import { Card } from "@/components/ds";
import { pct } from "@/lib/format";
import type { MockAudienceIntelligence } from "./mock-audience-intelligence";

export function AudienceAISummary({ data }: { data: MockAudienceIntelligence }) {
  const urbanShare = data.personas.find((p) => p.name === "Urban Lifestyle")?.share ?? 0;
  const kpis = [
    { label: "Personas identifiés", value: String(data.personaCount) },
    { label: "Brand Fit", value: pct(data.brandFit, 0) },
    { label: "Urban Lifestyle", value: pct(urbanShare, 0) },
    { label: "Confiance IA", value: pct(data.confidence, 0) },
  ];

  return (
    <Card variant="encre" interactive={false}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
        <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Synthèse de l&apos;audience</h3>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "rgba(250,248,243,0.85)", textWrap: "pretty" }}>{data.summary}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 18, borderTop: "1px solid rgba(250,248,243,0.15)", paddingTop: 16 }}>
          {kpis.map((k) => (
            <div key={k.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: "clamp(24px, 2.6vw, 32px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1, color: "var(--vert-logo)" }}>{k.value}</span>
              <span style={{ fontSize: 12, color: "rgba(250,248,243,0.6)" }}>{k.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
