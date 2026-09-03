import { Card } from "@/components/ds";

// Page Intro — ce que l'IA peut réellement apporter. Principe non
// négociable : l'IA lit et explique des signaux déjà calculés, elle n'est
// jamais la source primaire d'une métrique ni le moyen d'attribuer un
// persona à une personne précise.

const PIPELINE = ["Données réelles", "Calcul déterministe", "IA d'analyse", "Hypothèses, synthèses, recommandations"];

export function IntroIaSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.01em" }}>
          Ce que l&apos;IA peut réellement apporter
        </h2>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--bleu)", lineHeight: 1.55, maxWidth: 720, textWrap: "pretty" }}>
          L&apos;IA ne doit pas inventer des informations sur les followers. Elle aide à lire, regrouper et
          expliquer les signaux réellement présents dans les données.
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {PIPELINE.map((step, i) => (
          <div key={step} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                padding: "8px 14px",
                borderRadius: 999,
                background: i === 2 ? "var(--bleu)" : "var(--panneau)",
                color: i === 2 ? "#fff" : "var(--encre)",
                border: i === 2 ? "none" : "1px solid var(--bordure)",
              }}
            >
              {step}
            </span>
            {i < PIPELINE.length - 1 && <span aria-hidden style={{ color: "var(--text-muted)" }}>→</span>}
          </div>
        ))}
      </div>

      <Card variant="claire" interactive={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>Exemple</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Le moteur calcule :</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              1 240 départs · +32 % de churn · 4 contenus publiés · campagne paid active · forte baisse de rétention
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
            <div style={{ border: "1px solid var(--vert-pastel)", background: "var(--vert-pastel)", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--bleu)", marginBottom: 4 }}>✓ L&apos;IA peut écrire</div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--encre)", textWrap: "pretty" }}>
                « Le pic de churn coïncide avec une période de forte pression commerciale. La campagne
                e-commerce constitue une hypothèse à investiguer. »
              </p>
            </div>
            <div style={{ border: "1px solid var(--bordure-carte)", background: "var(--creme-fonce)", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--encre)", marginBottom: 4 }}>✕ Elle ne doit jamais écrire</div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--encre)", textWrap: "pretty" }}>
                « Cette campagne a fait fuir les abonnés. »
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Pour les personas et les communautés</h3>
        <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 720, textWrap: "pretty" }}>
          L&apos;IA peut regrouper les signaux agrégés (âge, pays, formats consommés, cohortes, affinités
          observées) en segments marketing lisibles — les mêmes types de communautés que ceux décrits plus haut.
          Ces segments ne doivent jamais être présentés comme le profil d&apos;une personne précise : on parle de
          <strong> segment comportemental observé</strong> ou d&apos;<strong>affinité probable</strong>, jamais
          de « profil psychologique ».
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          <Card variant="claire" interactive={false} style={{ padding: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)" }}>Exemple fictif — Segment A</span>
              <span style={{ fontSize: 14, fontWeight: 800 }}>« Rugby &amp; Heritage »</span>
              <span style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                Forte interaction avec les contenus rugby, engagement élevé sur les ambassadeurs, audience
                principalement France, cohortes plutôt fidèles.
              </span>
            </div>
          </Card>
          <Card variant="claire" interactive={false} style={{ padding: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)" }}>Exemple fictif — Segment B</span>
              <span style={{ fontSize: 14, fontWeight: 800 }}>« Fashion discovery »</span>
              <span style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                Forte exposition Reels, acquisition portée par les contenus produit, audience plus
                internationale, rétention plus faible.
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
