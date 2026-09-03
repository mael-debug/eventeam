import { Card, Chip } from "@/components/ds";
import { resolveBrandContext } from "@/lib/context/brand-context";
import { fr, shortDate, signedPct } from "@/lib/format";
import { TrendLine } from "@/components/trend-line";
import {
  mockMediaInsights,
  mockAccountReachByFormat,
  mockAccountReachMonthly,
  mockAccountPeriodTotals,
  mockAudienceDemographics,
  mockMentions,
  mockCompetitors,
  mockTopCommenters,
  type MediaType,
  type TrendMetric,
} from "@/lib/analyse-mock";
import { CadenceChip } from "./cadence-chip";
import { LiveComments } from "./live-comments";

// Page Analyse — démonstration de ce que Community Intelligence pourra
// remonter du compte une fois l'API Meta branchée (accès Advanced Access +
// Facebook Login for Business). Contenu réel (légendes, vignettes, dates,
// abonnés) toujours distingué visuellement des métriques simulées
// (lib/analyse-mock.ts) : ces dernières illustrent les plages plausibles
// d'une future intégration, elles ne sont jamais mesurées aujourd'hui.
// Catalogue de référence : uniquement les champs de la doc Graph API v25.0
// validée avec le client — rien d'autre n'est montré ici.

const MEDIA_LABEL: Record<MediaType, string> = { post: "Post", reel: "Reel", story: "Story" };
const SERIES_COLOR: Record<MediaType, string> = { post: "var(--bleu)", reel: "var(--vert-logo)", story: "#8B5CF6" };

function monthLabel(month: string): string {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

function SimTag() {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--bleu)", background: "var(--bleu-bg)", borderRadius: 999, padding: "2px 8px" }}>
      Simulé
    </span>
  );
}

function SectionTitle({ n, title, cadence, subtitle }: { n: number; title: string; cadence?: React.ReactNode; subtitle?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>{n}.</span>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em" }}>{title}</h2>
        {cadence}
      </div>
      {subtitle && <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 760 }}>{subtitle}</p>}
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string | number | null }) {
  if (value == null) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{typeof value === "number" ? fr(value) : value}</span>
    </div>
  );
}

