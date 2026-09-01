"use client";

// Community Intelligence — courbe d'évolution interactive, en SVG pur (pas
// de librairie de graphes) : plusieurs séries superposées (une par format),
// une légende qui bascule chaque série, un survol par point qui affiche
// les valeurs de toutes les séries visibles à cette semaine. Réutilisable
// partout où une série temporelle doit remplacer un bloc de texte (retour
// du 01/09 : "trop de blocs texte qui pourraient être des métriques").

import { useState } from "react";

const W = 600;
const H = 200;
const PAD_X = 8;
const PAD_TOP = 12;
const PAD_BOTTOM = 28;

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
  values: number[]; // même longueur et mêmes positions que `labels`
}

export function TrendLine({
  labels,
  series,
  valueFormatter,
}: {
  labels: string[];
  series: TrendSeries[];
  valueFormatter?: (n: number) => string;
}) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (labels.length === 0 || series.length === 0) return null;

  const visible = series.filter((s) => !hidden.has(s.key));
  const allValues = visible.flatMap((s) => s.values);
  const max = Math.max(...allValues, 0);
  const min = Math.min(...allValues, 0);
  const range = max - min || 1;
  const usableWidth = W - PAD_X * 2;
  const usableHeight = H - PAD_TOP - PAD_BOTTOM;
  const n = labels.length;

  const xAt = (i: number) => (n > 1 ? PAD_X + (i / (n - 1)) * usableWidth : W / 2);
  const yAt = (v: number) => PAD_TOP + usableHeight - ((v - min) / range) * usableHeight;

  const fmt = valueFormatter ?? ((v: number) => v.toLocaleString("fr-FR"));
  const labelEvery = Math.max(1, Math.ceil(n / 8));

  function toggle(key: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      // Ne jamais masquer la dernière série visible : un graphe vide n'aide personne.
      if (next.size === series.length) next.delete(key);
      return next;
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {series.map((s) => {
          const isHidden = hidden.has(s.key);
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => toggle(s.key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                border: `1px solid ${isHidden ? "var(--bordure-carte)" : s.color}`,
                background: isHidden ? "transparent" : `color-mix(in srgb, ${s.color} 14%, transparent)`,
                borderRadius: 999,
                padding: "4px 10px",
                fontSize: 12,
                fontWeight: 600,
                color: isHidden ? "var(--text-muted)" : "var(--encre)",
                cursor: "pointer",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 999, background: isHidden ? "var(--bordure-carte)" : s.color }} />
              {s.label}
            </button>
          );
        })}
      </div>

      <div style={{ position: "relative" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }} preserveAspectRatio="none">
          <line x1={PAD_X} y1={PAD_TOP + usableHeight} x2={W - PAD_X} y2={PAD_TOP + usableHeight} stroke="var(--bordure-carte)" strokeWidth={1} />

          {hoverIndex != null && (
            <line x1={xAt(hoverIndex)} y1={PAD_TOP} x2={xAt(hoverIndex)} y2={PAD_TOP + usableHeight} stroke="var(--bordure-carte)" strokeWidth={1} strokeDasharray="3 3" />
          )}

          {visible.map((s) => (
            <polyline
              key={s.key}
              points={s.values.map((v, i) => `${xAt(i)},${yAt(v)}`).join(" ")}
              fill="none"
              stroke={s.color}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {labels.map((label, i) => (
            <g key={label + i} onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex((h) => (h === i ? null : h))}>
              <rect x={xAt(i) - (n > 1 ? usableWidth / n / 2 : usableWidth / 2)} y={0} width={n > 1 ? usableWidth / n : usableWidth} height={H} fill="transparent" style={{ cursor: "pointer" }} />
              {visible.map((s) => (
                <circle key={s.key} cx={xAt(i)} cy={yAt(s.values[i])} r={hoverIndex === i ? 4.5 : 3} fill={s.color} />
              ))}
              {i % labelEvery === 0 && (
                <text x={xAt(i)} y={H - 6} fontSize={10} fill="var(--text-muted)" textAnchor="middle">
                  {label}
                </text>
              )}
            </g>
          ))}
        </svg>

        {hoverIndex != null && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: `${(xAt(hoverIndex) / W) * 100}%`,
              transform: xAt(hoverIndex) / W > 0.7 ? "translateX(-100%)" : xAt(hoverIndex) / W < 0.15 ? "none" : "translateX(-50%)",
              background: "var(--encre)",
              color: "var(--surface-creme)",
              borderRadius: 10,
              padding: "8px 12px",
              fontSize: 12,
              lineHeight: 1.6,
              pointerEvents: "none",
              whiteSpace: "nowrap",
              boxShadow: "var(--ombre-carte-hover)",
              zIndex: 1,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 2 }}>{labels[hoverIndex]}</div>
            {visible.map((s) => (
              <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: s.color, flex: "0 0 auto" }} />
                <span style={{ color: "rgba(250,248,243,0.7)" }}>{s.label}</span>
                <span style={{ fontWeight: 700 }}>{fmt(s.values[hoverIndex])}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
