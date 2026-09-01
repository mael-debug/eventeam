import { Card, Badge } from "@/components/ds";
import { pct } from "@/lib/format";
import type { MockPersona } from "./mock-audience-intelligence";

const AFFINITY_LABEL: Record<MockPersona["affinity"], string> = {
  VERY_HIGH: "Très forte",
  HIGH: "Forte",
  MEDIUM: "Moyenne",
};
const AFFINITY_VARIANT: Record<MockPersona["affinity"], "forfait" | "cadrage" | "temps"> = {
  VERY_HIGH: "forfait",
  HIGH: "cadrage",
  MEDIUM: "temps",
};

export function AudiencePersonaCard({ persona }: { persona: MockPersona }) {
  return (
    <Card variant="claire" interactive={false}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 16, fontWeight: 800 }}>{persona.name}</span>
            <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--bleu)" }}>{pct(persona.share, 0)}</span>
          </div>
          {persona.emerging && <Badge variant="cadrage">Segment émergent</Badge>}
        </div>

        <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{persona.description}</p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {persona.interests.map((tag) => (
            <span key={tag} style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", background: "var(--panneau)", border: "1px solid var(--bordure)", borderRadius: 999, padding: "3px 9px" }}>
              {tag}
            </span>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, borderTop: "1px solid var(--bordure-carte)", paddingTop: 10, fontSize: 12 }}>
          <span style={{ color: "var(--text-muted)" }}>Affinité marque</span>
          <Badge variant={AFFINITY_VARIANT[persona.affinity]}>{AFFINITY_LABEL[persona.affinity]}</Badge>
        </div>
      </div>
    </Card>
  );
}
