import { Card, Badge } from "@/components/ds";

// Page Intro — mécanique du snapshot mensuel. L'exemple chiffré est fictif et
// annoncé comme tel. Les états WINDOWED / FULL_SNAPSHOT_VALIDATED sont
// mentionnés comme direction future du moteur — ils ne sont pas implémentés
// ici, et rien sur cette page ne doit laisser croire le contraire.

export function IntroSnapshotSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.01em" }}>
          Comment fonctionne un snapshot mensuel ?
        </h2>
        <p style={{ margin: 0, fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 760, textWrap: "pretty" }}>
          Chaque export All Time est une photo de la liste des comptes qui suivent le compte, à la date de
          l&apos;export. Comparer deux photos permet de déduire ce qui a changé entre les deux — jamais ce qui
          s&apos;est passé exactement entre elles.
        </p>
      </div>

      <Card variant="claire" interactive={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
            Exemple fictif
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Snapshot du 1er septembre</span>
              <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>101 000 followers</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Snapshot du 1er octobre</span>
              <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>102 500 followers</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <SetOp title="Intersection" formula="Sept ∩ Oct" meaning="Toujours présents à l'import d'octobre." />
            <SetOp title="Différence (Oct − Sept)" formula="Oct \ Sept" meaning="Nouveaux : présents en octobre, absents en septembre." />
            <SetOp title="Différence (Sept − Oct)" formula="Sept \ Oct" meaning="Départs observés entre les deux snapshots." />
            <SetOp title="Absent puis présent" formula="∉ Sept, ∈ Oct, ∈ import antérieur" meaning="Refollow probable — nécessite un historique d'au moins 3 snapshots." />
          </div>

          <div style={{ background: "var(--pastel-jaune)", borderRadius: 14, padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "var(--encre)", lineHeight: 1.55 }}>
            Un export n&apos;est considéré comme un snapshot complet qu&apos;après validation de sa couverture.
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Badge variant="cadrage" style={{ alignSelf: "flex-start" }}>Direction future — non implémenté</Badge>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 720, textWrap: "pretty" }}>
          Le moteur pourra un jour qualifier chaque import selon sa couverture réelle — par exemple un état
          <strong> WINDOWED</strong> (couverture partielle, période limitée) et un état <strong>FULL_SNAPSHOT_VALIDATED</strong>
          {" "}(couverture confirmée par recoupement avec les métriques Meta). Ces états ne sont pas implémentés
          aujourd&apos;hui — ils décrivent une direction, pas une fonctionnalité active.
        </p>
      </div>
    </div>
  );
}

function SetOp({ title, formula, meaning }: { title: string; formula: string; meaning: string }) {
  return (
    <div style={{ border: "1px solid var(--bordure-carte)", borderRadius: 12, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 13, fontWeight: 800 }}>{title}</span>
      <span style={{ fontSize: 12, fontFamily: "monospace", color: "var(--bleu)" }}>{formula}</span>
      <span style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{meaning}</span>
    </div>
  );
}
