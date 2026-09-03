import { resolveBrandContext } from "@/lib/context/brand-context";
import { IntroHero } from "./intro-hero";
import { IntroDifferentiatorsSection } from "./intro-differentiators-section";
import { IntroSnapshotSection } from "./intro-snapshot-section";
import { IntroEdenParkQuestions } from "./intro-eden-park-questions";

// Page Intro — page statique et non technique expliquant ce que Community
// Intelligence peut réellement savoir, et ce qu'elle ne peut pas savoir.
// Le fil conducteur est "Instagram vs Community Intelligence" (la
// comparaison qui parle à un client), pas "export vs API" (un détail de
// fonctionnement interne) — et le cœur de la page répond uniquement aux
// questions métier posées par Eden Park, pas à une liste générique.
// Volontairement indépendante des données Supabase : compréhensible même
// pour un compte sans aucun import.

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
    <main style={{ display: "flex", flexDirection: "column", gap: 40, maxWidth: 1120, minWidth: 0, paddingBottom: 24 }}>
      {account && (
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Cette page décrit le fonctionnement du produit — elle est identique quel que soit le compte, ici
          @{account.handle}.
        </span>
      )}

      <IntroHero />

      <Section>
        <IntroDifferentiatorsSection />
      </Section>

      <Section>
        <IntroSnapshotSection />
      </Section>

      <Section>
        <IntroEdenParkQuestions />
      </Section>
    </main>
  );
}
