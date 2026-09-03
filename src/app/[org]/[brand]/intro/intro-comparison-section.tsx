// Page Intro — comparaison finale à 4 colonnes + phrase de clôture. Cette
// phrase est le message central de toute la page : elle doit rester
// visuellement dominante et proche du texte validé.

const COLUMNS: { label: string; verb: string; text: string }[] = [
  { label: "Instagram", verb: "Voir", text: "Un tableau de bord natif, au présent — utile pour un coup d'œil rapide." },
  { label: "Export All Time", verb: "Mémoriser", text: "Une photo complète, mensuelle, qui s'accumule dans le temps." },
  { label: "Graph API", verb: "Observer en continu", text: "Une fréquence plus fine et du temps réel, en complément de l'export." },
  { label: "Community Intelligence", verb: "Comprendre", text: "La mémoire et la fréquence mises ensemble, pour relier les périodes entre elles." },
];

export function IntroComparisonSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.01em" }}>En résumé</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
        {COLUMNS.map((c) => (
          <div
            key={c.label}
            style={{
              border: "1px solid var(--bordure-carte)",
              borderRadius: "var(--rayon-carte)",
              padding: 18,
              background: "var(--carte-claire)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>{c.label}</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: "var(--bleu)" }}>{c.verb}</span>
            <span style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, textWrap: "pretty" }}>{c.text}</span>
          </div>
        ))}
      </div>

      <div
        style={{
          background: "var(--encre)",
          color: "var(--surface-creme)",
          borderRadius: "var(--rayon-carte)",
          padding: "28px 30px",
        }}
      >
        <p style={{ margin: 0, fontSize: 20, fontWeight: 800, lineHeight: 1.45, letterSpacing: "-0.01em", textWrap: "pretty" }}>
          Notre avantage n&apos;est pas d&apos;afficher une statistique qu&apos;Instagram cacherait. Notre avantage
          est de transformer des données ponctuelles en mémoire, puis cette mémoire en analyses que le reporting
          natif ne construit pas.
        </p>
      </div>
    </div>
  );
}
