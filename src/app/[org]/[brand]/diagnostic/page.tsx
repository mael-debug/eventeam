import { Card, Button } from "@/components/ds";
import { resolveBrandContext } from "@/lib/context/brand-context";
import { fr, pct, shortDate } from "@/lib/format";
import { ReconciliationBanner } from "@/components/reconciliation-banner";
import { SampleWindow } from "@/components/sample-window";

// Comptes-rendu génériques par code de croisement — cadence_vs_churn n'est
// pas encore calculé côté moteur (dépend de `content`, jamais branché au-delà
// du placeholder `insuffisant`, cf. 0019 ~L498-505) : ce cas s'affiche donc
// avec sa raison de confiance plutôt qu'une lecture fabriquée.
const CROSS_LABEL: Record<string, string> = {
  cadence_vs_churn: "Cadence éditoriale et churn",
  reach_quality: "Portée hors-abonnés et qualité des cohortes",
  unfollow_boomerang: "Réciprocité des désabonnements",
};

type CrossPayload = { coefficient_rang?: number; n?: number; taux_reciprocite?: number; taux_depart_reference?: number };

function crossReading(code: string, payload: CrossPayload | null, confidence: string, reason: string | null) {
  if (confidence === "insuffisant" || !payload || Object.keys(payload).length === 0) {
    return { r: "Pas assez de données pour conclure", d: reason ?? "Signal insuffisant sur cet import." };
  }
  if (code === "reach_quality" && payload.coefficient_rang != null) {
    const rho = payload.coefficient_rang;
    const r =
      rho > 0.3
        ? "Les imports à forte portée hors-abonnés recrutent des cohortes plus solides"
        : rho < -0.3
          ? "Les imports à forte portée hors-abonnés recrutent des cohortes plus fragiles"
          : "Aucune corrélation nette entre portée hors-abonnés et qualité de cohorte";
    return { r, d: `Corrélation de rang ρ = ${rho.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} sur ${payload.n ?? 0} imports comparables.` };
  }
  if (code === "unfollow_boomerang" && payload.taux_reciprocite != null) {
    return {
      r: `${pct(payload.taux_reciprocite * 100)} des comptes désabonnés par l'agence se désabonnent d'eux-mêmes ensuite`,
      d: `À comparer à ${pct((payload.taux_depart_reference ?? 0) * 100)} de taux de départ chez les comptes suivis en continu.`,
    };
  }
  return { r: "Résultat disponible", d: "" };
}

const NATURE_LABEL: Record<string, string> = {
  probable_paid: "Achat probable",
  probable_viral: "Viral probable",
  probable_automated: "Automatisé probable",
  indetermine: "Indéterminé",
};
const NATURE_BG: Record<string, string> = {
  probable_paid: "var(--pastel-jaune)",
  probable_viral: "var(--vert-pastel)",
  probable_automated: "var(--pastel-violet)",
  indetermine: "var(--creme-fonce)",
};
const SHAPE_LABEL: Record<string, string> = { plateau: "Plateau", pic_court: "Pic court", rampe: "Rampe" };

const BUCKET_LOS = [0, 7, 14, 21, 30, 45, 60, 90];
function bucketLabel(lo: number, i: number) {
  const next = BUCKET_LOS[i + 1];
  return next != null ? `${lo}–${next} j` : `${lo} j+`;
}

