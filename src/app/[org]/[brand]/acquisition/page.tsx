import { Card, Badge, Button } from "@/components/ds";
import { resolveBrandContext } from "@/lib/context/brand-context";
import { fr, pct, shortDate } from "@/lib/format";
import { ReconciliationBanner } from "@/components/reconciliation-banner";
import { setSpikeBudgetAction } from "./actions";
import { CustomWindowsSection } from "./custom-windows-section";
import { qualityColor, isoWeekMonday } from "@/lib/cohort-quality";

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
const CONFIDENCE_LABEL: Record<string, string> = { robuste: "robuste", indicatif: "indicatif", insuffisant: "insuffisant" };
const CONFIDENCE_BG: Record<string, string> = {
  robuste: "var(--vert-pastel)",
  indicatif: "var(--pastel-jaune)",
  insuffisant: "var(--creme-fonce)",
};

function eur(n: number | null) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
}

function Th({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <span style={{ textDecoration: "underline dotted", textUnderlineOffset: 3, cursor: "help" }} title={title}>
      {children}
    </span>
  );
}

export default async function AcquisitionPage({
  params,
}: {
  params: Promise<{ org: string; brand: string }>;
}) {
  const { org: orgSlug, brand: brandSlug } = await params;
  const base = `/${orgSlug}/${brandSlug}`;
  const { supabase, accounts, canWriteView } = await resolveBrandContext(orgSlug, brandSlug);

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
          <div style={{ fontSize: 14, color: "var(--text-muted)" }}>La qualité d&apos;acquisition apparaît après le premier import.</div>
          <Button href={`${base}/imports`}>Aller à Imports</Button>
        </div>
      </Card>
    );
  }

  if (comparability.is_single_import) {
    return (
      <main style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1280 }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.01em" }}>Qualité d&apos;acquisition</h1>
        <div style={{ background: "var(--panneau)", border: "1px solid var(--bordure)", borderRadius: 18, padding: "16px 20px", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>
          Un seul import disponible pour @{account.handle}. La survie par cohorte et le coût réel par pic d&apos;acquisition
          nécessitent deux exports consécutifs pour établir une variation — ils apparaîtront après le deuxième import.
        </div>
      </main>
    );
  }

  const latestImportId = comparability.latest_import_id!;

  const [{ data: spikes }, { data: cohortRows }, { data: reconciliation }, { data: cohortTotals }, { data: qualityRows }] = await Promise.all([
    supabase.from("acquisition_spikes_with_budget").select("*").eq("account_id", account.id).eq("import_id", latestImportId).order("spike_start"),
    supabase
      .from("cohort_survival")
      .select("cohort_week, remaining, departed, exposure_days, horizon_days, rate_at_horizon, horizon_confidence, horizon_confidence_reason")
      .eq("account_id", account.id)
      .eq("measured_import_id", latestImportId)
      .order("cohort_week"),
    supabase.from("reconciliation").select("*").eq("import_id", latestImportId).maybeSingle(),
    supabase.from("v_cohort_totals").select("total_measurable").eq("account_id", account.id).maybeSingle(),
    // Croisement pic d'acquisition ↔ cohorte : le score de qualité de la
    // semaine (Croissance) donne un contexte au pic (arrivées massives mais
    // fragiles, ou saines) que la seule rétention du pic ne montre pas.
    supabase.from("cross_analyses").select("dimension, payload, confidence").eq("account_id", account.id).eq("code", "cohort_quality_score"),
  ]);

  const qualityByWeek = new Map((qualityRows ?? []).map((q) => [q.dimension, q]));
  const peaks = spikes ?? [];
  const priced = peaks.filter((p) => p.budget_eur != null);
  const budgetTotal = priced.reduce((s, p) => s + (p.budget_eur ?? 0), 0);
  const volTotal = priced.reduce((s, p) => s + (p.volume ?? 0), 0);
  const consTotal = priced.reduce((s, p) => s + Math.round((p.volume ?? 0) * (p.retention_rate ?? 0)), 0);
  const coutBrutTotal = volTotal > 0 ? budgetTotal / volTotal : null;
  const coutReelTotal = consTotal > 0 ? budgetTotal / consTotal : null;
  const ecart = coutBrutTotal && coutReelTotal && coutBrutTotal > 0 ? coutReelTotal / coutBrutTotal : null;

  const horizonDays = cohortRows?.find((c) => c.horizon_days != null)?.horizon_days ?? null;
  const totalMeasurable = cohortTotals?.total_measurable ?? 0;

  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1280, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.01em" }}>Qualité d&apos;acquisition</h1>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Survie des abonnés par semaine d&apos;arrivée · {fr(totalMeasurable)} comptes comparables
        </span>
      </div>

      {!comparability.comparable && (
        <div style={{ background: "var(--pastel-jaune)", borderRadius: 18, padding: "16px 20px", fontSize: 14, color: "var(--encre)", lineHeight: 1.5 }}>
          Les deux derniers imports se recouvrent presque entièrement ({pct((comparability.overlap_ratio ?? 0) * 100, 0)} de
          recouvrement) : {comparability.comparability_reason}. Les chiffres ci-dessous restent affichés, à lire avec cette réserve.
        </div>
      )}

      <Card variant="claire" interactive={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Coût réel par pic d&apos;acquisition</h2>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {horizonDays != null ? `Horizon retenu : ${horizonDays} j` : "Horizon non calculé"}
            </span>
          </div>
          <div style={{ background: "var(--panneau)", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
            Les abonnés gagnés annoncés par les Insights et les {fr(totalMeasurable)} comptes suivis par les cohortes ne décrivent pas
            la même population. Le budget se saisit donc pic par pic, et chaque pic porte son propre volume et sa propre rétention.
            Les périodes de campagne sont inférées des pics d&apos;acquisition, non confirmées.
          </div>

          {peaks.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Aucun pic d&apos;acquisition détecté sur cet import.</p>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16, alignItems: "stretch" }}>
                <div style={{ border: "1px solid var(--bordure-carte)", borderRadius: 18, padding: 18, display: "flex", flexDirection: "column", gap: 4, justifyContent: "center" }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>Budget saisi</div>
                  <div style={{ fontSize: "clamp(22px, 2.4vw, 30px)", fontWeight: 700, lineHeight: 1 }}>{eur(budgetTotal || null)}</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{fr(volTotal)} abonnés recrutés sur les pics renseignés</div>
                </div>
                <div style={{ border: "1px solid var(--bordure-carte)", borderRadius: 18, padding: 18, display: "flex", flexDirection: "column", gap: 4, justifyContent: "center" }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>Coût par abonné brut</div>
                  <div style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-muted)", lineHeight: 1 }}>
                    {eur(coutBrutTotal)}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Le chiffre habituellement présenté.</div>
                </div>
                <div style={{ background: "var(--encre)", color: "var(--surface-creme)", borderRadius: 18, padding: 22, display: "flex", flexDirection: "column", gap: 6, justifyContent: "center", minWidth: 0 }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(250,248,243,0.55)" }}>
                    Coût par abonné conservé{horizonDays != null ? ` à ${horizonDays} j` : ""}
                  </div>
                  <div style={{ fontSize: "clamp(34px, 5.2vw, 64px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, color: "var(--vert-logo)" }}>
                    {eur(coutReelTotal)}
                  </div>
                  <div style={{ fontSize: 14, color: "rgba(250,248,243,0.8)" }}>
                    {ecart != null ? `Soit ${ecart.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}× le coût affiché. ` : ""}
                    {fr(consTotal)} abonnés encore présents.
                  </div>
                </div>
              </div>

              <div style={{ overflowX: "auto", minWidth: 0 }}>
                <table style={{ width: "100%", minWidth: 900, fontSize: 14, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "var(--text-muted)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      <th style={{ padding: "0 8px 10px 0", fontWeight: 600 }}>
                        <Th title="Semaine où les arrivées ont dépassé 3× la médiane mobile des 14 jours précédents — détecté automatiquement, jamais saisi.">
                          Pic
                        </Th>
                      </th>
                      <th style={{ padding: "0 8px 10px", fontWeight: 600, textAlign: "right" }}>
                        <Th title="Nombre de comptes arrivés pendant ce pic.">Volume</Th>
                      </th>
                      <th style={{ padding: "0 8px 10px", fontWeight: 600, textAlign: "right" }}>
                        <Th title="Rapport entre le rythme d'arrivées au plus fort du pic et le rythme normal (médiane mobile) juste avant.">
                          Multiple
                        </Th>
                      </th>
                      <th style={{ padding: "0 8px 10px", fontWeight: 600, textAlign: "right" }}>
                        <Th title="Part des arrivées du pic survenues entre 0 h et 6 h, heure de Paris. Une part élevée est un indice de comptes achetés ou automatisés, pas une preuve.">
                          Part nocturne
                        </Th>
                      </th>
                      <th style={{ padding: "0 8px 10px", fontWeight: 600, textAlign: "right" }}>
                        <Th title="Part des comptes arrivés pendant ce pic encore abonnés aujourd'hui.">Rétention</Th>
                      </th>
                      <th style={{ padding: "0 8px 10px", fontWeight: 600, textAlign: "right" }}>
                        <Th title="Nombre de comptes arrivés pendant ce pic encore abonnés aujourd'hui (Volume × Rétention).">
                          Conservés
                        </Th>
                      </th>
                      <th style={{ padding: "0 8px 10px", fontWeight: 600, textAlign: "center" }}>
                        <Th title="Score de qualité (0-100) de la cohorte hebdomadaire recouvrant ce pic — voir Croissance. Un pic à fort volume mais faible score cohorte gagne des abonnés fragiles.">
                          Cohorte
                        </Th>
                      </th>
                      <th style={{ padding: "0 8px 10px", fontWeight: 600 }}>
                        <Th title="Montant dépensé pour ce pic — à saisir manuellement, l'export Instagram ne le fournit pas.">Budget</Th>
                      </th>
                      <th style={{ padding: "0 8px 10px", fontWeight: 600, textAlign: "right" }}>
                        <Th title="Budget divisé par le volume d'arrivées — le chiffre habituellement présenté par les régies publicitaires.">
                          Coût brut
                        </Th>
                      </th>
                      <th style={{ padding: "0 0 10px", fontWeight: 600, textAlign: "right" }}>
                        <Th title="Budget divisé par le nombre de comptes encore présents aujourd'hui — le coût réel de ce pic.">
                          Coût conservé
                        </Th>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {peaks.map((p) => (
                      <tr key={p.id} style={{ borderTop: "1px solid var(--bordure-carte)" }}>
                        <td style={{ padding: "12px 8px 12px 0" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <span style={{ fontWeight: 600 }}>
                              {p.spike_start ? shortDate(p.spike_start) : "—"} → {p.spike_end ? shortDate(p.spike_end) : "—"}
                            </span>
                            <span style={{ alignSelf: "flex-start", borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 700, background: (p.inferred_type && NATURE_BG[p.inferred_type]) ?? "var(--creme-fonce)" }}>
                              {(p.inferred_type && NATURE_LABEL[p.inferred_type]) ?? p.inferred_type}
                            </span>
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{(p.shape && SHAPE_LABEL[p.shape]) ?? p.shape}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 8px", textAlign: "right" }}>{fr(p.volume)}</td>
                        <td style={{ padding: "12px 8px", textAlign: "right", color: "var(--text-muted)" }}>{(p.multiple ?? 0).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}×</td>
                        <td style={{ padding: "12px 8px", textAlign: "right", color: "var(--text-muted)" }}>{pct(p.night_share, 0)}</td>
                        <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 600 }}>{pct(p.retention_rate != null ? p.retention_rate * 100 : null, 0)}</td>
                        <td style={{ padding: "12px 8px", textAlign: "right", color: "var(--text-muted)" }}>
                          {p.retention_rate != null && p.volume != null ? fr(Math.round(p.volume * p.retention_rate)) : "—"}
                        </td>
                        <td style={{ padding: "12px 8px", textAlign: "center" }}>
                          {(() => {
                            const q = p.spike_start ? qualityByWeek.get(isoWeekMonday(p.spike_start)) : undefined;
                            const score = q ? (q.payload as { score?: number })?.score : null;
                            return score != null ? (
                              <span
                                title={`Cohorte du ${isoWeekMonday(p.spike_start!)} : score ${score}/100 (confiance ${q?.confidence ?? "—"})`}
                                style={{ display: "inline-block", width: 10, height: 10, borderRadius: 999, background: qualityColor(score) }}
                              />
                            ) : (
                              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>
                            );
                          })()}
                        </td>
                        <td style={{ padding: "12px 8px" }}>
                          {canWriteView && p.spike_start ? (
                            <form
                              action={setSpikeBudgetAction.bind(null, orgSlug, brandSlug, account.id, p.spike_start)}
                              style={{ display: "flex", alignItems: "center", gap: 6 }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid var(--bordure)", background: "var(--surface-creme)", borderRadius: 10, padding: "6px 10px", width: 100 }}>
                                <input
                                  name="budget_eur"
                                  defaultValue={p.budget_eur ?? ""}
                                  placeholder="—"
                                  inputMode="decimal"
                                  style={{ border: 0, background: "transparent", outline: "none", width: "100%", minWidth: 0, fontSize: 14, fontWeight: 700, color: "var(--encre)" }}
                                />
                                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>€</span>
                              </div>
                              <button
                                type="submit"
                                style={{ border: 0, background: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "var(--bleu)", padding: "4px 2px" }}
                              >
                                OK
                              </button>
                            </form>
                          ) : (
                            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>saisie réservée à l&apos;agence</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 8px", textAlign: "right", color: "var(--text-muted)" }}>{eur(p.cout_brut_eur)}</td>
                        <td style={{ padding: "12px 0", textAlign: "right", fontWeight: 700 }}>{eur(p.cout_retenu_eur)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </Card>

      <CustomWindowsSection supabase={supabase} orgSlug={orgSlug} brandSlug={brandSlug} accountId={account.id} canWriteView={canWriteView} />

      <Card variant="claire" interactive={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Survie par cohorte d&apos;arrivée</h2>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Taux de départ observé, et survie ramenée à l&apos;horizon commun{horizonDays != null ? ` (${horizonDays} j)` : ""} calculée par le moteur.
            </span>
          </div>

          <div style={{ background: "var(--vert-pastel)", borderRadius: 14, padding: "12px 16px", fontSize: 13, color: "var(--bleu)", lineHeight: 1.5, textWrap: "pretty" }}>
            Chaque ligne suit les comptes arrivés la même semaine. Deux chiffres, pas un seul, parce qu&apos;ils ne mesurent pas la
            même chose : <strong>« Taux de départ observé »</strong> est le % déjà parti aujourd&apos;hui — mais une cohorte
            récente a eu moins de temps pour partir, ce qui l&apos;avantage injustement face à une cohorte ancienne. <strong>«
            Survie à l&apos;horizon »</strong> corrige ce biais en ne regardant que les {horizonDays ?? "…"} premiers jours de
            chaque cohorte, pour toutes : c&apos;est la seule des deux colonnes vraiment comparable d&apos;une semaine à l&apos;autre.
          </div>

          {(cohortRows ?? []).length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Pas encore de cohorte mesurable — il faut deux imports consécutifs.</p>
          ) : (
            <div style={{ overflowX: "auto", minWidth: 0 }}>
              <table style={{ width: "100%", minWidth: 620, fontSize: 14, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "var(--text-muted)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    <th style={{ padding: "0 0 10px", fontWeight: 600 }}>Semaine</th>
                    <th style={{ padding: "0 8px 10px", fontWeight: 600, textAlign: "right" }}>Effectif</th>
                    <th style={{ padding: "0 8px 10px", fontWeight: 600, textAlign: "right" }}>Partis</th>
                    <th style={{ padding: "0 8px 10px", fontWeight: 600, textAlign: "right" }}>Taux de départ observé</th>
                    <th style={{ padding: "0 8px 10px", fontWeight: 600 }}>Survie à l&apos;horizon</th>
                    <th style={{ padding: "0 0 10px", fontWeight: 600, textAlign: "right" }}>Exposition</th>
                  </tr>
                </thead>
                <tbody>
                  {(cohortRows ?? []).map((c) => {
                    const n = c.remaining + c.departed;
                    const brut = n > 0 ? (c.departed / n) * 100 : null;
                    const insuff = c.horizon_confidence === "insuffisant";
                    return (
                      <tr key={c.cohort_week} style={{ borderTop: "1px solid var(--bordure-carte)" }}>
                        <td style={{ padding: "11px 0", fontWeight: 600 }}>
                          {shortDate(c.cohort_week)}
                          {insuff && (
                            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", lineHeight: 1.4 }}>
                              Insuffisant — {c.horizon_confidence_reason ?? "exposition trop courte"}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "11px 8px", textAlign: "right" }}>{fr(n)}</td>
                        <td style={{ padding: "11px 8px", textAlign: "right" }}>{fr(c.departed)}</td>
                        <td style={{ padding: "11px 8px", textAlign: "right", color: "var(--text-muted)" }}>{pct(brut)}</td>
                        <td style={{ padding: "11px 8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ flex: 1, height: 6, background: "var(--creme-fonce)", borderRadius: 999, overflow: "hidden" }}>
                              <div
                                style={{
                                  width: c.rate_at_horizon != null ? `${Math.min(100, c.rate_at_horizon * 100)}%` : "0%",
                                  height: "100%",
                                  background: CONFIDENCE_BG[c.horizon_confidence ?? ""] ?? "var(--bleu)",
                                }}
                              />
                            </div>
                            <span style={{ width: 52, textAlign: "right", fontWeight: 700 }}>
                              {c.rate_at_horizon != null ? pct(c.rate_at_horizon * 100, 0) : "—"}
                            </span>
                          </div>
                          {c.horizon_confidence && (
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                              confiance {CONFIDENCE_LABEL[c.horizon_confidence] ?? c.horizon_confidence}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "11px 0", textAlign: "right", color: "var(--text-muted)" }}>{c.exposure_days} j</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
            La survie à l&apos;horizon est calculée par le moteur à partir de la distribution réelle des départs par âge
            d&apos;abonnement. Aucune valeur n&apos;est extrapolée au-delà de la dernière observation.
          </div>
        </div>
      </Card>

      <ReconciliationBanner reconciliation={reconciliation ?? null} />
    </main>
  );
}
