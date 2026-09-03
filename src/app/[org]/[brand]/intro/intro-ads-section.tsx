import { Card } from "@/components/ds";

// Page Intro — "Et la publicité ?". Distingue clairement l'API Instagram
// Graph (organique) de la Marketing API (payant, non intégrée aujourd'hui).
// L'exemple chiffré est entièrement fictif.

export function IntroAdsSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.01em" }}>Et la publicité ?</h2>
        <p style={{ margin: 0, fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 760, textWrap: "pretty" }}>
          L&apos;API Instagram Graph, décrite plus haut, couvre le contenu et l&apos;audience organiques. La
          publicité payante relève d&apos;une API distincte, la <strong>Marketing API</strong> — non intégrée à
          Community Intelligence aujourd&apos;hui.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        <Card variant="claire" interactive={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>API Instagram Graph — organique</h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55 }}>
              Contenu publié, portée, engagement, followers, écosystème. C&apos;est ce que décrit toute cette
              page.
            </p>
          </div>
        </Card>
        <Card variant="claire" interactive={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Marketing API — payant</h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55 }}>
              Budgets, campagnes, audiences publicitaires. Une future extension pourrait la croiser avec la
              rétention de cohortes pour estimer un coût réel par follower retenu.
            </p>
          </div>
        </Card>
      </div>

      <Card variant="encre" interactive={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(250,248,243,0.55)" }}>
            Exemple fictif — Campagne A
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
            {[
              ["8 000 €", "budget investi"],
              ["4 000", "followers recrutés"],
              ["2 300", "encore présents à J+90"],
              ["3,48 €", "coût réel par follower retenu"],
            ].map(([value, label]) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>{value}</span>
                <span style={{ fontSize: 12, color: "rgba(250,248,243,0.6)" }}>{label}</span>
              </div>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(250,248,243,0.75)", lineHeight: 1.55, textWrap: "pretty" }}>
            8 000 € pour 4 000 recrutés, mais seulement 2 300 encore présents 90 jours plus tard : le coût par
            follower réellement retenu (3,48 €) est bien plus informatif que le coût par recrutement brut (2 €).
            Ce calcul suppose un croisement avec la Marketing API, qui n&apos;est pas branché aujourd&apos;hui.
          </p>
        </div>
      </Card>
    </div>
  );
}
