"use client";

// Community Intelligence — nuage de points, en SVG pur (même esprit que
// trend-line.tsx : pas de librairie de graphes). Sert aux analyses croisées
// entre deux mesures de même famille (ex. clics vs commandes) : chaque point
// est une entité (une publication), sa couleur porte son identité
// catégorielle (ex. persona dominant), jamais son rang — fournie par
// l'appelant, jamais générée ici. Survol : anneau clair de séparation sur les
// points superposés, infobulle instantanée (aucune animation).

import { useState } from "react";

const W = 640;
const H = 320;
const PAD_LEFT = 46;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 40;

export interface ScatterPoint {
  key: string;
  label: string;
  x: number;
  y: number;
  color: string;
}

export function ScatterChart({
  points,
  xLabel,
  yLabel,
  xFormatter,
  yFormatter,
}: {
  points: ScatterPoint[];
  xLabel: string;
  yLabel: string;
  xFormatter?: (n: number) => string;
  yFormatter?: (n: number) => string;
}) {
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  if (points.length === 0) return null;

  const xf = xFormatter ?? ((n: number) => n.toLocaleString("fr-FR"));
  const yf = yFormatter ?? ((n: number) => n.toLocaleString("fr-FR"));
  const maxX = Math.max(...points.map((p) => p.x), 1);
  const maxY = Math.max(...points.map((p) => p.y), 1);
  const usableWidth = W - PAD_LEFT - PAD_RIGHT;
  const usableHeight = H - PAD_TOP - PAD_BOTTOM;
  const xAt = (x: number) => PAD_LEFT + (x / maxX) * usableWidth;
  const yAt = (y: number) => PAD_TOP + usableHeight - (y / maxY) * usableHeight;
  const hovered = points.find((p) => p.key === hoverKey) ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ position: "relative" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }} preserveAspectRatio="none">
          <line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={PAD_TOP + usableHeight} stroke="var(--bordure-carte)" strokeWidth={1} />
          <line x1={PAD_LEFT} y1={PAD_TOP + usableHeight} x2={W - PAD_RIGHT} y2={PAD_TOP + usableHeight} stroke="var(--bordure-carte)" strokeWidth={1} />
          <text x={PAD_LEFT + usableWidth / 2} y={H - 8} fontSize={11} fill="var(--text-muted)" textAnchor="middle">
            {xLabel}
          </text>
          <text
            x={0}
            y={0}
            fontSize={11}
            fill="var(--text-muted)"
            textAnchor="middle"
            transform={`translate(14, ${PAD_TOP + usableHeight / 2}) rotate(-90)`}
          >
            {yLabel}
          </text>
          {points.map((p) => (
            <circle
              key={p.key}
              cx={xAt(p.x)}
              cy={yAt(p.y)}
              r={hoverKey === p.key ? 7 : 5.5}
              fill={p.color}
              stroke="var(--carte-claire)"
              strokeWidth={2}
              onMouseEnter={() => setHoverKey(p.key)}
              onMouseLeave={() => setHoverKey((k) => (k === p.key ? null : k))}
              style={{ cursor: "pointer" }}
            />
          ))}
        </svg>

        {hovered && (
          <div
            style={{
              position: "absolute",
              left: `${(xAt(hovered.x) / W) * 100}%`,
              top: `${(yAt(hovered.y) / H) * 100}%`,
              transform: "translate(-50%, -130%)",
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
            <div style={{ fontWeight: 700, marginBottom: 2 }}>{hovered.label}</div>
            <div>
              {xLabel} : <strong>{xf(hovered.x)}</strong>
            </div>
            <div>
              {yLabel} : <strong>{yf(hovered.y)}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
