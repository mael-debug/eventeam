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
          Un seul import disponible pour @{account.handle}. Nouveaux, partis et revenus se calculent en comparant les deux
          derniers imports — il en faut un second pour que cet écran affiche quelque chose.
        </div>
      </main>
    );
  }

  const windowLabel =
    comparability.latest_window_start && comparability.latest_window_end
      ? `${shortDate(comparability.latest_window_start)} → ${shortDate(comparability.latest_window_end)}`
      : "—";

  const [{ data: movements }, { data: departures, count: departuresCount }, { data: reconciliation }] = await Promise.all([
    supabase.from("v_follower_movements").select("movement").eq("account_id", account.id),
    supabase
      .from("v_recent_departures")
      .select("*", { count: "exact" })
      .eq("account_id", account.id)
      .limit(DEPARTURES_SHOWN),
    supabase.from("v_reconciliation").select("*").eq("import_id", comparability.latest_import_id!).maybeSingle(),
  ]);

  const movementCounts = { nouveau: 0, toujours_la: 0, parti: 0, revenu: 0 } as Record<string, number>;
  for (const m of movements ?? []) {
    if (!m.movement) continue;
    movementCounts[m.movement] = (movementCounts[m.movement] ?? 0) + 1;
  }

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
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Comparaison avec le dernier import · abonnés {windowLabel}</span>
      </div>

      {!comparability.comparable && (
        <div style={{ background: "var(--pastel-jaune)", borderRadius: 18, padding: "16px 20px", fontSize: 14, color: "var(--encre)", lineHeight: 1.5 }}>
          Les deux derniers imports se recouvrent presque entièrement ({pct((comparability.overlap_ratio ?? 0) * 100, 0)} de
          recouvrement) : {comparability.comparability_reason}. Les chiffres ci-dessous restent affichés, à lire avec cette réserve.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        <Card variant="claire" interactive={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>Nouveaux</span>
            <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1, color: "var(--bleu)" }}>{fr(movementCounts.nouveau)}</span>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>jamais identifiés avant</span>
          </div>
        </Card>
        {movementCounts.revenu > 0 && (
          <Card variant="claire" interactive={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>Revenus</span>
              <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>{fr(movementCounts.revenu)}</span>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>absents du dernier import, déjà identifiés avant</span>
            </div>
          </Card>
        )}
        <Card variant="claire" interactive={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>Toujours là</span>
            <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>{fr(movementCounts.toujours_la)}</span>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>identifiés aux deux derniers imports</span>
          </div>
        </Card>
        <Card variant="claire" interactive={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>Partis</span>
            <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1, color: "#A8A196" }}>{fr(movementCounts.parti)}</span>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>identifiés au dernier import précédent, absents de celui-ci</span>
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
