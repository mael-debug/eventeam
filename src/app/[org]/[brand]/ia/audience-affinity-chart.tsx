import { Card } from "@/components/ds";
import { pct } from "@/lib/format";
import type { MockShare } from "./mock-audience-intelligence";

// Même style de barre que l'écran Audience (Bar dans audience/page.tsx) —
// répété ici plutôt que partagé pour rester un composant autonome de la
// section démo, sans dépendance vers un écran de données réelles.
function ShareBar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ width: 130, fontSize: 14, flex: "0 0 auto" }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: "var(--creme-fonce)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, height: "100%", background: "var(--bleu)" }} />
      </div>
      <span style={{ width: 44, textAlign: "right", fontSize: 14, flex: "0 0 auto" }}>{pct(value, 0)}</span>
    </div>
  );
}

export function AudienceAffinityChart({ interests, brandAffinities }: { interests: MockShare[]; brandAffinities: MockShare[] }) {
  const maxInterest = Math.max(...interests.map((i) => i.share), 0);
  const maxBrand = Math.max(...brandAffinities.map((b) => b.share), 0);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, alignItems: "stretch" }}>
      <Card variant="claire" interactive={false} style={{ height: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0, height: "100%" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Centres d&apos;intérêt dominants</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {interests.map((i) => (
              <ShareBar key={i.name} label={i.name} value={i.share} max={maxInterest} />
            ))}
          </div>
        </div>
      </Card>

      <Card variant="claire" interactive={false} style={{ height: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0, height: "100%" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Univers de marques</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {brandAffinities.map((b) => (
              <ShareBar key={b.name} label={b.name} value={b.share} max={maxBrand} />
            ))}
          </div>
          <div style={{ marginTop: "auto", borderTop: "1px solid var(--bordure-carte)", paddingTop: 10, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
            Affinités estimées à partir de signaux agrégés. Ne jamais présenter ces chiffres comme des données réelles Eden
            Park.
          </div>
        </div>
      </Card>
    </div>
  );
}
