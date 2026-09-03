import { Card, Badge } from "@/components/ds";

// Page Intro — mécanique du snapshot mensuel, expliquée en langage simple
// (pas de notation ensembliste : ce n'est pas le public de cette page).
// L'exemple chiffré est fictif et annoncé comme tel. Les états WINDOWED /
// FULL_SNAPSHOT_VALIDATED sont mentionnés comme direction future du moteur
// — non implémentés, et rien sur cette page ne doit laisser croire le
// contraire.

export function IntroSnapshotSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.01em" }}>
          Comment fonctionne un snapshot mensuel ?
        </h2>
        <p style={{ margin: 0, fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 720, textWrap: "pretty" }}>
          Chaque import est une photo de la liste des comptes qui suivent la marque, prise à une date donnée.
          Comparer deux photos permet de voir qui est resté, qui est arrivé et qui est parti entre les deux —
          jamais ce qui s&apos;est passé exactement pendant cette période.
        </p>
      </div>

      <Card variant="claire" interactive={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
            Exemple fictif
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Photo du 1er septembre</span>
              <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>101 000 followers</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Photo du 1er octobre</span>
              <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>102 500 followers</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <SnapshotFact title="Toujours là" text="Présents sur les deux photos : le cœur stable de la communauté." />
            <SnapshotFact title="Nouveaux" text="Présents en octobre, absents en septembre : arrivés dans l'intervalle." />
            <SnapshotFact title="Partis" text="Présents en septembre, absents en octobre : départ observé entre les deux photos." />
            <SnapshotFact title="Probablement revenus" text="Absents en septembre mais déjà vus avant : un refollow probable — nécessite au moins 3 photos d'historique." />
          </div>

          <div style={{ background: "var(--pastel-jaune)", borderRadius: 14, padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "var(--encre)", lineHeight: 1.55 }}>
            Un import n&apos;est considéré comme une photo complète qu&apos;après vérification de sa couverture.
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Badge variant="cadrage" style={{ alignSelf: "flex-start" }}>Direction future — non implémenté</Badge>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 680, textWrap: "pretty" }}>
          Le moteur pourra un jour indiquer, pour chaque import, si sa couverture est seulement partielle ou
          bien confirmée par recoupement avec les métriques Meta. Cette qualification n&apos;existe pas encore
          aujourd&apos;hui — c&apos;est une direction, pas une fonctionnalité active.
        </p>
      </div>
    </div>
  );
}

function SnapshotFact({ title, text }: { title: string; text: string }) {
  return (
    <div style={{ border: "1px solid var(--bordure-carte)", borderRadius: 12, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 13, fontWeight: 800 }}>{title}</span>
      <span style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}
