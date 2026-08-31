import { Card, Button } from "@/components/ds";
import { resolveBrandContext } from "@/lib/context/brand-context";
import { fr, pct, shortDate } from "@/lib/format";
import { SampleWindow } from "@/components/sample-window";
import { ReconciliationBanner } from "@/components/reconciliation-banner";

// Les segments ne sont PAS des clusters recalculés : ce sont les pics
// d'acquisition (acquisition_spikes) déjà classés par le moteur (0019,
// étape 6), regroupés par inferred_type via v_segments. Vocabulaire et
// couleurs identiques à Diagnostic/Acquisition pour ne jamais diverger.
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
// Descriptions et actions : reformulation exacte des critères de
// classification du moteur (CASE WHEN de recompute_account, étape 6), pas
// une lecture inventée par segment.
const NATURE_DESCRIPTION: Record<string, string> = {
  probable_paid: "Pics en plateau de plus de 3 jours, avec une rétention inférieure à la moyenne du compte.",
  probable_viral: "Pics courts (moins de 2 jours), avec une rétention égale ou supérieure à la moyenne du compte.",
  probable_automated:
    "Part nocturne supérieure à 45 % et signaux de comptes automatisés (suffixes numériques, tirets bas, handles longs) au moins deux fois supérieurs à la moyenne du compte.",
  indetermine: "Aucun des critères de forme, d'horaire ou de rétention n'est assez marqué pour trancher.",
};
const NATURE_ACTION: Record<string, string> = {
  probable_paid: "Rapprocher ces pics des périodes de campagne dans Acquisition pour objectiver le coût réel par abonné conservé.",
  probable_viral: "Identifier la publication ou l'événement à l'origine du pic pour tenter de le reproduire.",
  probable_automated: "Exclure ce flux des objectifs de fidélisation : il ne représente probablement pas une audience réelle.",
  indetermine: "Pas d'action recommandée sans signal supplémentaire.",
};

const RISK_TIER_LABEL: Record<number, string> = { 3: "Risque élevé", 2: "Risque moyen", 1: "Risque faible" };
const RISK_TIER_COLOR: Record<number, string> = { 3: "var(--bleu)", 2: "#A8A196", 1: "#A8A196" };

