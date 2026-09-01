import { Card, Button } from "@/components/ds";
import { resolveBrandContext } from "@/lib/context/brand-context";
import { fr, pct, shortDate } from "@/lib/format";
import { ReconciliationBanner } from "@/components/reconciliation-banner";
import { RevealDepartures, type DepartureRow } from "@/components/reveal-departures";

const DEPARTURES_SHOWN = 8;

export default async function CroissancePage({
  params,
}: {
  params: Promise<{ org: string; brand: string }>;
}) {
  const { org: orgSlug, brand: brandSlug } = await params;
  const base = `/${orgSlug}/${brandSlug}`;
  const { supabase, accounts, canViewIdentities } = await resolveBrandContext(orgSlug, brandSlug);

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
          <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Croissance et départs apparaissent après le premier import.</div>
          <Button href={`${base}/imports`}>Aller à Imports</Button>
        </div>
      </Card>
    );
  }

  if (comparability.is_single_import) {
    return (
      <main style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1280 }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.01em" }}>Croissance et départs</h1>
        <div style={{ background: "var(--panneau)", border: "1px solid var(--bordure)", borderRadius: 18, padding: "16px 20px", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>
          Un seul import disponible pour @{account.handle}. Les arrivées par cohorte restent lisibles dès ce premier import, mais
          aucun départ ne peut être mesuré sans un second import consécutif à comparer.
        </div>
      </main>
    );
  }

  const windowLabel =
    comparability.latest_window_start && comparability.latest_window_end
      ? `${shortDate(comparability.latest_window_start)} → ${shortDate(comparability.latest_window_end)}`
      : "—";

  const [{ data: bars }, { data: cohortTotals }, { data: renames }, { data: departures, count: departuresCount }, { data: reconciliation }] =
    await Promise.all([
      supabase.from("v_growth_by_cohort").select("*").eq("account_id", account.id).order("cohort_week"),
      supabase.from("v_cohort_totals").select("*").eq("account_id", account.id).maybeSingle(),
      supabase.from("v_likely_renames").select("*").eq("account_id", account.id).maybeSingle(),
      supabase
        .from("v_recent_departures")
        .select("*", { count: "exact" })
        .eq("account_id", account.id)
        .limit(DEPARTURES_SHOWN),
      supabase.from("reconciliation").select("*").eq("import_id", comparability.latest_import_id!).maybeSingle(),
    ]);

  const rows = bars ?? [];
  const maxArrivals = rows.length ? Math.max(...rows.map((b) => b.arrivals ?? 0)) : 0;
  const maxDeparted = rows.length ? Math.max(...rows.map((b) => b.departed ?? 0)) : 0;

  const departureRows: DepartureRow[] = (departures ?? [])
    .filter((d): d is typeof d & { profile_id: number; followed_at: string; cohort_week: string } => d.profile_id != null && d.followed_at != null && d.cohort_week != null)
    .map((d) => ({
    profileId: d.profile_id,
    followedAtLabel: shortDate(d.followed_at),
    cohortLabel: shortDate(d.cohort_week),
    departedLabel:
      d.departure_window_start && d.departure_window_end
        ? `entre le ${shortDate(d.departure_window_start)} et le ${shortDate(d.departure_window_end)}`
        : "—",
    tenureLabel: d.tenure_days != null ? `${d.tenure_days} j` : "—",
  }));

  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1280, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.01em" }}>Croissance et départs</h1>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Arrivées et départs des cohortes suivies · abonnés {windowLabel}</span>
      </div>

      {!comparability.comparable && (
        <div style={{ background: "var(--pastel-jaune)", borderRadius: 18, padding: "16px 20px", fontSize: 14, color: "var(--encre)", lineHeight: 1.5 }}>
          Les deux derniers imports se recouvrent presque entièrement ({pct((comparability.overlap_ratio ?? 0) * 100, 0)} de
          recouvrement) : {comparability.comparability_reason}. Les chiffres ci-dessous restent affichés, à lire avec cette réserve.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: 16, alignItems: "start" }}>
        <Card variant="claire" interactive={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Arrivées et départs par cohorte</h2>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Deux échelles distinctes : à l&apos;échelle des arrivées, les départs seraient invisibles. Ces volumes sont ceux des{" "}
                {fr(cohortTotals?.total_measurable ?? null)} comptes comparables, pas ceux du compte entier.
              </span>
            </div>

            <div style={{ background: "var(--vert-pastel)", borderRadius: 14, padding: "12px 16px", fontSize: 13, color: "var(--bleu)", lineHeight: 1.5, textWrap: "pretty" }}>
              Une cohorte regroupe tous les comptes abonnés au cours d&apos;une même semaine. On la suit ensuite dans le temps :
              combien sont arrivés cette semaine-là, combien d&apos;entre eux sont partis depuis. Comparer des cohortes plutôt qu&apos;un
              total permet de voir si les arrivées récentes se comportent différemment des anciennes.
            </div>

            {rows.length === 0 ? (
              <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Pas encore de cohortes mesurables.</p>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                    <span>Arrivées</span>
                    <span>max {fr(maxArrivals)}</span>
                  </div>
                  <div style={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: "minmax(0, 1fr)", gap: 8, alignItems: "end", minWidth: 0 }}>
                    {rows.map((b) => (
                      <div
                        key={b.cohort_week}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          alignItems: "center",
                          background: b.is_spike_period ? "var(--bleu-bg)" : "transparent",
                          borderRadius: 10,
                          padding: "6px 4px",
                          minWidth: 0,
                        }}
                      >
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{fr(b.arrivals)}</span>
                        <div style={{ width: "100%", maxWidth: 34, borderRadius: "5px 5px 0 0", background: "var(--bleu)", height: maxArrivals > 0 ? Math.max(4, Math.round(((b.arrivals ?? 0) / maxArrivals) * 130)) : 4 }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--encre)", whiteSpace: "nowrap", textAlign: "center" }}>{b.cohort_week ? shortDate(b.cohort_week) : "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                    <span>Départs constatés à ce jour</span>
                    <span>max {fr(maxDeparted)}</span>
                  </div>
                  <div style={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: "minmax(0, 1fr)", gap: 8, alignItems: "end", minWidth: 0 }}>
                    {rows.map((b) => (
                      <div
                        key={b.cohort_week}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          alignItems: "center",
                          background: b.is_spike_period ? "var(--bleu-bg)" : "transparent",
                          borderRadius: 10,
                          padding: "6px 4px",
                          minWidth: 0,
                        }}
                      >
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{fr(b.departed)}</span>
                        <div style={{ width: "100%", maxWidth: 34, borderRadius: "5px 5px 0 0", background: "#A8A196", height: maxDeparted > 0 ? Math.max(4, Math.round(((b.departed ?? 0) / maxDeparted) * 130)) : 4 }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--encre)", whiteSpace: "nowrap", textAlign: "center" }}>{b.cohort_week ? shortDate(b.cohort_week) : "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Les semaines surlignées sont les pics d&apos;acquisition, inférés du volume d&apos;arrivées.</div>
              </>
            )}
          </div>
        </Card>

        <Card variant="claire" interactive={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>Taux de départ mesuré</div>
              <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>
                {pct(cohortTotals?.departure_rate != null ? cohortTotals.departure_rate * 100 : null)}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {fr(cohortTotals?.total_departed ?? null)} comptes sur {fr(cohortTotals?.total_measurable ?? null)} suivis
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--bordure-carte)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>Renommages présumés (exclus du calcul)</div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1, color: "var(--text-muted)" }}>{fr(renames?.likely_rename_count ?? 0)}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                Un compte qui change de pseudonyme disparaît de l&apos;export et ressemble à un départ. Ce nombre de profils
                signalés comme renommage probable (motifs de nom d&apos;utilisateur suspects) est déjà exclu des cohortes et du
                taux ci-dessus.
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card variant="claire" interactive={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Derniers départs</h2>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {departureRows.length} ligne{departureRows.length > 1 ? "s" : ""} affichée{departureRows.length > 1 ? "s" : ""} sur{" "}
                {fr(departuresCount ?? departureRows.length)}. Aucune date exacte : l&apos;écart entre deux imports fixe la précision.
              </span>
            </div>
            {(departuresCount ?? 0) > departureRows.length && (
              <Button href={`${base}/listes`} variant="secondaire" size="sm">
                Voir la liste complète ({fr(departuresCount ?? 0)})
              </Button>
            )}
          </div>
          {departureRows.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Aucun départ mesuré sur cet import.</p>
          ) : canViewIdentities ? (
            <RevealDepartures accountId={account.id} rows={departureRows} />
          ) : (
            <>
              <div style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "right" }}>Accès aux identités non autorisé pour ce rôle.</div>
              <div style={{ overflowX: "auto", minWidth: 0 }}>
                <table style={{ width: "100%", minWidth: 620, fontSize: 14, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "var(--text-muted)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      <th style={{ padding: "0 0 10px", fontWeight: 600 }}>Compte</th>
                      <th style={{ padding: "0 0 10px", fontWeight: 600 }}>Abonné depuis</th>
                      <th style={{ padding: "0 0 10px", fontWeight: 600 }}>Cohorte</th>
                      <th style={{ padding: "0 0 10px", fontWeight: 600 }}>Parti</th>
                      <th style={{ padding: "0 0 10px", fontWeight: 600, textAlign: "right" }}>Ancienneté</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departureRows.map((r) => (
                      <tr key={r.profileId} style={{ borderTop: "1px solid var(--bordure-carte)" }}>
                        <td style={{ padding: "11px 0", fontWeight: 600 }}>compte #{r.profileId}</td>
                        <td style={{ padding: "11px 0", color: "var(--text-muted)" }}>{r.followedAtLabel}</td>
                        <td style={{ padding: "11px 0", color: "var(--text-muted)" }}>{r.cohortLabel}</td>
                        <td style={{ padding: "11px 0" }}>{r.departedLabel}</td>
                        <td style={{ padding: "11px 0", textAlign: "right", color: "var(--text-muted)" }}>{r.tenureLabel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </Card>

      <ReconciliationBanner reconciliation={reconciliation ?? null} />
    </main>
  );
}