function TrendTile({ label, metric }: { label: string; metric: TrendMetric }) {
  const up = metric.deltaPct > 0;
  const flat = metric.deltaPct === 0;
  return (
    <Card variant="claire" interactive={false} style={{ padding: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em" }}>{fr(metric.value)}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: flat ? "var(--text-muted)" : up ? "var(--vert-logo)" : "var(--text-muted)" }}>
            {signedPct(metric.deltaPct, 0)}
          </span>
        </div>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>vs moyenne du mois précédent</span>
      </div>
    </Card>
  );
}

export default async function AnalysePage({
  params,
}: {
  params: Promise<{ org: string; brand: string }>;
}) {
  const { org: orgSlug, brand: brandSlug } = await params;
  const { supabase, accounts } = await resolveBrandContext(orgSlug, brandSlug);

  if (accounts.length === 0) {
    return <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Aucun compte Instagram rattaché.</p>;
  }
  const account = accounts[0];

  const [{ data: latestInsights }, { data: posts }, { data: stories }] = await Promise.all([
    supabase.from("audience_insights").select("followers_total, period_end").eq("account_id", account.id).order("period_end", { ascending: false }).limit(1).maybeSingle(),
    supabase
      .from("content")
      .select("id, media_type, published_at, caption")
      .eq("account_id", account.id)
      .in("media_type", ["post", "reel"])
      .not("caption", "is", null)
      .neq("caption", "")
      .order("published_at", { ascending: false })
      .limit(12),
    supabase
      .from("content")
      .select("id, media_type, published_at, caption")
      .eq("account_id", account.id)
      .eq("media_type", "story")
      .order("published_at", { ascending: false })
      .limit(6),
  ]);

  const followersTotal = latestInsights?.followers_total ?? 0;

  const reachByFormat = mockAccountReachByFormat(account.id, followersTotal);
  const reachMonthly = mockAccountReachMonthly(account.id, followersTotal);
  const periodTotals = mockAccountPeriodTotals(account.id, followersTotal);
  const demographics = mockAudienceDemographics(account.id, followersTotal);
  const mentions = mockMentions(account.id);
  const competitors = mockCompetitors(account.id);
  const topCommenters = mockTopCommenters(account.id);
  const postLabels = (posts ?? []).map((p) => (p.caption ?? "").slice(0, 40));

  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 44, maxWidth: 1120, minWidth: 0, paddingBottom: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: "-0.01em" }}>Analyse</h1>
        <p style={{ margin: 0, fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 780, textWrap: "pretty" }}>
          Ce que Community Intelligence pourra remonter du compte @{account.handle}, et à quelle fréquence chaque
          donnée se rafraîchit. Le contenu réel (légendes, vignettes, dates) est toujours distingué des métriques{" "}
          <SimTag /> qui illustrent une future intégration à l&apos;API Meta — jamais mesurées aujourd&apos;hui.
        </p>
      </div>

      {/* 1. En-tête compte */}
      <Card variant="claire" interactive={false}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 19, fontWeight: 800 }}>@{account.handle}</span>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Eden Park · prêt-à-porter, identité rugby</span>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>{fr(followersTotal)}</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>abonnés (réel)</span>
            </div>
          </div>
          <CadenceChip cadence="J" />
        </div>
      </Card>

      {/* 2. Vue d'ensemble */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle n={2} title="Vue d'ensemble" cadence={<CadenceChip cadence="J" />} subtitle="Indicateurs du compte sur 30 jours." />
        <div style={{ background: "var(--pastel-jaune)", borderRadius: 14, padding: "12px 16px", fontSize: 13, color: "var(--encre)", lineHeight: 1.5 }}>
          Meta ne conserve ces données que <strong>90 jours</strong> : au-delà, seul notre propre historique les garde. C&apos;est
          tout l&apos;intérêt de les archiver chez nous dès le premier jour. Et quand une donnée n&apos;existe pas, l&apos;API
          renvoie « aucune donnée », jamais un zéro — les deux ne veulent pas dire la même chose, l&apos;interface devra le
          distinguer.
        </div>
        <Card variant="claire" interactive={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Comptes touchés, par jour et par format</span>
              <SimTag />
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Possible car la métrique <code>reach</code> accepte le détail par format de contenu (posts, reels, stories).
            </span>
            <TrendLine
              labels={reachByFormat.dates.map((d) => shortDate(d))}
              series={[
                {
                  key: "total",
                  label: "Total",
                  color: "var(--gris-serie)",
                  values: reachByFormat.dates.map((_, i) => reachByFormat.post[i] + reachByFormat.reel[i] + reachByFormat.story[i]),
                },
                { key: "post", label: "Posts", color: SERIES_COLOR.post, values: reachByFormat.post },
                { key: "reel", label: "Reels", color: SERIES_COLOR.reel, values: reachByFormat.reel },
                { key: "story", label: "Stories", color: SERIES_COLOR.story, values: reachByFormat.story },
              ]}
            />
          </div>
        </Card>
        <Card variant="claire" interactive={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Tendance de la portée, sur plusieurs mois</span>
              <SimTag />
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Meta ne garde que 90 jours : cette vue longue n&apos;existe que grâce à notre propre historique, construit mois après mois.
            </span>
            <TrendLine
              labels={reachMonthly.map((p) => monthLabel(p.month))}
              series={[{ key: "reach", label: "Comptes touchés", color: "var(--bleu)", values: reachMonthly.map((p) => p.reach) }]}
            />
          </div>
        </Card>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
          {(
            [
              ["Comptes ayant interagi", periodTotals.accountsEngaged],
              ["Interactions totales", periodTotals.totalInteractions],
              ["J'aime", periodTotals.likes],
              ["Commentaires", periodTotals.comments],
              ["Partages", periodTotals.shares],
              ["Enregistrements", periodTotals.saves],
              ["Abonnements", periodTotals.follows],
              ["Désabonnements", periodTotals.unfollows],
              ["Clics sur les liens du profil", periodTotals.profileLinksTaps],
            ] as [string, TrendMetric][]
          ).map(([label, metric]) => (
            <TrendTile key={label} label={label} metric={metric} />
          ))}
        </div>
      </div>

      {/* 3. Publications */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle
          n={3}
          title="Publications"
          cadence={<CadenceChip cadence="J" />}
          subtitle="Contenu réel (légende, date) — métriques simulées en attendant l'API. Aucun insight n'existe pour les images individuelles d'un carrousel : seul l'album entier est mesuré."
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {(posts ?? []).map((p) => {
            const insights = mockMediaInsights(p.id, p.media_type as MediaType, followersTotal);
            return (
              <Card key={p.id} variant="claire" interactive={false}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
                    <span style={{ fontWeight: 700, color: "var(--encre)" }}>{shortDate(p.published_at)}</span>
                    <Chip style={{ fontSize: 11, padding: "3px 9px" }}>{MEDIA_LABEL[p.media_type as MediaType]}</Chip>
                  </div>
                  <div style={{ background: "var(--panneau)", borderRadius: 12, padding: "14px 16px", minHeight: 96, display: "flex", alignItems: "center" }}>
                    <p style={{ margin: 0, fontSize: 14, color: "var(--encre)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden", textWrap: "pretty" }}>
                      {p.caption}
                    </p>
                  </div>
                  <div style={{ borderTop: "1px solid var(--bordure-carte)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <SimTag />
                    </div>
                    <MetricRow label="Comptes touchés" value={insights.reach} />
                    <MetricRow label="Vues" value={insights.views} />
                    <MetricRow label="J'aime" value={insights.likes} />
                    <MetricRow label="Commentaires" value={insights.comments} />
                    <MetricRow label="Enregistrements" value={insights.saved} />
                    <MetricRow label="Partages" value={insights.shares} />
                    <MetricRow label="Abonnements générés" value={insights.follows} />
                    <MetricRow label="Visites de profil générées" value={insights.profileVisits} />
                    {insights.avgWatchTimeSeconds != null && <MetricRow label="Durée de visionnage moyenne" value={`${insights.avgWatchTimeSeconds} s`} />}
                    {insights.totalViews != null && (
                      <div title="Agrège Instagram + surfaces Facebook cross-postées ou boostées — Facebook Login uniquement. C'est le chiffre que le client voit dans l'app Instagram.">
                        <MetricRow label="Vues, toutes surfaces" value={insights.totalViews} />
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 4. Commentaires en direct */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle
          n={4}
          title="Commentaires en direct"
          cadence={<CadenceChip cadence="RT" />}
          subtitle="Aperçu simulé du flux temps réel : dès qu'un abonné commente, l'entrée apparaît ici sans recharger la page."
        />
        <Card variant="encre" interactive={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "rgba(250,248,243,0.85)", textWrap: "pretty" }}>
              C&apos;est la seule donnée entrante nominative de tout le périmètre : on sait qui a commenté. On ne saura
              jamais qui a mis un « j&apos;aime ».
            </p>
            <div style={{ background: "var(--surface-creme)", borderRadius: 16, padding: 16 }}>
              <LiveComments postLabels={postLabels.length > 0 ? postLabels : ["une publication"]} />
            </div>
          </div>
        </Card>
      </div>

      {/* 5. Top commentateurs */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle
          n={5}
          title="Top 50 des commentateurs"
          cadence={<CadenceChip cadence="FIGE" />}
          subtitle="En stockant chaque commentaire reçu au fil du temps (§4 ci-dessus), on peut reconstituer qui commente le plus souvent — un classement qui s'affine mois après mois, à mesure que l'historique s'accumule."
        />
        <Card variant="claire" interactive={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Classement illustratif — le vrai classement se construira à partir des commentaires réellement reçus.
              </span>
              <SimTag />
            </div>
            <div style={{ maxHeight: 480, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "2px 16px", alignContent: "start" }}>
              {topCommenters.map((c, i) => (
                <div key={c.username} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid var(--bordure-carte)" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", width: 22, flex: "0 0 22px" }}>{i + 1}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--bleu)", flex: "1 1 auto", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    @{c.username}
                    {c.verified && <span aria-label="Compte vérifié" title="Compte vérifié" style={{ marginLeft: 4, color: "var(--vert-logo)" }}>✓</span>}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 800, flex: "0 0 auto" }}>{fr(c.commentCount)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* 6. Stories */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle
          n={6}
          title="Stories"
          cadence={<CadenceChip cadence="STORY-END" />}
          subtitle="Les chiffres d'une story disparaissent 24 h après sa publication : seul le webhook, capté au bon moment, permet de les garder."
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ background: "var(--pastel-jaune)", borderRadius: 14, padding: "12px 16px", fontSize: 13, color: "var(--encre)", lineHeight: 1.5 }}>
            🇫🇷 Sur un compte français, <strong>les réponses aux stories remontent toujours à 0</strong> — une contrainte que
            Meta applique à l&apos;Europe et au Japon, pas un bug de notre côté.
          </div>
          <div style={{ background: "var(--panneau)", border: "1px solid var(--bordure)", borderRadius: 14, padding: "12px 16px", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
            Une story vue par moins de 5 personnes ne renvoie aucune donnée — l&apos;interface l&apos;affiche comme « trop
            peu de vues pour être mesuré », jamais comme un score cassé.
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {(stories ?? []).map((s) => {
            const insights = mockMediaInsights(s.id, "story", followersTotal);
            return (
              <Card key={s.id} variant="claire" interactive={false}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
                  <div
                    style={{
                      height: 168,
                      borderRadius: 12,
                      background: "linear-gradient(150deg, var(--bleu-bg), var(--pastel-violet))",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      padding: 14,
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--bleu)" }}>
                      Story · {shortDate(s.published_at)}
                    </span>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--encre)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden", textWrap: "pretty" }}>
                      {s.caption || "🎀 Story sans légende"}
                    </p>
                  </div>
                  <div style={{ borderTop: "1px solid var(--bordure-carte)", paddingTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <SimTag />
                    </div>
                    {insights.tooFewViewers ? (
                      <span style={{ fontSize: 12, fontStyle: "italic", color: "var(--text-muted)" }}>Trop peu de vues pour être mesuré</span>
                    ) : (
                      <>
                        <MetricRow label="Comptes touchés" value={insights.reach} />
                        <MetricRow label="Vues" value={insights.views} />
                        <MetricRow label="Réponses" value={0} />
                        <MetricRow label="Abonnements générés" value={insights.follows} />
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 7. Audience */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle n={7} title="Audience" cadence={<CadenceChip cadence="S" />} subtitle="Profil agrégé des abonnés — jamais attribué à une personne. Classement limité au top 45 par Meta." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          <Card variant="claire" interactive={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Top villes (sur 45 max)</span>
                <SimTag />
              </div>
              {demographics.followerCities.map((c) => (
                <div key={c.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-muted)" }}>{c.label}</span>
                  <span style={{ fontWeight: 700 }}>{fr(c.value)}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card variant="claire" interactive={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Top pays (sur 45 max)</span>
                <SimTag />
              </div>
              {demographics.followerCountries.map((c) => (
                <div key={c.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-muted)" }}>{c.label}</span>
                  <span style={{ fontWeight: 700 }}>{fr(c.value)}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card variant="claire" interactive={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Genre</span>
                <SimTag />
              </div>
              <MetricRow label="Femmes" value={`${demographics.genderSplit.femme} %`} />
              <MetricRow label="Hommes" value={`${demographics.genderSplit.homme} %`} />
              <MetricRow label="Autre" value={`${demographics.genderSplit.autre} %`} />
            </div>
          </Card>
          <Card variant="claire" interactive={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Âge</span>
                <SimTag />
              </div>
              {demographics.ageSplit.map((a) => (
                <MetricRow key={a.label} label={a.label} value={`${a.value} %`} />
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* 8. Mentions et veille */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle n={8} title="Mentions et veille" subtitle="Ce qui se dit autour de la marque, et où elle se situe face à ses concurrents." />
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16, alignItems: "start" }}>
          <Card variant="claire" interactive={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Mentions</span>
                <CadenceChip cadence="RT" />
                <SimTag />
              </div>
              {mentions.map((m, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2, borderTop: i > 0 ? "1px solid var(--bordure-carte)" : undefined, paddingTop: i > 0 ? 10 : 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>@{m.author}</span>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{m.text}</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{shortDate(m.date)}</span>
                </div>
              ))}
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Les mentions en story ne sont pas captées par Meta.</span>
            </div>
          </Card>
          <Card variant="claire" interactive={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Veille concurrentielle</span>
                <CadenceChip cadence="S" />
                <SimTag />
              </div>
              {competitors.map((c) => (
                <div key={c.username} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{fr(c.followersCount)} abonnés · {fr(c.mediaCount)} publications</span>
                </div>
              ))}
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Compteurs publics uniquement — aucun insight sur un compte qui n&apos;est pas le nôtre.
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* 9. Ce qu'on ne peut pas récupérer */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle n={9} title="Ce qu'on ne peut pas récupérer" subtitle="Pour que le périmètre soit clair dans les deux sens." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {[
            ["Qui a mis un « j'aime »", "Cette liste n'existe plus côté Meta depuis 2016."],
            ["Qui a vu une story", "Seuls des chiffres globaux existent, jamais nommément."],
            ["La liste des abonnés", "Aucune API ni webhook ne la fournit."],
            ["La date de création du compte", "Visible uniquement dans l'appli, pas via l'API."],
            ["Le détail d'une image dans un carrousel", "Seul l'album entier est mesurable."],
            ["Qui a publié un post trouvé par hashtag", "Le nom d'utilisateur n'est pas fourni dans ce cas."],
            ["Plus de 2 ans d'historique d'un contenu", "Au-delà, Meta ne conserve plus les statistiques."],
            ["Les comptes personnels", "Aucun accès, quel que soit l'outil."],
            ["Être alerté d'un nouvel abonné ou d'un départ", "Ces événements n'existent pour aucun webhook Meta."],
            ["Programmer une publication automatiquement", "Aucune fonctionnalité native ne le permet."],
          ].map(([title, text]) => (
            <div key={title} style={{ border: "1px solid var(--bordure-carte)", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 6, background: "var(--panneau)" }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{title}</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
