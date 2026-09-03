import { Card, Badge, Button } from "@/components/ds";
import { Input } from "@/components/ui/input";
import { resolveBrandContext } from "@/lib/context/brand-context";
import { fr, signedFr, pct, signedPct, shortDate } from "@/lib/format";
import { createInstagramAccountAction } from "./actions";

function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card variant="claire" interactive={false}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          {label}
        </div>
        <div style={{ fontSize: "clamp(26px, 2.6vw, 34px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.05, whiteSpace: "nowrap" }}>
          {value}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{sub}</div>
      </div>
    </Card>
  );
}

function AttachAccountCard({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <Card variant="claire" interactive={false}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{description}</div>
        <form action={action} style={{ display: "flex", gap: 8 }}>
          <Input name="handle" required placeholder="edenpark" />
          <Button type="submit">Rattacher</Button>
        </form>
      </div>
    </Card>
  );
}

type Alert = { badge: string; title: string; detail: string; cta: string; href: string };

export default async function BrandOverviewPage({
  params,
}: {
  params: Promise<{ org: string; brand: string }>;
}) {
  const { org: orgSlug, brand: brandSlug } = await params;
  const { supabase, org, brand, accounts } = await resolveBrandContext(orgSlug, brandSlug);
  const base = `/${orgSlug}/${brandSlug}`;
  const attachAction = createInstagramAccountAction.bind(null, org.slug, brand.slug, brand.id);

  if (accounts.length === 0) {
    return (
      <main style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 480 }}>
        <AttachAccountCard
          title="Rattacher un compte Instagram"
          description="Aucun compte pour le moment — l'analyse démarre après le premier rattachement."
          action={attachAction}
        />
      </main>
    );
  }

  const account = accounts[0];

  const { data: comparability } = await supabase
    .from("import_comparability")
    .select("*")
    .eq("account_id", account.id)
    .maybeSingle();

  if (!comparability) {
    return (
      <main style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 480 }}>
        <Card variant="claire" interactive={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 19, fontWeight: 800 }}>Aucun import traité pour @{account.handle}</div>
            <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
              Déposez un premier export Meta pour faire apparaître la Vue d&apos;ensemble.
            </div>
            <Button href={`${base}/imports`}>Aller à Imports</Button>
          </div>
        </Card>
      </main>
    );
  }

  const [{ data: overview }, { data: cohorts }] = await Promise.all([
    supabase.from("v_overview").select("*").eq("account_id", account.id).maybeSingle(),
    supabase
      .from("cohort_survival")
      .select("cohort_week, remaining, departed")
      .eq("account_id", account.id)
      .eq("measured_import_id", comparability.latest_import_id!),
  ]);

  const windowLabel =
    overview?.window_start && overview?.window_end ? `${shortDate(overview.window_start)} → ${shortDate(overview.window_end)}` : "—";
  const insightsLabel =
    overview?.insights_period_start && overview?.insights_period_end
      ? `${shortDate(overview.insights_period_start)} → ${shortDate(overview.insights_period_end)}`
      : "—";

  const alerts: Alert[] = [];

  const cohortRows = cohorts ?? [];
  if (cohortRows.length >= 2) {
    const ranked = cohortRows
      .filter((c) => c.remaining + c.departed > 0)
      .map((c) => ({ ...c, rate: c.departed / (c.remaining + c.departed) }))
      .sort((a, b) => a.cohort_week.localeCompare(b.cohort_week));
    if (ranked.length >= 2) {
      let worst = ranked[0];
      let best = ranked[0];
      for (const c of ranked) {
        if (c.rate > worst.rate) worst = c;
        if (c.rate < best.rate) best = c;
      }
      if (best.rate > 0 && worst.rate / best.rate >= 2 && worst.cohort_week !== best.cohort_week) {
        const multiple = Math.round((worst.rate / best.rate) * 10) / 10;
        alerts.push({
          badge: "Rupture de cohorte",
          title: `Les abonnés recrutés depuis le ${shortDate(worst.cohort_week)} partent ${multiple} fois plus que ceux du ${shortDate(best.cohort_week)}.`,
          detail: `${pct(best.rate * 100)} de départs pour la cohorte du ${shortDate(best.cohort_week)}, ${pct(worst.rate * 100)} pour celle du ${shortDate(worst.cohort_week)}.`,
          cta: "Ouvrir Croissance →",
          href: `${base}/croissance`,
        });
      }
    }
  }

  // Alerte "Qualité des cohortes" désactivée : le score cross_analyses.cohort_quality_score
  // est expérimental (pondérations arbitraires, NULL de survival_at_horizon
  // converti en 0 ce qui pénalise à tort les cohortes récentes) et ne doit
  // pas être présenté comme un indicateur métier fiable. Le calcul reste en
  // base pour du travail R&D, simplement plus affiché ici.

  if (overview?.organic_gained != null) {
    alerts.push({
      badge: "Origine de l'acquisition",
      title: `${fr(overview.organic_gained)} abonnements sont explicitement attribués aux publications statiques analysées sur cette période.`,
      detail: "Les autres acquisitions peuvent provenir de Reels, du profil, d'Explore, de recherches, de partages, de campagnes paid ou d'autres sources que les données actuellement importées ne permettent pas d'attribuer.",
      cta: "Ouvrir Contenu →",
      href: `${base}/contenu`,
    });
  }

  const totalMeasurable = overview?.total_measurable ?? 0;
  const totalDeparted = overview?.total_departed ?? 0;

  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 1280, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.01em" }}>Vue d&apos;ensemble</h1>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          @{account.handle} · abonnés {windowLabel} · Insights {insightsLabel}
        </span>
      </div>

      {comparability.is_single_import && (
        <div style={{ background: "var(--panneau)", border: "1px solid var(--bordure)", borderRadius: 18, padding: "16px 20px", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>
          Un seul import disponible pour @{account.handle}. Les modules de comparaison (taux de départ mesuré, cohortes, pics
          d&apos;acquisition) restent inactifs tant qu&apos;un deuxième import n&apos;a pas été traité — ils ont besoin de deux
          exports consécutifs pour établir une variation.
        </div>
      )}
      {!comparability.is_single_import && !comparability.comparable && (
        <div style={{ background: "var(--pastel-jaune)", borderRadius: 18, padding: "16px 20px", fontSize: 14, color: "var(--encre)", lineHeight: 1.5 }}>
          Les deux derniers imports se recouvrent presque entièrement ({pct((comparability.overlap_ratio ?? 0) * 100, 0)} de
          recouvrement) : {comparability.comparability_reason}. Les chiffres ci-dessous restent affichés, à lire avec cette réserve.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
        <KpiCard
          label="Abonnés"
          value={fr(overview?.followers_total ?? null)}
          sub={`${signedPct(overview?.growth_pct ?? null)} · abonnés ${windowLabel}`}
        />
        <KpiCard
          label="Croissance nette"
          value={signedFr(overview?.followers_net ?? null)}
          sub={`${fr(overview?.followers_gained ?? null)} gagnés · ${fr(overview?.followers_lost ?? null)} perdus · Insights ${insightsLabel}`}
        />
        <KpiCard
          label="Taux de départ mesuré"
          value={totalMeasurable > 0 ? pct(overview?.departure_rate != null ? overview.departure_rate * 100 : null) : "—"}
          sub={
            totalMeasurable > 0
              ? `${fr(totalDeparted)} sur ${fr(totalMeasurable)} comptes comparables · ${windowLabel}`
              : "Disponible après un second import"
          }
        />
        <KpiCard
          label="Part organique"
          value={pct(overview?.organic_share != null ? overview.organic_share * 100 : null)}
          sub={`${fr(overview?.organic_gained ?? null)} sur ${fr(overview?.followers_gained ?? null)} · Insights ${insightsLabel}`}
        />
      </div>

      {alerts.length > 0 && (
        <div style={{ background: "var(--bleu-bg)", border: "1px solid #D3DEF4", borderRadius: 18, padding: 24, display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em" }}>Ce que les compteurs ne disent pas</h2>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {alerts.length} constat{alerts.length > 1 ? "s" : ""} généré{alerts.length > 1 ? "s" : ""} à partir du dernier import
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
            {alerts.map((a, i) => (
              <a key={i} href={a.href} style={{ textDecoration: "none", color: "inherit" }}>
                <Card variant="claire">
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, cursor: "pointer", minWidth: 0 }}>
                    <Badge variant="cadrage">{a.badge}</Badge>
                    <div style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.3, textWrap: "pretty" }}>{a.title}</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{a.detail}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--bleu)", marginTop: 2 }}>{a.cta}</div>
                  </div>
                </Card>
              </a>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
