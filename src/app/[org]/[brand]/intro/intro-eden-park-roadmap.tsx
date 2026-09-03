import { Card } from "@/components/ds";

// Page Intro — dispositif proposé à Eden Park, du plus simple (déjà en
// place) au plus complet (nécessite des accès supplémentaires que le
// client devra fournir ou autoriser).

const STEPS: { title: string; subtitle: string; text: string }[] = [
  { title: "Community Baseline", subtitle: "Déjà possible", text: "Premier export All Time complet : la photographie initiale de la communauté." },
  { title: "Monthly Snapshot", subtitle: "Déjà possible", text: "Un nouvel export chaque mois : entrants, sortants, rétention, cohortes." },
  { title: "Graph API", subtitle: "Extension", text: "Collecte quotidienne : des métriques et des événements plus fins, en continu." },
  { title: "Marketing API", subtitle: "Extension", text: "Campagnes payantes : mesurer l'effet réel des activations publicitaires sur la communauté." },
  { title: "Données e-commerce", subtitle: "Extension", text: "GA4, analytics ou CRM Eden Park : comparer la santé de la communauté et la performance business." },
  { title: "Revue trimestrielle", subtitle: "Livrable", text: "Personas, communautés, acquisition, churn, contenus, paid, opportunités et recommandations." },
];

export function IntroEdenParkRoadmap() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em" }}>
          Ce que nous pouvons proposer à Eden Park
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {STEPS.map((s, i) => (
          <Card key={s.title} variant="claire" interactive={false} style={{ padding: 18 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)" }}>{i + 1}. {s.subtitle}</span>
              <span style={{ fontSize: 15, fontWeight: 800 }}>{s.title}</span>
              <span style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, textWrap: "pretty" }}>{s.text}</span>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ border: "1px solid var(--bordure-carte)", borderRadius: "var(--rayon-carte)", padding: "20px 22px", background: "var(--panneau)", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 800, letterSpacing: "-0.005em" }}>
          Business Performance + Social Performance + Community Health
        </p>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
          L&apos;objectif à terme : pas simplement un rapport Instagram.
        </p>
      </div>
    </div>
  );
}
