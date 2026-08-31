"use client";

import { useRouter } from "next/navigation";

const ROLE_LABEL: Record<string, string> = {
  platform_admin: "Administrateur plateforme",
  agency_admin: "Administrateur agence",
  agency_member: "Membre agence",
  brand_viewer: "Client (lecture seule)",
};

export function Header({
  orgSlug,
  brands,
  currentBrandSlug,
  windowLabel,
  compareLabel,
  role,
  userInitials,
}: {
  orgSlug: string;
  brands: { slug: string; name: string }[];
  currentBrandSlug: string;
  windowLabel: string | null;
  compareLabel: string | null;
  role: string | null;
  userInitials: string;
}) {
  const router = useRouter();

  return (
    <header
      style={{
        flex: "0 0 auto",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 32px",
        height: 64,
        background: "rgba(244,241,236,0.82)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--bordure)",
      }}
    >
      <select
        value={currentBrandSlug}
        onChange={(e) => router.push(`/${orgSlug}/${e.target.value}`)}
        style={{
          border: "1px solid var(--bordure)",
          background: "var(--carte-claire)",
          borderRadius: 999,
          padding: "8px 14px",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--encre)",
          cursor: "pointer",
        }}
      >
        {brands.map((b) => (
          <option key={b.slug} value={b.slug}>
            {b.name}
          </option>
        ))}
      </select>

      {(windowLabel || compareLabel) && (
        <select
          style={{
            border: "1px solid var(--bordure)",
            background: "transparent",
            borderRadius: 999,
            padding: "8px 14px",
            fontSize: 14,
            color: "var(--text-muted)",
            cursor: "pointer",
            maxWidth: 340,
            flex: "1 1 auto",
            minWidth: 0,
            textOverflow: "ellipsis",
          }}
        >
          {windowLabel && <option>{windowLabel}</option>}
          {compareLabel && <option>{compareLabel}</option>}
        </select>
      )}

      <div style={{ marginLeft: "auto", flex: "0 0 auto", display: "flex", alignItems: "center", gap: 12 }}>
        {role && (
          <span
            style={{
              border: "1px solid var(--bordure)",
              background: "var(--carte-claire)",
              borderRadius: 999,
              padding: "7px 14px",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--encre)",
              whiteSpace: "nowrap",
            }}
          >
            {ROLE_LABEL[role] ?? role}
          </span>
        )}
        <div
          style={{
            width: 32,
            height: 32,
            flex: "0 0 32px",
            borderRadius: 999,
            background: "var(--vert-pastel)",
            border: "1px solid var(--bordure-carte)",
            display: "grid",
            placeItems: "center",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {userInitials}
        </div>
      </div>
    </header>
  );
}
