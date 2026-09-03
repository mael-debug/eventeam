import { resolveBrandContext } from "@/lib/context/brand-context";
import { IntroHero } from "./intro-hero";
import { IntroSnapshotSection } from "./intro-snapshot-section";
import { IntroQaMatrix } from "./intro-qa-matrix";
import { IntroLimitsSection } from "./intro-limits-section";
import { IntroDifferentiatorsSection } from "./intro-differentiators-section";
import { IntroGraphApiSection } from "./intro-graph-api-section";
import { IntroAdsSection } from "./intro-ads-section";
import { IntroComparisonSection } from "./intro-comparison-section";
import { IntroFooterSection } from "./intro-footer-section";

// Page Intro — page statique et non technique expliquant ce que Community
// Intelligence peut réellement savoir, et ce qu'elle ne peut pas savoir.
// Volontairement indépendante des données Supabase : elle doit rester
// compréhensible même pour un compte sans aucun import.

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section style={{ paddingTop: 8, borderTop: "1px solid var(--bordure-douce)" }}>
      {children}
    </section>
  );
}

export default async function IntroPage({
  params,
}: {
  params: Promise<{ org: string; brand: string }>;
}) {
  const { org: orgSlug, brand: brandSlug } = await params;
  const { accounts } = await resolveBrandContext(orgSlug, brandSlug);
  const account = accounts[0] ?? null;

  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 40, maxWidth: 1280, minWidth: 0, paddingBottom: 24 }}>
      {account && (
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Cette page décrit le fonctionnement du produit — elle est identique quel que soit le compte, ici
          @{account.handle}.
        </span>
      )}

      <IntroHero />

      <Section>
        <IntroSnapshotSection />
      </Section>

      <Section>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.01em" }}>
              À quelles questions peut-on répondre ?
            </h2>
            <p style={{ margin: 0, fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 760 }}>
              Pour chaque question courante, ce que chaque source permet réellement de savoir aujourd&apos;hui.
            </p>
          </div>
          <IntroQaMatrix />
        </div>
      </Section>

      <Section>
        <IntroLimitsSection />
      </Section>

      <Section>
        <IntroDifferentiatorsSection />
      </Section>

      <Section>
        <IntroGraphApiSection />
      </Section>

      <Section>
        <IntroAdsSection />
      </Section>

      <Section>
        <IntroComparisonSection />
      </Section>

      <Section>
        <IntroFooterSection />
      </Section>
    </main>
  );
}
