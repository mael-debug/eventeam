// Page Intro — hero + schéma "3 briques". L'API n'est jamais présentée comme
// un remplacement de l'export : elle vient compléter la mémoire construite
// par les exports mensuels, pas la remplacer.

export function IntroHero() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 820 }}>
        <h1 style={{ margin: 0, fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15, textWrap: "pretty" }}>
          Comprendre ce que Community Intelligence peut réellement savoir
        </h1>
        <p style={{ margin: 0, fontSize: 16, color: "var(--text-muted)", lineHeight: 1.6, textWrap: "pretty" }}>
          Instagram mesure ce qui se passe. Community Intelligence construit la mémoire de votre communauté pour
          comprendre comment elle se forme, évolue et se fidélise.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr auto 1fr",
          alignItems: "stretch",
          gap: 14,
        }}
        className="intro-bricks"
      >
        <Brick
          eyebrow="Import mensuel"
          title="Export All Time"
          subtitle="La mémoire de la communauté"
          detail="Une photo complète de la base à un instant donné, comparée mois après mois."
          variant="claire"
        />
        <Operator symbol="+" />
        <Brick
          eyebrow="Extension API"
          title="Meta Graph API"
          subtitle="Le capteur continu"
          detail="Des métriques fréquentes, du temps réel, sans remplacer la profondeur de l'export."
          variant="claire"
        />
        <Operator symbol="=" />
        <Brick
          eyebrow="Le produit"
          title="Community Intelligence"
          subtitle="Comprendre + comparer + détecter + agir"
          detail="La mémoire de l'export et la fréquence de l'API, mises au service d'une seule question : comment évolue réellement la communauté ?"
          variant="encre"
        />
      </div>
      <style>{`
        @media (max-width: 900px) {
          .intro-bricks { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>
        L&apos;API ne remplace pas l&apos;export : elle ajoute de la fréquence à une mémoire que seuls des exports
        réguliers construisent.
      </p>
    </div>
  );
}

function Operator({ symbol }: { symbol: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, color: "var(--text-muted)" }}>
      {symbol}
    </div>
  );
}

function Brick({
  eyebrow,
  title,
  subtitle,
  detail,
  variant,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  detail: string;
  variant: "claire" | "encre";
}) {
  const inverse = variant === "encre";
  return (
    <div
      style={{
        borderRadius: "var(--rayon-carte)",
        padding: 22,
        background: inverse ? "var(--encre)" : "var(--carte-claire)",
        color: inverse ? "var(--surface-creme)" : "var(--encre)",
        border: inverse ? "1px solid var(--encre)" : "1px solid var(--bordure-carte)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: inverse ? "rgba(250,248,243,0.55)" : "var(--text-muted)" }}>
        {eyebrow}
      </span>
      <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em" }}>{title}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: inverse ? "var(--vert-logo)" : "var(--bleu)" }}>{subtitle}</span>
      <span style={{ fontSize: 13, lineHeight: 1.5, color: inverse ? "rgba(250,248,243,0.75)" : "var(--text-muted)", textWrap: "pretty" }}>
        {detail}
      </span>
    </div>
  );
}
