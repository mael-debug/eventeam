import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

// Bienfait — Chip. Porté depuis _ds_bundle.js (components/core/Chip.jsx).

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  icon?: ReactNode;
}

export function Chip({ icon, children, style, ...rest }: ChipProps) {
  const computed: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontFamily: "var(--font-corps)",
    fontWeight: "var(--fw-medium)" as unknown as number,
    fontSize: "0.88rem",
    lineHeight: 1,
    padding: "8px 14px",
    borderRadius: "var(--rayon-chip)",
    background: "var(--carte-claire)",
    border: "1px solid var(--bordure)",
    color: "var(--encre)",
    ...style,
  };
  return (
    <span style={computed} {...rest}>
      {icon}
      {children}
    </span>
  );
}
