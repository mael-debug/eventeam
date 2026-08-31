import type { CSSProperties, HTMLAttributes } from "react";

// Bienfait — Badge / étiquette. Porté depuis _ds_bundle.js (components/core/Badge.jsx).
// Variantes pastel (forfait, cadrage, temps, accent) et statut (point vert).

const BASE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  fontFamily: "var(--font-corps)",
  fontWeight: "var(--fw-medium)" as unknown as number,
  fontSize: "0.82rem",
  lineHeight: 1,
  padding: "5px 12px",
  borderRadius: "var(--rayon-chip)",
};

const VARIANTS: Record<string, CSSProperties> = {
  forfait: { background: "var(--vert-pastel)", color: "var(--bleu)" },
  cadrage: { background: "var(--bleu-bg)", color: "var(--bleu)" },
  temps: { background: "var(--pastel-jaune)", color: "var(--encre)" },
  accent: { background: "var(--pastel-violet)", color: "var(--encre)" },
  statut: { background: "var(--carte-claire)", color: "var(--encre)", border: "1px solid var(--bordure)" },
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof VARIANTS;
  dot?: boolean;
}

export function Badge({ variant = "forfait", dot = false, children, style, ...rest }: BadgeProps) {
  const showDot = dot || variant === "statut";
  return (
    <span style={{ ...BASE, ...VARIANTS[variant], ...style }} {...rest}>
      {showDot && (
        <span
          style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--vert-logo)", flex: "none" }}
        />
      )}
      {children}
    </span>
  );
}