export default async function DiagnosticPage({
  params,
}: {
  params: Promise<{ org: string; brand: string }>;
}) {
  const { org: orgSlug, brand: brandSlug } = await params;
  const { supabase, accounts } = await resolveBrandContext(orgSlug, brandSlug);
  const base = `/${orgSlug}/${brandSlug}`;

  if (accounts.length === 0) {
    return <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Aucun compte Instagram rattaché.</p>;
  }
  const account = accounts[0];

  const { data: comparability } = await supabase
    .from("import_comparability")
    .select("*")
    .eq("account_id", account.id)
    .maybeSingle();

  if (!comparability) {
    return (
      <Card variant="claire" interactive={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 19, fontWeight: 800 }}>Aucun import traité</div>
          <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Le diagnostic apparaît après le premier import.</div>
          <Button href={`${base}/imports`}>Aller à Imports</Button>
        </div>
      </Card>
    );
  }

  const latestImportId = comparability.latest_import_id!;

  const [{ data: hazardRows }, { data: spikes }, { data: crossings }, { data: reconciliation }] = await Promise.all([
    supabase
      .from("hazard_curve")
      .select("age_bucket, at_risk, departed, hazard_rate")
      .eq("account_id", account.id)
      .eq("import_id", latestImportId)
      .eq("cohort_week", "1900-01-01")
      .order("age_bucket"),
    supabase.from("acquisition_spikes").select("*").eq("account_id", account.id).eq("import_id", latestImportId).order("spike_start"),
    supabase
      .from("cross_analyses")
      .select("*")
      .eq("account_id", account.id)
      .eq("import_id", latestImportId)
      .in("code", ["cadence_vs_churn", "reach_quality", "unfollow_boomerang"]),
    supabase.from("reconciliation").select("*").eq("import_id", latestImportId).maybeSingle(),
  ]);

  const buckets = hazardRows ?? [];
  const totalDeparted = buckets.reduce((s, b) => s + b.departed, 0);
  const maxShare = totalDeparted > 0 ? Math.max(...buckets.map((b) => b.departed / totalDeparted)) : 0;

  const earlyShare = totalDeparted > 0 ? buckets.filter((b) => b.age_bucket < 21).reduce((s, b) => s + b.departed, 0) / totalDeparted : 0;
  const lateShare = totalDeparted > 0 ? buckets.filter((b) => b.age_bucket >= 45).reduce((s, b) => s + b.departed, 0) / totalDeparted : 0;
  const matched: "early" | "late" | "flat" = earlyShare >= 0.5 ? "early" : lateShare >= 0.5 ? "late" : "flat";

  const cases: { key: "early" | "flat" | "late"; label: string; reading: string; action: string }[] = [
    { key: "early", label: "Risque concentré sur 0 – 21 jours", reading: "Mauvais ciblage à l'acquisition.", action: "Corriger le ciblage publicitaire." },
    { key: "flat", label: "Risque plat", reading: "Lassitude éditoriale progressive.", action: "Corriger le contenu." },
    { key: "late", label: "Risque tardif, après 45 jours", reading: "Décrochage sur un événement.", action: "Chercher l'événement." },
  ];

  const windowLabel =
    comparability.latest_window_start && comparability.latest_window_end
      ? `${shortDate(comparability.latest_window_start)} → ${shortDate(comparability.latest_window_end)}`
      : "—";

  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1280, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.01em" }}>Diagnostic</h1>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Ce que la forme des départs et des pics permet d&apos;inférer · {windowLabel}
        </span>
      </div>

      {comparability.is_single_import && (
        <div style={{ background: "var(--panneau)", border: "1px solid var(--bordure)", borderRadius: 18, padding: "16px 20px", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>
          Un seul import disponible pour @{account.handle}. Le risque par âge, les croisements et la réconciliation ont besoin
          d&apos;un historique pour prendre du sens — leurs premières lectures fiables arriveront avec le deuxième import. Les
          pics d&apos;acquisition, eux, sont détectables dès ce premier import et restent affichés ci-dessous.
        </div>
      )}
      {!comparability.is_single_import && !comparability.comparable && (
        <div style={{ background: "var(--pastel-jaune)", borderRadius: 18, padding: "16px 20px", fontSize: 14, color: "var(--encre)", lineHeight: 1.5 }}>
          Les deux derniers imports se recouvrent presque entièrement ({pct((comparability.overlap_ratio ?? 0) * 100, 0)} de
          recouvrement) : {comparability.comparability_reason}. Les chiffres ci-dessous restent affichés, à lire avec cette réserve.
        </div>
      )}

      <Card variant="claire" interactive={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Risque par âge d&apos;abonnement</h2>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Répartition des {fr(totalDeparted)} départs selon l&apos;ancienneté au moment du départ.
            </span>
          </div>

          {buckets.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Pas encore de départs mesurés sur cet import.</p>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${buckets.length}, minmax(0, 1fr))`, gap: 12, alignItems: "end" }}>
                {buckets.map((b, i) => {
                  const share = totalDeparted > 0 ? b.departed / totalDeparted : 0;
                  const h = maxShare > 0 ? Math.max(4, Math.round((share / maxShare) * 120)) : 4;
                  return (
                    <div key={b.age_bucket} style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center", minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{pct(share * 100, 0)}</span>
                      <div style={{ width: "100%", borderRadius: "8px 8px 0 0", background: "var(--bleu)", height: h }} />
                      <span style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>{bucketLabel(b.age_bucket, i)}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                {cases.map((c) => {
                  const isMatch = c.key === matched;
                  return (
                    <div
                      key={c.key}
                      style={
                        isMatch
                          ? { border: "1px solid var(--encre)", background: "var(--encre)", color: "var(--surface-creme)", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 6 }
                          : { border: "1px solid var(--bordure-carte)", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 6, color: "var(--text-muted)" }
                      }
                    >
                      <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: isMatch ? "var(--vert-logo)" : undefined }}>
                        {isMatch ? "Cas correspondant aux données" : "Autre forme possible"}
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: isMatch ? "var(--surface-creme)" : "var(--encre)" }}>{c.label}</span>
                      <span style={{ fontSize: 14, lineHeight: 1.5, color: isMatch ? "rgba(250,248,243,0.82)" : "var(--text-muted)" }}>
                        Lecture : {c.reading} Action : {c.action}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </Card>

      <Card variant="claire" interactive={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Pics d&apos;acquisition</h2>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                La nature de chaque pic est inférée de sa forme et de sa part nocturne. Aucune n&apos;est confirmée tant que le compte
                publicitaire n&apos;est pas connecté.
              </span>
            </div>
            <a href={`${base}/acquisition`} style={{ fontSize: 14, fontWeight: 600, color: "var(--bleu)", textDecoration: "underline" }}>
              Saisir les budgets dans Acquisition
            </a>
          </div>
          {(spikes ?? []).length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Aucun pic d&apos;acquisition détecté sur cet import.</p>
          ) : (
            <div style={{ overflowX: "auto", minWidth: 0 }}>
              <table style={{ width: "100%", minWidth: 760, fontSize: 14, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "var(--text-muted)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    <th style={{ padding: "0 8px 10px 0", fontWeight: 600 }}>Période</th>
                    <th style={{ padding: "0 8px 10px", fontWeight: 600, textAlign: "right" }}>Volume</th>
                    <th style={{ padding: "0 8px 10px", fontWeight: 600, textAlign: "right" }}>Multiple</th>
                    <th style={{ padding: "0 8px 10px", fontWeight: 600 }}>Forme</th>
                    <th style={{ padding: "0 8px 10px", fontWeight: 600, textAlign: "right" }}>Part nocturne</th>
                    <th style={{ padding: "0 8px 10px", fontWeight: 600, textAlign: "right" }}>Rétention</th>
                    <th style={{ padding: "0 0 10px", fontWeight: 600 }}>Nature inférée</th>
                  </tr>
                </thead>
                <tbody>
                  {(spikes ?? []).map((p) => (
                    <tr key={p.id} style={{ borderTop: "1px solid var(--bordure-carte)" }}>
                      <td style={{ padding: "11px 8px 11px 0", fontWeight: 600 }}>
                        {shortDate(p.spike_start)} → {shortDate(p.spike_end)}
                      </td>
                      <td style={{ padding: "11px 8px", textAlign: "right" }}>{fr(p.volume)}</td>
                      <td style={{ padding: "11px 8px", textAlign: "right", color: "var(--text-muted)" }}>{p.multiple.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}×</td>
                      <td style={{ padding: "11px 8px", color: "var(--text-muted)" }}>{SHAPE_LABEL[p.shape] ?? p.shape}</td>
                      <td style={{ padding: "11px 8px", textAlign: "right" }}>{pct(p.night_share != null ? p.night_share * 100 : null, 0)}</td>
                      <td style={{ padding: "11px 8px", textAlign: "right", fontWeight: 600 }}>{pct(p.retention_rate != null ? p.retention_rate * 100 : null, 0)}</td>
                      <td style={{ padding: "11px 0" }}>
                        <span style={{ borderRadius: 999, padding: "4px 10px", fontSize: 11, fontWeight: 700, background: NATURE_BG[p.inferred_type] ?? "var(--creme-fonce)" }}>
                          {NATURE_LABEL[p.inferred_type] ?? p.inferred_type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, alignItems: "start" }}>
        {(crossings ?? []).map((x) => {
          const { r, d } = crossReading(x.code, x.payload as CrossPayload, x.confidence, x.confidence_reason);
          return (
            <Card key={x.code} variant="claire" interactive={false}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{CROSS_LABEL[x.code] ?? x.code}</div>
                <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.25, textWrap: "pretty" }}>{r}</div>
                {d && <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{d}</div>}
                <div style={{ borderTop: "1px solid var(--bordure-carte)", paddingTop: 10 }}>
                  <SampleWindow n={x.sample_size} windowStart={x.window_start} windowEnd={x.window_end} confidence={x.confidence} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <ReconciliationBanner reconciliation={reconciliation ?? null} />
    </main>
  );
}
