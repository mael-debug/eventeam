"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ds";

const NAV_ITEMS: { key: string; label: string; href: (base: string) => string }[] = [
  { key: "intro", label: "Intro", href: (b) => `${b}/intro` },
  { key: "overview", label: "Vue d'ensemble", href: (b) => `${b}` },
  { key: "evolution", label: "Évolution", href: (b) => `${b}/evolution` },
  { key: "audience", label: "Audience", href: (b) => `${b}/audience` },
  { key: "croissance", label: "Croissance", href: (b) => `${b}/croissance` },
  { key: "acquisition", label: "Acquisition", href: (b) => `${b}/acquisition` },
  { key: "diagnostic", label: "Diagnostic", href: (b) => `${b}/diagnostic` },
  { key: "segments", label: "Segments", href: (b) => `${b}/segments` },
  { key: "contenu", label: "Contenu", href: (b) => `${b}/contenu` },
  { key: "ecosysteme", label: "Écosystème", href: (b) => `${b}/ecosysteme` },
  { key: "ia", label: "Showroom IA", href: (b) => `${b}/ia` },
  { key: "listes", label: "Listes", href: (b) => `${b}/listes` },
  { key: "catalogue", label: "Catalogue", href: (b) => `${b}/catalogue` },
  { key: "imports", label: "Imports", href: (b) => `${b}/imports` },
  { key: "journal", label: "Journal", href: (b) => `${b}/journal` },
  { key: "parametres", label: "Paramètres", href: (b) => `${b}/parametres` },
];

export function Sidebar({
  orgSlug,
  brandSlug,
  orgName,
  lastImportLabel,
}: {
  orgSlug: string;
  brandSlug: string;
  orgName: string;
  lastImportLabel: string | null;
}) {
  const pathname = usePathname();
  const base = `/${orgSlug}/${brandSlug}`;

  return (
    <nav
      style={{
        width: 232,
        flex: "0 0 232px",
        background: "var(--encre)",
        color: "var(--surface-creme)",
        display: "flex",
        flexDirection: "column",
        padding: "22px 0",
        overflowY: "auto",
      }}
    >
      <div style={{ padding: "0 20px 22px", display: "flex", flexDirection: "column", gap: 8 }}>
        <Logo color="creme" size={30} />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: "-0.01em" }}>Community Intelligence</div>
          <div style={{ fontSize: 12, color: "rgba(250,248,243,0.5)" }}>{orgName} · analyse d&apos;audience</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 12px" }}>
        {NAV_ITEMS.map((item) => {
          const href = item.href(base);
          const active = item.key === "overview" ? pathname === base : pathname.startsWith(href);
          return (
            <Link
              key={item.key}
              href={href}
              style={{
                textAlign: "left",
                padding: "9px 12px",
                borderRadius: 999,
                fontSize: 14,
                background: active ? "rgba(250,248,243,0.12)" : "transparent",
                color: active ? "#FAF8F3" : "rgba(250,248,243,0.62)",
                fontWeight: active ? 700 : 500,
                textDecoration: "none",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <div
        style={{
          marginTop: "auto",
          padding: "18px 20px 0",
          borderTop: "1px solid rgba(250,248,243,0.12)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          flex: "0 0 auto",
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(250,248,243,0.45)" }}>
          Dernier import
        </div>
        <div style={{ fontSize: 13, paddingBottom: 4 }}>{lastImportLabel ?? "Aucun import pour le moment"}</div>
      </div>
    </nav>
  );
}
