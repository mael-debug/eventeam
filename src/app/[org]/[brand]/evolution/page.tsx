import { Card, Button } from "@/components/ds";
import { resolveBrandContext } from "@/lib/context/brand-context";
import { shortDate } from "@/lib/format";
import { EvolutionExplorer, type EvolutionPoint } from "./evolution-explorer";

// Écran Évolution — répond directement à "je dois pouvoir choisir la
// fenêtre d'analyse" : le reste de l'app ne compare jamais que le dernier
// import au précédent (import_comparability). Ici, tout l'historique
// d'imports complétés du compte est disponible, et l'utilisateur choisit
// lui-même les deux bornes à comparer.

export default async function EvolutionPage({
  params,
}: {
  params: Promise<{ org: string; brand: string }>;
}) {
  const { org: orgSlug, brand: brandSlug } = await params;
  const base = `/${orgSlug}/${brandSlug}`;
  const { supabase, accounts } = await resolveBrandContext(orgSlug, brandSlug);

  if (accounts.length === 0) {
    return <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Aucun compte Instagram rattaché.</p>;
  }
  const account = accounts[0];

  const { data: imports } = await supabase
    .from("imports")
    .select("id, exported_at, window_start, window_end")
    .eq("account_id", account.id)
    .eq("status", "completed")
    .order("exported_at", { ascending: true });

  if (!imports || imports.length === 0) {
    return (
      <Card variant="claire" interactive={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 19, fontWeight: 800 }}>Aucun import traité</div>
          <div style={{ fontSize: 14, color: "var(--text-muted)" }}>L&apos;évolution apparaît après le premier import.</div>
          <Button href={`${base}/imports`}>Aller à Imports</Button>
        </div>
      </Card>
    );
  }

  if (imports.length === 1) {
    return (
      <main style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1280 }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.01em" }}>Évolution</h1>
        <div style={{ background: "var(--panneau)", border: "1px solid var(--bordure)", borderRadius: 18, padding: "16px 20px", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>
          Un seul import disponible pour @{account.handle}. Une évolution a besoin d&apos;au moins deux imports pour
          montrer une progression — elle apparaîtra dès le deuxième.
        </div>
      </main>
    );
  }

  const importIds = imports.map((i) => i.id);
  const [{ data: audienceInsights }, { data: reconciliation }] = await Promise.all([
    supabase.from("audience_insights").select("*").eq("account_id", account.id).in("import_id", importIds),
    supabase.from("reconciliation").select("*").eq("account_id", account.id).in("import_id", importIds),
  ]);

  const insightsByImport = new Map((audienceInsights ?? []).map((a) => [a.import_id, a]));
  const reconByImport = new Map((reconciliation ?? []).map((r) => [r.import_id, r]));

  type InsightsSnapshot = { followers_total: number | null; followers_gained: number | null; followers_lost: number | null; male_pct: number | null; female_pct: number | null };
  let cumulativeArrivals = 0;
  let prevInsights: InsightsSnapshot | null = null;
  const points: EvolutionPoint[] = imports.map((imp) => {
    const insights = insightsByImport.get(imp.id) ?? null;
    const recon = reconByImport.get(imp.id) ?? null;
    const newArrivals = recon?.observed_arrivals ?? 0;
    cumulativeArrivals += newArrivals;

    const insightsFrozen =
      !!insights &&
      !!prevInsights &&
      insights.followers_total === prevInsights.followers_total &&
      insights.followers_gained === prevInsights.followers_gained &&
      insights.followers_lost === prevInsights.followers_lost &&
      insights.male_pct === prevInsights.male_pct &&
      insights.female_pct === prevInsights.female_pct;

    prevInsights = insights;

    return {
      importId: imp.id,
      label: imp.window_end ? shortDate(imp.window_end) : imp.exported_at ? shortDate(imp.exported_at) : "—",
      windowStart: imp.window_start,
      windowEnd: imp.window_end,
      newArrivals,
      cumulativeArrivals,
      arrivalsCoverage: recon?.arrivals_coverage ?? null,
      followersTotal: insights?.followers_total ?? null,
      followersGained: insights?.followers_gained ?? null,
      followersLost: insights?.followers_lost ?? null,
      malePct: insights?.male_pct ?? null,
      femalePct: insights?.female_pct ?? null,
      insightsFrozen,
    };
  });

  const anyFrozen = points.some((p) => p.insightsFrozen);

  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1280, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.01em" }}>Évolution</h1>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {imports.length} imports traités · @{account.handle}
        </span>
      </div>

      <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 760 }}>
        Les autres écrans comparent toujours le dernier import au précédent. Ici, tout l&apos;historique est
        disponible : choisissez les deux bornes à comparer ci-dessous, indépendamment de leur ordre dans le temps.
      </p>

      {anyFrozen && (
        <div style={{ background: "var(--pastel-jaune)", borderRadius: 18, padding: "16px 20px", fontSize: 14, color: "var(--encre)", lineHeight: 1.5 }}>
          Au moins un des imports listés ci-dessous a des chiffres Meta (abonnés, gagnés, perdus, genre) identiques à
          l&apos;import précédent — repérable dans le tableau plus bas. Cela ne bloque rien, mais vérifiez que chaque
          export contenait bien un fichier d&apos;Insights à jour au moment du téléchargement.
        </div>
      )}

      <EvolutionExplorer points={points} />
    </main>
  );
}
