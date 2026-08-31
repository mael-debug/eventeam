import type { CSSProperties, HTMLAttributes } from "react";

// Bienfait — Logo. Wordmark typographique uniquement : « Bienfait » en Plus
// Jakarta Sans extrabold. Pas de monogramme, pas de tuile.
// Porté depuis _ds_bundle.js (components/brand/Logo.jsx).

const COULEURS: Record<string, string> = {
  encre: "var(--encre)",
  vert: "var(--bleu)",
  creme: "var(--surface-creme)",
  blanc: "#FFFFFF",
  inverse: "#FFFFFF",
};

export interface LogoProps extends HTMLAttributes<HTMLSpanElement> {
  color?: keyof typeof COULEURS;
  size?: number;
}

export function Logo({ color = "encre", size = 32, style, ...rest }: LogoProps) {
  const computed: CSSProperties = {
    fontFamily: "var(--font-corps)",
    fontWeight: 800,
    fontSize: size * 0.7,
    letterSpacing: "-0.03em",
    color: COULEURS[color] ?? COULEURS.encre,
    lineHeight: 1,
    ...style,
  };
  return (
    <span role="img" aria-label="Bienfait" style={computed} {...rest}>
      Bienfait
    </span>
  );
}
