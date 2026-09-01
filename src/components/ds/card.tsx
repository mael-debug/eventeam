"use client";

import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

// Bienfait — Carte. Porté depuis _ds_bundle.js (components/core/Card.jsx).
// Variantes : claire (défaut), encre (contraste fort), bleu, vert, pastel.

const VARIANTS: Record<string, CSSProperties> = {
  claire: { background: "var(--carte-claire)", color: "var(--encre)", border: "1px solid var(--bordure-carte)" },
  encre: { background: "var(--encre)", color: "var(--surface-creme)", border: "1px solid var(--encre)" },
  bleu: { background: "var(--bleu)", color: "#FFFFFF", border: "1px solid var(--bleu)" },
  vert: { background: "var(--vert-pastel)", color: "var(--bleu)", border: "1px solid transparent" },
  pastel: { background: "var(--pastel-violet)", color: "var(--encre)", border: "1px solid transparent" },
};

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: keyof typeof VARIANTS;
  num?: ReactNode;
  title?: ReactNode;
  interactive?: boolean;
  tilt?: number;
}

export function Card({
  variant = "claire",
  num,
  title,
  interactive = true,
  tilt = 0,
  children,
  style,
  ...rest
}: CardProps) {
  const base: CSSProperties = {
    borderRadius: "var(--rayon-carte)",
    padding: "24px",
    boxShadow: "var(--ombre-carte)",
    transform: tilt ? `rotate(${tilt}deg)` : undefined,
    transition: "box-shadow .18s ease, transform .18s ease",
    ...VARIANTS[variant],
    ...style,
  };
  const muted = variant === "encre" || variant === "bleu" ? "rgba(255,255,255,0.62)" : "rgba(28,26,22,0.55)";

  return (
    <div
      style={base}
      onMouseEnter={(e) => {
        if (!interactive) return;
        e.currentTarget.style.boxShadow = "var(--ombre-carte-hover)";
        e.currentTarget.style.transform = tilt ? `rotate(${tilt}deg) translateY(-2px)` : "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        if (!interactive) return;
        e.currentTarget.style.boxShadow = "var(--ombre-carte)";
        e.currentTarget.style.transform = tilt ? `rotate(${tilt}deg)` : "translateY(0)";
      }}
      {...rest}
    >
      {num && (
        <div style={{ fontFamily: "var(--font-corps)", fontWeight: "var(--fw-semibold)" as unknown as number, fontSize: "0.85rem", color: muted }}>
          {num}
        </div>
      )}
      {title && (
        <div style={{ fontFamily: "var(--font-corps)", fontWeight: "var(--fw-bold)" as unknown as number, fontSize: "1.25rem", margin: "4px 0 8px" }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
