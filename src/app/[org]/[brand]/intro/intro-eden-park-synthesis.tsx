import { SYNTHESIS_ROWS, type QStatus } from "./intro-eden-park-data";

// Page Intro — synthèse finale des questions Eden Park : une ligne par
// question, jamais la couleur seule (symbole + texte à chaque fois).

const STATUS_SYMBOL: Record<QStatus, string> = { yes: "✓", partial: "~", no: "✕" };
const STATUS_BG: Record<QStatus, string> = { yes: "var(--vert-pastel)", partial: "var(--pastel-jaune)", no: "var(--creme-fonce)" };

export function IntroEdenParkSynthesis() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em" }}>En résumé, pour Eden Park</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {SYNTHESIS_ROWS.map((r) => (
          <div
            key={r.question}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              background: "var(--carte-claire)",
              border: "1px solid var(--bordure-carte)",
              borderRadius: 12,
              padding: "12px 16px",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, textWrap: "pretty" }}>{r.question}</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                fontWeight: 700,
                background: STATUS_BG[r.status],
                borderRadius: 999,
                padding: "4px 12px",
                whiteSpace: "nowrap",
              }}
            >
              <span aria-hidden>{STATUS_SYMBOL[r.status]}</span>
              {r.text}
            </span>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--encre)", color: "var(--surface-creme)", borderRadius: "var(--rayon-carte)", padding: "26px 28px" }}>
        <p style={{ margin: 0, fontSize: 17, fontWeight: 700, lineHeight: 1.55, letterSpacing: "-0.005em", textWrap: "pretty" }}>
          Community Intelligence ne cherche pas à reconstruire la vie privée des followers. L&apos;objectif est de
          comprendre la dynamique de la communauté à partir de données que la marque possède légitimement : qui
          arrive, qui reste, qui part, ce qui se passe autour de ces mouvements, quels contenus recrutent
          durablement et quelles activations semblent fragiliser ou renforcer la communauté.
        </p>
      </div>
    </div>
  );
}
