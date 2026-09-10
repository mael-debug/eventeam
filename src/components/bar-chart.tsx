// Community Intelligence — comparaison de magnitude par catégorie, en barres
// horizontales pleines (divs, pas de SVG : plus simple à maintenir pour un
// petit nombre de catégories). Une seule mesure par graphe (jamais deux
// mesures d'échelles différentes sur le même axe) : pour comparer deux
// mesures d'unité identique mais d'ordre de grandeur différent (ex. CA total
// vs panier moyen), instancier deux BarChart séparés plutôt qu'un axe double.
// Couleur = identité de la catégorie (jamais son rang) : la palette est
// fournie par l'appelant (ex. PERSONA_COLORS), jamais générée ici.

export interface BarDatum {
  key: string;
  label: string;
  value: number;
  color: string;
}

export function BarChart({
  data,
  valueFormatter,
}: {
  data: BarDatum[];
  valueFormatter: (n: number) => string;
}) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
      {data.map((d) => {
        const widthPct = max > 0 ? Math.max(1.5, (d.value / max) * 100) : 0;
        return (
          <div key={d.key} style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <span
              style={{
                flex: "0 0 120px", fontSize: 12, color: "var(--text-muted)", overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
              title={d.label}
            >
              {d.label}
            </span>
            <div style={{ flex: "1 1 auto", minWidth: 0, background: "var(--panneau)", borderRadius: 999, height: 14 }}>
              <div style={{ width: `${widthPct}%`, height: "100%", borderRadius: 999, background: d.color }} />
            </div>
            <span style={{ flex: "0 0 auto", minWidth: 76, textAlign: "right", fontSize: 12, fontWeight: 700 }}>
              {valueFormatter(d.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
