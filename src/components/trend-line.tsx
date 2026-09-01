// Community Intelligence — courbe d'évolution minimale, en SVG pur (pas de
// librairie de graphes) : une polyline sur une grille de coordonnées fixe,
// pour rester cohérent avec le reste du design system qui n'en utilise
// aucune. Réutilisable partout où une série temporelle doit remplacer un
// bloc de texte (retour du 01/09 : "trop de blocs texte qui pourraient
// être des métriques").

const W = 600;
const H = 160;
const PAD_X = 8;
const PAD_TOP = 12;
const PAD_BOTTOM = 28;

export function TrendLine({
  points,
  color = "var(--bleu)",
  valueFormatter,
}: {
  points: { label: string; value: number }[];
  color?: string;
  valueFormatter?: (n: number) => string;
}) {
  if (points.length === 0) return null;

  const values = points.map((p) => p.value);
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const usableWidth = W - PAD_X * 2;
  const usableHeight = H - PAD_TOP - PAD_BOTTOM;

  const coords = points.map((p, i) => {
    const x = points.length > 1 ? PAD_X + (i / (points.length - 1)) * usableWidth : W / 2;
    const y = PAD_TOP + usableHeight - ((p.value - min) / range) * usableHeight;
    return { x, y, ...p };
  });

  const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const fmt = valueFormatter ?? ((n: number) => n.toLocaleString("fr-FR"));

  // Un seul point sur trois (ou moins) reçoit une étiquette d'axe si la
  // série est longue, pour ne pas empiler les libellés les uns sur les
  // autres — la valeur au survol (title) reste disponible pour tous.
  const labelEvery = Math.max(1, Math.ceil(points.length / 8));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }} preserveAspectRatio="none">
      <line x1={PAD_X} y1={PAD_TOP + usableHeight} x2={W - PAD_X} y2={PAD_TOP + usableHeight} stroke="var(--bordure-carte)" strokeWidth={1} />
      <polyline points={polylinePoints} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r={3.5} fill={color}>
            <title>{`${c.label} : ${fmt(c.value)}`}</title>
          </circle>
          {i % labelEvery === 0 && (
            <text x={c.x} y={H - 6} fontSize={10} fill="var(--text-muted)" textAnchor="middle">
              {c.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
