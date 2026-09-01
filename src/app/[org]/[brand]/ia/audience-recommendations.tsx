import { Card, Badge } from "@/components/ds";
import type { MockRecommendation } from "./mock-audience-intelligence";

const IMPACT_LABEL: Record<MockRecommendation["impact"], string> = {
  HIGH: "Élevé",
  MEDIUM_HIGH: "Moyen à élevé",
};
const IMPACT_VARIANT: Record<MockRecommendation["impact"], "forfait" | "cadrage"> = {
  HIGH: "forfait",
  MEDIUM_HIGH: "cadrage",
};

export function AudienceRecommendations({ recommendations }: { recommendations: MockRecommendation[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
      <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Opportunités identifiées</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        {recommendations.map((r) => (
          <Card key={r.title} variant="claire" interactive={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.3 }}>{r.title}</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{r.description}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, borderTop: "1px solid var(--bordure-carte)", paddingTop: 10, fontSize: 12 }}>
                <span style={{ color: "var(--text-muted)" }}>Impact</span>
                <Badge variant={IMPACT_VARIANT[r.impact]}>{IMPACT_LABEL[r.impact]}</Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
