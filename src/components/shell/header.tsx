"use client";

import Link from "next/link";
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
  viewRole,
  canToggleView,
  toggleViewRoleAction,
}: {
  orgSlug: string;
  brands: { slug: string; name: string }[];
  currentBrandSlug: string;
  windowLabel: string | null;
  compareLabel: string | null;
  role: string | null;
  userInitials: string;
  viewRole?: "agence" | "marque";
  canToggleView?: boolean;
  toggleViewRoleAction?: (formData: FormData) => void | Promise<void>;
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
        // Ancien <select> décoratif (aucun onChange, ne changeait jamais rien) —
        // remplacé par un lien réel vers l'écran Évolution, seul endroit de
        // l'app où la fenêtre d'analyse se choisit vraiment (retour du 03/09).
        <Link
          href={`/${orgSlug}/${currentBrandSlug}/evolution`}
          title="Choisir la fenêtre d'analyse"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: "1px solid var(--bordure)",
            background: "transparent",
            borderRadius: 999,
            padding: "8px 14px",
            fontSize: 14,
            color: "var(--text-muted)",
            maxWidth: 340,
            flex: "1 1 auto",
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textDecoration: "none",
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{windowLabel ?? compareLabel}</span>
          <span aria-hidden style={{ marginLeft: "auto", flex: "0 0 auto" }}>↗</span>
        </Link>
      )}

      <div style={{ marginLeft: "auto", flex: "0 0 auto", display: "flex", alignItems: "center", gap: 12 }}>
        {canToggleView && toggleViewRoleAction && (
          <form action={toggleViewRoleAction}>
            <button
              type="submit"
              name="mode"
              value={viewRole === "marque" ? "agence" : "marque"}
              title="Prévisualiser la vue client, sans changer vos droits réels"
              style={{
                cursor: "pointer",
                border: "1px solid var(--bordure)",
                background: viewRole === "marque" ? "var(--pastel-jaune)" : "var(--carte-claire)",
                borderRadius: 999,
                padding: "7px 14px",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--encre)",
                whiteSpace: "nowrap",
              }}
            >
              {viewRole === "marque" ? "Marque · lecture seule" : "Agence · accès complet"}
            </button>
          </form>
        )}
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