export default async function SegmentsPage({
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
          <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Les segments apparaissent après le premier import.</div>
          <Button href={`${base}/imports`}>Aller à Imports</Button>
        </div>
      </Card>
    );
  }

  const latestImportId = comparability.latest_import_id!;

  const [{ data: segments }, { data: riskRows }, { data: reconciliation }] = await Promise.all([
    supabase.from("v_segments").select("*").eq("account_id", account.id).eq("import_id", latestImportId).order("volume_total", { ascending: false }),
    supabase.from("v_recent_arrival_risk").select("*").eq("account_id", account.id).eq("import_id", latestImportId).order("risk_tier", { ascending: false }),
    supabase.from("reconciliation").select("*").eq("import_id", latestImportId).maybeSingle(),
  ]);

  const rows = segments ?? [];
  const risk = riskRows ?? [];
  const riskTotal = risk.reduce((s, r) => s + (r.n ?? 0), 0);
  const windowLabel =
    comparability.latest_window_start && comparability.latest_window_end
      ? `${shortDate(comparability.latest_window_start)} → ${shortDate(comparability.latest_window_end)}`
      : "—";

  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1280, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.01em" }}>Segments</h1>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Profils inférés à partir des pics d&apos;acquisition · {windowLabel}
        </span>
      </div>

      {comparability.is_single_import && (
        <div style={{ background: "var(--panneau)", border: "1px solid var(--bordure)", borderRadius: 18, padding: "16px 20px", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>
          Un seul import disponible pour @{account.handle}. Le regroupement par pic reste affiché, mais le taux de départ par
          segment n&apos;est pas mesurable tant qu&apos;aucun deuxième import ne permet de constater un départ — il s&apos;affichera
          après le prochain import.
        </div>
      )}
      {!comparability.is_single_import && !comparability.comparable && (
        <div style={{ background: "var(--pastel-jaune)", borderRadius: 18, padding: "16px 20px", fontSize: 14, color: "var(--encre)", lineHeight: 1.5 }}>
          Les deux derniers imports se recouvrent presque entièrement ({pct((comparability.overlap_ratio ?? 0) * 100, 0)} de
          recouvrement) : {comparability.comparability_reason}. Les chiffres ci-dessous restent affichés, à lire avec cette réserve.
        </div>
      )}

      {rows.length === 0 ? (
        <Card variant="claire" interactive={false}>
          <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>Aucun pic d&apos;acquisition détecté sur cet import — rien à segmenter.</p>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, alignItems: "start" }}>
          {rows.map((g) => {
            const days = g.window_start && g.window_end
              ? Math.max(1, (new Date(g.window_end).getTime() - new Date(g.window_start).getTime()) / 86400000 + 1)
              : null;
            const perMonth = days && g.volume_total != null ? Math.round((g.volume_total / days) * 30) : null;
            const departureRate = g.retention_rate_weighted != null ? (1 - g.retention_rate_weighted) * 100 : null;
            return (
              <Card key={g.inferred_type} variant="claire" interactive={false}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
                  <div
                    style={{
                      alignSelf: "flex-start",
                      borderRadius: 999,
                      padding: "4px 12px",
                      fontSize: 12,
                      fontWeight: 700,
                      background: NATURE_BG[g.inferred_type ?? ""] ?? "var(--creme-fonce)",
                    }}
                  >
                    segment inféré
                  </div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em" }}>
                    {NATURE_LABEL[g.inferred_type ?? ""] ?? g.inferred_type}
                  </h2>
                  <div style={{ display: "flex", gap: 20 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{perMonth != null ? `≈ ${fr(perMonth)}` : "—"}</span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>nouveaux par mois</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>
                        {comparability.is_single_import ? "—" : pct(departureRate, 1)}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>de départs mesurés</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.55, textWrap: "pretty" }}>
                    {NATURE_DESCRIPTION[g.inferred_type ?? ""] ?? ""}
                  </div>
                  <div style={{ borderTop: "1px solid var(--bordure-carte)", paddingTop: 12, fontSize: 14, fontWeight: 600, lineHeight: 1.5, textWrap: "pretty" }}>
                    {NATURE_ACTION[g.inferred_type ?? ""] ?? ""}
                  </div>
                  <div style={{ borderTop: "1px solid var(--bordure-carte)", paddingTop: 10 }}>
                    <SampleWindow n={g.volume_total} windowStart={g.window_start} windowEnd={g.window_end} confidence={g.segment_confidence} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Card variant="claire" interactive={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Risque de départ des arrivées récentes</h2>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Comptes présents arrivés dans les 30 derniers jours, classés par tercile du risque de départ mesuré à leur
              tranche d&apos;âge (courbe de risque du Diagnostic). Un classement relatif, pas un modèle de risque validé.
            </span>
          </div>
          {risk.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
              Pas assez d&apos;arrivées récentes ou de courbe de risque disponible pour ce classement.
            </p>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14 }}>
                {[3, 2, 1].map((tier) => {
                  const row = risk.find((r) => r.risk_tier === tier);
                  const n = row?.n ?? 0;
                  const share = riskTotal > 0 ? (n / riskTotal) * 100 : 0;
                  return (
                    <div key={tier} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ width: 130, fontWeight: 600 }}>{RISK_TIER_LABEL[tier]}</span>
                      <div style={{ flex: 1, height: 10, background: "var(--creme-fonce)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ width: `${share}%`, height: "100%", background: RISK_TIER_COLOR[tier] }} />
                      </div>
                      <span style={{ width: 150, textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-muted)" }}>
                        {fr(n)} comptes · {pct(share, 0)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div style={{ borderTop: "1px solid var(--bordure-carte)", paddingTop: 10 }}>
                <SampleWindow n={riskTotal} confidence="indicatif" />
              </div>
            </>
          )}
        </div>
      </Card>

      <div style={{ background: "var(--panneau)", border: "1px solid var(--bordure)", borderRadius: 18, padding: "16px 20px", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.55, textWrap: "pretty" }}>
        Ces segments décrivent les pics d&apos;acquisition détectés sur cet import, pas l&apos;ensemble de l&apos;audience :
        les arrivées progressives, sans pic, n&apos;apparaissent dans aucun segment ci-dessus.
      </div>

      <ReconciliationBanner reconciliation={reconciliation ?? null} />
    </main>
  );
}
