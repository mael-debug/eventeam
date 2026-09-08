// Page Analyse — indicateur de cadence, réutilisé partout sur la page.
// Toujours symbole + libellé écrit du point de vue client : jamais une
// pastille de couleur seule.

export type Cadence = "RT" | "STORY-END" | "J" | "S" | "CUMUL";

const CADENCE_INFO: Record<Cadence, { symbol: string; label: string; bg: string }> = {
  RT: { symbol: "●", label: "Dès que ça arrive", bg: "var(--vert-pastel)" },
  "STORY-END": { symbol: "⧗", label: "À la fin de la story (24 h)", bg: "var(--pastel-violet)" },
  // Meta ne garantit jamais une fraîcheur nocturne : un relevé quotidien peut
  // remonter des chiffres vieux de jusqu'à 48 h, même interrogé chaque nuit.
  J: { symbol: "☀", label: "Relevé chaque nuit, délai Meta possible jusqu'à 48 h", bg: "var(--bleu-bg)" },
  S: { symbol: "▤", label: "Mis à jour chaque semaine", bg: "var(--pastel-jaune)" },
  CUMUL: { symbol: "∑", label: "Se construit en continu, jamais figé", bg: "var(--creme-fonce)" },
};

export function CadenceChip({ cadence }: { cadence: Cadence }) {
  const info = CADENCE_INFO[cadence];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 11,
        fontWeight: 700,
        background: info.bg,
        color: "var(--encre)",
        whiteSpace: "nowrap",
      }}
    >
      <span aria-hidden style={{ fontSize: 11 }}>{info.symbol}</span>
      {info.label}
    </span>
  );
}
