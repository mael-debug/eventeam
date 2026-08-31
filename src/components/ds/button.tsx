"use client";

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

// Bienfait — Bouton en pilule. Porté depuis _ds_bundle.js (components/core/Button.jsx).
// Variantes : primaire (vert logo), bleu, encre, secondaire (contour crème), lien (souligné).

const SIZES: Record<string, CSSProperties> = {
  sm: { padding: "7px 14px", fontSize: "0.85rem" },
  md: { padding: "10px 20px", fontSize: "0.95rem" },
  lg: { padding: "14px 28px", fontSize: "1.05rem" },
};

const VARIANTS: Record<string, CSSProperties> = {
  primaire: { background: "var(--vert-logo)", color: "var(--encre)" },
  bleu: { background: "var(--bleu)", color: "var(--text-on-bleu)" },
  encre: { background: "var(--encre)", color: "var(--carte-claire)" },
  secondaire: { background: "var(--carte-claire)", color: "var(--encre)", borderColor: "var(--bordure)" },
  lien: {
    background: "transparent",
    color: "var(--encre)",
    textDecoration: "underline",
    padding: "4px 6px",
    borderRadius: "6px",
  },
};

type ButtonVariant = keyof typeof VARIANTS;
type ButtonSize = keyof typeof SIZES;

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
}

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type ButtonAsAnchor = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsAnchor;

function base(disabled: boolean): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontFamily: "var(--font-corps)",
    fontWeight: "var(--fw-semibold)" as unknown as number,
    lineHeight: 1,
    borderRadius: "var(--rayon-bouton)",
    border: "1px solid transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    textDecoration: "none",
    whiteSpace: "nowrap",
    opacity: disabled ? 0.5 : 1,
    transition: "transform .12s ease, box-shadow .12s ease, background .12s ease",
  };
}

export function Button({ variant = "primaire", size = "md", iconLeft, iconRight, children, style, ...rest }: ButtonProps) {
  const disabled = "disabled" in rest ? Boolean(rest.disabled) : false;
  const composed: CSSProperties = {
    ...base(disabled),
    ...(variant === "lien" ? {} : SIZES[size]),
    ...VARIANTS[variant],
    ...style,
  };

  const handlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      if (!disabled) e.currentTarget.style.transform = "translateY(-1px)";
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.transform = "translateY(0)";
    },
  };

  if ("href" in rest && rest.href) {
    const { href, ...anchorRest } = rest as ButtonAsAnchor;
    return (
      <a href={href} style={composed} {...handlers} {...anchorRest}>
        {iconLeft}
        {children}
        {iconRight}
      </a>
    );
  }

  const buttonRest = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button style={composed} {...handlers} {...buttonRest}>
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
