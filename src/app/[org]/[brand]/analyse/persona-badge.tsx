import { PERSONA_COLORS, PERSONA_DEFINITIONS, type PersonaKey } from "@/lib/analyse-mock";

// Badge de persona — même palette que les cartes de la section Personas
// (PERSONA_COLORS, source unique dans analyse-mock.ts) : c'est ce partage
// de code, pas une simple ressemblance visuelle, qui garantit la
// cohérence entre les deux sections. Pas de "use client" : composant
// purement présentationnel, importable aussi bien depuis la page serveur
// que depuis le tableau client des commentateurs.
const PERSONA_NAME = Object.fromEntries(PERSONA_DEFINITIONS.map((p) => [p.key, p.name])) as Record<PersonaKey, string>;

export function PersonaBadge({ personaKey }: { personaKey: PersonaKey | null }) {
  if (!personaKey) {
    return <span style={{ color: "var(--text-muted)" }}>—</span>;
  }
  const colors = PERSONA_COLORS[personaKey];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: 11,
        fontWeight: 700,
        color: colors.text,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 999,
        padding: "3px 9px",
        whiteSpace: "nowrap",
      }}
    >
      {PERSONA_NAME[personaKey]}
    </span>
  );
}
