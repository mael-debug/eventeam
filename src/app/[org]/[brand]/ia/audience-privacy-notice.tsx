const CHECKS = ["Personas agrégés", "Pas de buyer score individuel", "Pas de restitution de profils", "Pas d'inférence de données sensibles"];

export function AudiencePrivacyNotice() {
  return (
    <div style={{ background: "var(--panneau)", border: "1px solid var(--bordure)", borderRadius: 18, padding: "18px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>Pensé pour l&apos;analyse d&apos;audience, pas le profiling individuel</span>
        <span style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700, color: "var(--bleu)" }}>Privacy by Design</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px" }}>
        {CHECKS.map((c) => (
          <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)" }}>
            <span style={{ color: "var(--vert-logo)", fontWeight: 800 }}>✓</span>
            {c}
          </span>
        ))}
      </div>
      <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
        Les analyses sont conçues pour produire des tendances globales et des personas anonymisés, plutôt que des dossiers
        individuels.
      </p>
    </div>
  );
}
