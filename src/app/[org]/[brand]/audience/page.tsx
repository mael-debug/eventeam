import { Card, Button } from "@/components/ds";
import { resolveBrandContext } from "@/lib/context/brand-context";
import { fr, pct, shortDate } from "@/lib/format";
import { ReconciliationBanner } from "@/components/reconciliation-banner";

const WEEKDAY_LABEL = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

function Bar({ label, value, max, valueLabel }: { label: string; value: number; max: number; valueLabel: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ width: 120, fontSize: 14 }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: "var(--creme-fonce)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`, height: "100%", background: "var(--bleu)" }} />
      </div>
      <span style={{ width: 60, textAlign: "right", fontSize: 14 }}>{valueLabel}</span>
    </div>
  );
}

export default async function AudiencePage({
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

  const { data: comparability } = await supabase.from("import_comparability").select("*").eq("account_id", account.id).maybeSingle();

  if (!comparability) {
    return (
      <Card variant="claire" interactive={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 19, fontWeight: 800 }}>Aucun import traité</div>
          <div style={{ fontSize: 14, color: "var(--text-muted)" }}>L&apos;audience apparaît après le premier import.</div>
          <Button href={`${base}/imports`}>Aller à Imports</Button>
        </div>
      </Card>
    );
  }

  const latestImportId = comparability.latest_import_id!;

  const [{ data: overview }, { data: audienceInsights }, { data: geo }, { data: age }, { data: activity }, { data: inflow }, { data: reconciliation }] =
    await Promise.all([
      supabase.from("v_overview").select("followers_total").eq("account_id", account.id).maybeSingle(),
      supabase.from("audience_insights").select("male_pct, female_pct").eq("import_id", latestImportId).maybeSingle(),
      supabase.from("audience_geo").select("*").eq("account_id", account.id).eq("import_id", latestImportId),
      supabase.from("audience_age").select("*").eq("account_id", account.id).eq("import_id", latestImportId),
      supabase.from("audience_activity").select("*").eq("account_id", account.id).eq("import_id", latestImportId).order("weekday"),
      supabase.from("inflow_geo_estimate").select("*").eq("account_id", account.id).eq("import_id", latestImportId).order("estimated_pct", { ascending: false }),
      supabase.from("reconciliation").select("*").eq("import_id", latestImportId).maybeSingle(),
    ]);

  const countries = (geo ?? []).filter((g) => g.kind === "country").sort((a, b) => b.pct - a.pct).slice(0, 5);
  const cities = (geo ?? []).filter((g) => g.kind === "city").sort((a, b) => b.pct - a.pct).slice(0, 5);
  const ageAll = (age ?? []).filter((a) => a.gender === "all").sort((a, b) => b.pct - a.pct).slice(0, 4);
  const genderMale = audienceInsights?.male_pct;
  const genderFemale = audienceInsights?.female_pct;

  const activityRows = activity ?? [];
  const maxActivity = activityRows.length ? Math.max(...activityRows.map((a) => a.active_count)) : 0;
  const minActivity = activityRows.length ? Math.min(...activityRows.map((a) => a.active_count)) : 0;

  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1280, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.01em" }}>Audience</h1>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {fr(overview?.followers_total ?? null)} abonnés · dernier import du{" "}
          {comparability.latest_window_end ? shortDate(comparability.latest_window_end) : "—"}
        </span>
      </div>

      {!comparability.is_single_import && !comparability.comparable && (
        <div style={{ background: "var(--pastel-jaune)", borderRadius: 18, padding: "16px 20px", fontSize: 14, color: "var(--encre)", lineHeight: 1.5 }}>
          Les deux périodes comparées se recouvrent à {pct((comparability.overlap_ratio ?? 0) * 100, 0)}. Les évolutions ne sont
          pas interprétables : une même partie de l&apos;audience est comptée dans les deux fenêtres.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, alignItems: "stretch" }}>
        <Card variant="claire" interactive={false} style={{ height: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0, height: "100%" }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Pays et villes</h2>
            {countries.length === 0 ? (
              <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Pas de répartition géographique dans cet import.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {countries.map((c) => (
                  <Bar key={c.name} label={c.name} value={c.pct} max={countries[0].pct} valueLabel={pct(c.pct)} />
                ))}
              </div>
            )}
            {cities.length > 0 && (
              <div style={{ borderTop: "1px solid var(--bordure-carte)", paddingTop: 12, display: "flex", gap: 20, fontSize: 13, color: "var(--text-muted)", flexWrap: "wrap" }}>
                {cities.map((c) => (
                  <span key={c.name}>
                    {c.name} {pct(c.pct)}
                  </span>
                ))}
              </div>
            )}
            {(inflow ?? []).length > 0 && (
              <div style={{ borderTop: "1px solid var(--bordure-carte)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Part du flux entrant, estimée</div>
                {(inflow ?? []).slice(0, 5).map((i) => (
                  <div key={i.country} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-muted)" }}>
                    <span>{i.country}</span>
                    <span>
                      {pct(i.estimated_pct)} ± {i.error_margin.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} pts
                    </span>
                  </div>
                ))}
                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  Inférence par différence de stocks entre les deux derniers imports — dit ce que le stock seul ne dit pas : où va
                  le flux entrant, pas seulement où se trouve l&apos;audience installée.
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card variant="claire" interactive={false} style={{ height: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0, height: "100%" }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Âge et genre</h2>
            {genderMale != null || genderFemale != null ? (
              <div style={{ display: "flex", gap: 24, alignItems: "baseline" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 30, fontWeight: 800 }}>{pct(genderMale ?? null)}</span>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>d&apos;hommes</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 30, fontWeight: 700, color: "var(--text-muted)" }}>{pct(genderFemale ?? null)}</span>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>de femmes</span>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Répartition par genre indisponible dans cet import.</p>
            )}
            {ageAll.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {ageAll.map((a) => (
                  <Bar key={a.age_bucket} label={a.age_bucket} value={a.pct} max={ageAll[0].pct} valueLabel={pct(a.pct)} />
                ))}
              </div>
            )}

            <div style={{ borderTop: "1px solid var(--bordure-carte)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Activité par jour de semaine</h3>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Comptes actifs. Écart entre le jour le plus faible et le plus fort :{" "}
                  {maxActivity > 0 ? pct(((maxActivity - minActivity) / maxActivity) * 100) : "—"}.
                </span>
              </div>
              {activityRows.length === 0 ? (
                <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Pas de données d&apos;activité dans cet import.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 8, alignItems: "end" }}>
                  {activityRows.map((a) => (
                    <div key={a.weekday} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{fr(a.active_count)}</span>
                      <div style={{ width: "100%", height: maxActivity > 0 ? Math.max(4, Math.round((a.active_count / maxActivity) * 64)) : 4, borderRadius: "6px 6px 0 0", background: "var(--bleu)" }} />
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{WEEKDAY_LABEL[a.weekday - 1]?.slice(0, 3) ?? a.weekday}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <ReconciliationBanner reconciliation={reconciliation ?? null} />
    </main>
  );
}
