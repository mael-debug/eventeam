import { Card } from "@/components/ds";

// Page Intro — la vraie comparaison qui compte pour un client : pas
// "export vs API" (détail interne), mais "appli Instagram" vs "Community
// Intelligence". Instagram fournit déjà de vraies métriques natives ;
// cette section ne doit jamais laisser croire qu'on les réinvente. Rendu en
// cartes plutôt qu'en paragraphes : une comparaison côte à côte, scannable
// en quelques secondes plutôt que lue.

const INSTAGRAM_POINTS = ["Portée, impressions, visites de profil", "Followers gagnés ou perdus", "Performance des publications"];
const CI_POINTS = ["Le même historique, mois après mois", "Comparable à N-1 ou à la tendance récente", "Relié entre contenu, acquisition et rétention"];

const DIFFERENTIATORS: { title: string; text: string }[] = [
  { title: "Mémoire", text: "Chaque import s'ajoute aux précédents — rien n'est écrasé." },
  { title: "Cohortes", text: "Voir combien de nouveaux abonnés restent à 30, 60, 90 jours." },
  { title: "Croisements", text: "Contenu, acquisition et rétention lus ensemble, pas séparément." },
  { title: "Anticipation", text: "Un décrochage se repère en le comparant au passé, avant qu'il ne saute aux yeux." },
];

export function IntroDifferentiatorsSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.01em" }}>
          En quoi Community Intelligence va plus loin qu&apos;Instagram
        </h2>
        <p style={{ margin: 0, fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 640 }}>
          Instagram affiche l&apos;instant présent. Community Intelligence construit la mémoire de la communauté.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        <Card variant="claire" interactive={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 800 }}>Instagram</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Dans l&apos;instant, sans historique</span>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
              {INSTAGRAM_POINTS.map((p) => (
                <li key={p} style={{ fontSize: 13, color: "var(--text-muted)" }}>{p}</li>
              ))}
            </ul>
          </div>
        </Card>
        <Card variant="encre" interactive={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 800 }}>Community Intelligence</span>
            <span style={{ fontSize: 12, color: "rgba(250,248,243,0.6)" }}>Mémorisé, comparable, dans le temps</span>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
              {CI_POINTS.map((p) => (
                <li key={p} style={{ fontSize: 13, color: "rgba(250,248,243,0.85)" }}>{p}</li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <Card variant="claire" interactive={false} style={{ borderColor: "var(--bleu)" }}>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--bleu)", lineHeight: 1.5, textWrap: "pretty" }}>
          Instagram vous montre les métriques. Community Intelligence construit leur historique et répond à des
          questions qu&apos;un rapport ponctuel ne pose pas.
        </p>
      </Card>

      <Card variant="encre" interactive={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(250,248,243,0.55)" }}>
            Exemple fictif — comparer à l&apos;an dernier (N-1)
          </span>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, textWrap: "pretty" }}>
            En octobre, comparer la croissance à celle d&apos;octobre l&apos;an dernier n&apos;est pas possible dans
            Instagram, qui ne garde qu&apos;un instantané récent. Avec l&apos;historique construit mois après mois,
            c&apos;est une simple lecture.
          </p>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {DIFFERENTIATORS.map((d) => (
          <Card key={d.title} variant="claire" interactive={false} style={{ padding: 18 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 800 }}>{d.title}</span>
              <span style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, textWrap: "pretty" }}>{d.text}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
