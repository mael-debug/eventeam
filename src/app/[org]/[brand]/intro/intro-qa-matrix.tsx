// Matrice "à quelles questions peut-on répondre ?" — même palette à 3
// niveaux que les badges de confiance utilisés partout ailleurs dans l'app
// (robuste/indicatif/insuffisant : vert-pastel / pastel-jaune / creme-fonce),
// toujours doublée d'un symbole et d'un texte — jamais la couleur seule.

import { QA_ROWS, type QAAnswer, type QAStatus } from "./intro-qa-data";

const STATUS_SYMBOL: Record<QAStatus, string> = { yes: "✓", partial: "~", no: "✕" };
const STATUS_BG: Record<QAStatus, string> = { yes: "var(--vert-pastel)", partial: "var(--pastel-jaune)", no: "var(--creme-fonce)" };
const STATUS_LABEL: Record<QAStatus, string> = { yes: "Oui", partial: "Partiel", no: "Non" };

function AnswerCell({ answer }: { answer: QAAnswer }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span
        style={{
          alignSelf: "flex-start",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          borderRadius: 999,
          padding: "3px 10px",
          fontSize: 11,
          fontWeight: 700,
          background: STATUS_BG[answer.status],
          color: "var(--encre)",
        }}
      >
        <span aria-hidden>{STATUS_SYMBOL[answer.status]}</span>
        {STATUS_LABEL[answer.status]}
      </span>
      <span style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{answer.text}</span>
    </div>
  );
}

export function IntroQaMatrix() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
      <div style={{ overflowX: "auto", minWidth: 0 }}>
        <table style={{ width: "100%", minWidth: 980, borderCollapse: "separate", borderSpacing: "0 10px" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--text-muted)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              <th style={{ padding: "0 12px 8px 0", fontWeight: 700, width: "28%" }}>Question</th>
              <th style={{ padding: "0 12px 8px", fontWeight: 700, width: "18%" }}>Export All Time mensuel</th>
              <th style={{ padding: "0 12px 8px", fontWeight: 700, width: "18%" }}>Graph API</th>
              <th style={{ padding: "0 12px 8px", fontWeight: 700, width: "18%" }}>Instagram</th>
              <th style={{ padding: "0 0 8px", fontWeight: 700, width: "18%" }}>Community Intelligence</th>
            </tr>
          </thead>
          <tbody>
            {QA_ROWS.map((row) => (
              <tr
                key={row.question}
                style={{
                  background: row.highlight ? "var(--bleu-bg)" : "var(--carte-claire)",
                  border: row.highlight ? "1.5px solid var(--bleu)" : "1px solid var(--bordure-carte)",
                }}
              >
                <td style={{ padding: "14px 12px 14px 14px", verticalAlign: "top", borderRadius: "var(--rayon-carte) 0 0 var(--rayon-carte)" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.4, textWrap: "pretty" }}>{row.question}</div>
                  {row.note && <div style={{ fontSize: 12, color: "var(--bleu)", marginTop: 6, lineHeight: 1.5, textWrap: "pretty" }}>{row.note}</div>}
                </td>
                <td style={{ padding: "14px 12px", verticalAlign: "top" }}>
                  <AnswerCell answer={row.exportAllTime} />
                </td>
                <td style={{ padding: "14px 12px", verticalAlign: "top" }}>
                  <AnswerCell answer={row.graphApi} />
                </td>
                <td style={{ padding: "14px 12px", verticalAlign: "top" }}>
                  <AnswerCell answer={row.instagram} />
                </td>
                <td style={{ padding: "14px 14px 14px 12px", verticalAlign: "top", borderRadius: "0 var(--rayon-carte) var(--rayon-carte) 0" }}>
                  <AnswerCell answer={row.communityIntelligence} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
        {QA_ROWS.length} questions courantes, classées Oui / Partiel / Non pour chaque source — faites défiler
        horizontalement sur petit écran.
      </span>
    </div>
  );
}
