import { Card, Chip, Button } from "@/components/ds";
import { Input } from "@/components/ui/input";
import { resolveBrandContext } from "@/lib/context/brand-context";
import { fr, signedFr, pct, shortDate, signedPct } from "@/lib/format";
import { TrendLine } from "@/components/trend-line";
import { createInstagramAccountAction } from "../actions";
import {
  mockMediaInsights,
  mockAccountReachSeries,
  mockAccountReachTotalsByFormat,
  mockAccountReachMonthly,
  mockAccountPeriodTotals,
  mockAudienceDemographics,
  mockEngagedAudienceDemographics,
  mockMentions,
  mockCompetitors,
  mockTopCommenters,
  mockFollowerMovementsExample,
  withLiveFallback,
  notWiredYet,
  GRAPH_VERSION,
  type MediaType,
  type TrendMetric,
  type DemographicRow,
} from "@/lib/analyse-mock";
import { CadenceChip } from "./cadence-chip";
import { LiveComments } from "./live-comments";

// Page "Import / API" — fusion (2026-09-08) des anciens écrans Vue
// d'ensemble, Audience, Croissance, Contenu et Écosystème (tous supprimés)
// avec la page Analyse : un seul endroit pour comprendre le compte. Deux
// piliers, dans cet ordre :
//   1-2. Ce que l'export mensuel donne aujourd'hui — KPIs, réconciliation
//        face aux chiffres Meta, et un exemple de suivi nominatif (qui est
//        nouveau, revenu, ou parti) construit uniquement en comparant les
//        deux derniers imports de follower_observations. Aucune autre
//        donnée de l'export n'est montrée ici : les anciens écrans Audience/
//        Contenu/Écosystème s'appuyaient sur des tables (audience_geo,
//        content_metrics, v_ecosystem_chat_summary...) qui ne sont plus
//        affichées nulle part dans l'app — l'import ne sert plus qu'à ce
//        comparatif présent/absent.
//   3-10. Ce que l'API Instagram (une fois branchée) ajoutera — uniquement
//        les métriques réellement récupérables, pour que chaque appel passe
//        du premier coup. Toute métrique absente du catalogue vérifié
//        n'apparaît nulle part ici — pas de tiret, pas de placeholder : la
//        ligne disparaît. Chaque section garde un commentaire d'en-tête
//        donnant l'endpoint, la ou les métriques, le breakdown, le
//        metric_type, le nombre d'appels et la fraîcheur réelle (jamais
//        "chaque nuit" quand Meta autorise un retard jusqu'à 48 h).
//
// Cadre du projet : solution propriétaire mono-client pour Eden Park, un
// seul compte Instagram suivi, voie Instagram API with Facebook Login
// (host graph.facebook.com, version {GRAPH_VERSION} — voir la constante
// exportée par lib/analyse-mock.ts, seule source de vérité pour ce numéro).
// Les utilisateurs Eden Park se connectent à l'app via Supabase, jamais
// auprès de Meta ; un seul jeton, autorisé une fois par une personne ayant
// un rôle sur la Page, stocké côté serveur. L'app Meta reste en mode
// développement pour ce seul compte.
//
// Chaque section du second pilier tente l'appel réel (aujourd'hui un stub
// qui échoue systématiquement, voir withLiveFallback/notWiredYet dans
// analyse-mock.ts) et retombe sur le mock en cas d'échec — c'est le même
// mécanisme qu'en production le jour où un appel échouera pour de vraies
// raisons (jeton expiré, limite de débit, panne Meta). Le badge "Simulé" à
// côté d'une cadence signale ce repli ; aujourd'hui il apparaît partout
// puisque rien n'est encore branché.
const MEDIA_LABEL: Record<MediaType, string> = { post: "Post", reel: "Reel", story: "Story" };
const SERIES_COLOR: Record<MediaType, string> = { post: "var(--bleu)", reel: "var(--vert-logo)", story: "#8B5CF6" };

function monthLabel(month: string): string {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
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

function BreakdownList({ rows }: { rows: DemographicRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1, paddingLeft: 10 }}>
      {rows.map((row) => (
        <div key={row.label} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 11, color: "var(--text-muted)" }}>
          <span>↳ {row.label}</span>
          <span style={{ fontWeight: 600 }}>{fr(row.value)}</span>
        </div>
      ))}
    </div>
  );
}

// Information interne (équipe technique), pas destinée au client : un
// simple "i" au survol, jamais du texte affiché en direct sur la page.
// Appel exécuté et rejoué contre de vraies données (08/09/2026) vs appel
// jamais tenté sur ce compte : cette page distingue les deux en interne
// plutôt que de présenter une capacité documentée comme équivalente à une
// capacité éprouvée. Ne retire rien — signale, discrètement.
function UnverifiedNote({ callToTest }: { callToTest: string }) {
  return (
    <span
      title={`Non vérifié contre l'API — jamais rejoué en conditions réelles sur ce compte, à tester avant mise en prod : ${callToTest}`}
      aria-label={`Information interne, non vérifié contre l'API : ${callToTest}`}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto",
        width: 15, height: 15, borderRadius: "50%", border: "1px solid var(--bordure)",
        color: "var(--text-muted)", fontSize: 10, fontWeight: 700, fontStyle: "italic",
        cursor: "help", lineHeight: 1,
      }}
    >
      i
    </span>
  );
}

// Reflète withLiveFallback : "live" ne s'affiche jamais (rien à signaler),
// "mock" affiche un petit badge dont le survol donne la raison exacte du
// repli (aujourd'hui, systématiquement "non branché").
function LiveSourceTag({ source, reason }: { source: "live" | "mock"; reason: string | null }) {
  if (source === "live") return null;
  return (
    <span
      title={reason ?? undefined}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
        textTransform: "uppercase", color: "var(--text-muted)", background: "var(--panneau)", border: "1px solid var(--bordure)",
        borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap",
      }}
    >
      🔧 Simulé
    </span>
  );
}

// Composition radiale "Aller plus loin" — un noyau (Community Intelligence),
// un satellite connecté (Instagram, plein, trait plein) et six satellites à
// venir (pointillés) répartis sur le reste du cercle. Géométrie calculée en
// pixels (viewBox fixe, pas de mise à l'échelle fluide) : le cercle de
// guidage et les traits de liaison sont un <svg> superposé, le noyau et
// chaque satellite sont des <div> positionnés en absolute aux mêmes
// coordonnées — plus simple à centrer (logo + libellé) que du texte SVG.
// Logos en <img> vers public/logos/ (pas d'inline SVG) : plus simple, mais
// leur fill="currentColor" ne s'applique alors qu'au contexte du document
// SVG chargé isolément (donc noir), jamais à la couleur du satellite —
// attendu, pas un bug.
const RADIAL_SIZE = 480;
const RADIAL_CENTER = RADIAL_SIZE / 2;
const RADIAL_ORBIT = 185;
const RADIAL_CORE_R = 75;
const RADIAL_SAT_R = 48;

const RADIAL_SATELLITES: { angle: number; slug: string; label: string }[] = [
  { angle: 51, slug: "shopify", label: "Shopify" },
  { angle: 103, slug: "google-analytics", label: "Google Analytics" },
  { angle: 154, slug: "brevo", label: "Brevo" },
  { angle: 206, slug: "manychat", label: "ManyChat" },
  { angle: 257, slug: "facebook", label: "Facebook" },
  { angle: 309, slug: "database", label: "Base de données" },
];

function radialPolar(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: RADIAL_CENTER + radius * Math.sin(rad), y: RADIAL_CENTER - radius * Math.cos(rad) };
}

function SourcesRadialDiagram() {
  const igCenter = radialPolar(0, RADIAL_ORBIT);
  const igLineStart = radialPolar(0, RADIAL_CORE_R);
  const igLineEnd = radialPolar(0, RADIAL_ORBIT - RADIAL_SAT_R);
  const igMid = radialPolar(0, (RADIAL_CORE_R + RADIAL_ORBIT - RADIAL_SAT_R) / 2);

  return (
    <div style={{ overflowX: "auto", minWidth: 0, padding: "8px 4px" }}>
      <div style={{ position: "relative", width: RADIAL_SIZE, height: RADIAL_SIZE, margin: "0 auto" }}>
        <svg viewBox={`0 0 ${RADIAL_SIZE} ${RADIAL_SIZE}`} width={RADIAL_SIZE} height={RADIAL_SIZE} style={{ position: "absolute", inset: 0 }}>
          <circle cx={RADIAL_CENTER} cy={RADIAL_CENTER} r={RADIAL_ORBIT} fill="none" stroke="var(--bordure)" strokeWidth={1} strokeDasharray="2 7" opacity={0.6} />
          {RADIAL_SATELLITES.map((s) => {
            const from = radialPolar(s.angle, RADIAL_CORE_R);
            const to = radialPolar(s.angle, RADIAL_ORBIT - RADIAL_SAT_R);
            return <line key={s.slug} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="var(--bordure)" strokeWidth={1} strokeDasharray="3 5" />;
          })}
          <line x1={igLineStart.x} y1={igLineStart.y} x2={igLineEnd.x} y2={igLineEnd.y} stroke="var(--bleu)" strokeWidth={2} />
          <circle cx={igMid.x} cy={igMid.y} r={4} fill="var(--bleu)" />
        </svg>

        <div
          style={{
            position: "absolute", left: RADIAL_CENTER - RADIAL_CORE_R, top: RADIAL_CENTER - RADIAL_CORE_R,
            width: RADIAL_CORE_R * 2, height: RADIAL_CORE_R * 2, borderRadius: "50%", background: "var(--bleu)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 3, padding: 12,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 800, color: "var(--surface-creme)", lineHeight: 1.25 }}>Community Intelligence</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(250,248,243,0.75)" }}>Le socle central</span>
        </div>

        <div
          style={{
            position: "absolute", left: igCenter.x - RADIAL_SAT_R, top: igCenter.y - RADIAL_SAT_R,
            width: RADIAL_SAT_R * 2, height: RADIAL_SAT_R * 2, borderRadius: "50%", background: "var(--bleu-bg)",
            border: "2px solid var(--bleu)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: 6,
          }}
        >
          <img src="/logos/instagram.svg" alt="" width={32} height={32} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--encre)" }}>Instagram</span>
          <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--bleu)" }}>Connecté</span>
        </div>

        {RADIAL_SATELLITES.map((s) => {
          const c = radialPolar(s.angle, RADIAL_ORBIT);
          return (
            <div
              key={s.slug}
              style={{
                position: "absolute", left: c.x - RADIAL_SAT_R, top: c.y - RADIAL_SAT_R,
                width: RADIAL_SAT_R * 2, height: RADIAL_SAT_R * 2, borderRadius: "50%", background: "var(--panneau)",
                border: "1.5px dashed var(--bordure)", opacity: 0.85,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: 6,
              }}
            >
              <img src={`/logos/${s.slug}.svg`} alt="" width={32} height={32} />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.25 }}>{s.label}</span>
            </div>
          );
        })}
      </div>
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

function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card variant="claire" interactive={false}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</div>
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

export default async function AnalysePage({
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

  const { data: comparability } = await supabase.from("import_comparability").select("*").eq("account_id", account.id).maybeSingle();

  if (!comparability) {
    return (
      <main style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 480 }}>
        <Card variant="claire" interactive={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 19, fontWeight: 800 }}>Aucun import traité pour @{account.handle}</div>
            <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
              Déposez un premier export Meta pour faire apparaître cette page.
            </div>
            <Button href={`${base}/imports`}>Aller à Imports</Button>
          </div>
        </Card>
      </main>
    );
  }

  const hasComparison = !comparability.is_single_import;

  const [{ data: overview }, { count: identifiedCount }, { data: reconciliation }, { data: posts }, { data: stories }] = await Promise.all([
    supabase.from("v_overview").select("*").eq("account_id", account.id).maybeSingle(),
    // identifiedCount : profils présents dans le dernier import
    // (follower_observations, 2026-09-08 : remplace follower_states,
    // supprimée avec toute la logique d'épisodes — cf. migration 0058).
    supabase.from("follower_observations").select("*", { count: "exact", head: true }).eq("account_id", account.id).eq("import_id", comparability.latest_import_id!),
    supabase.from("v_reconciliation").select("*").eq("import_id", comparability.latest_import_id!).maybeSingle(),
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

  // Dès qu'il y a un import précédent, nos propres arrivées/départs
  // (comparaison directe des deux exports) sont plus fiables que le
  // rapport Meta (dont la fraîcheur n'est pas garantie) — jamais l'inverse.
  const ownNet = hasComparison && reconciliation ? (reconciliation.observed_arrivals ?? 0) - (reconciliation.observed_departures ?? 0) : null;

  const windowLabel =
    overview?.window_start && overview?.window_end ? `${shortDate(overview.window_start)} → ${shortDate(overview.window_end)}` : "—";
  const insightsLabel =
    overview?.insights_period_start && overview?.insights_period_end
      ? `${shortDate(overview.insights_period_start)} → ${shortDate(overview.insights_period_end)}`
      : "—";

  const followersTotal = overview?.followers_total ?? 0;
  const postLabels = (posts ?? []).map((p) => (p.caption ?? "").slice(0, 40));

  // Suivi nominatif : la mécanique (comparaison des deux derniers imports —
  // v_follower_movements/v_recent_departures/v_recent_arrivals) est réelle et
  // déjà active en base, mais l'exemple affiché ici utilise des comptes
  // fictifs (mockFollowerMovementsExample) : un tableau à noms inventés se
  // lit mieux, en démo, qu'un tableau clairsemé sur un compte réel où peu de
  // mouvements ont été identifiés récemment.
  const movementsExample = mockFollowerMovementsExample(account.id, followersTotal);

  // Chaque source du second pilier tente l'appel réel (stub qui échoue
  // systématiquement, rien n'étant branché) et retombe sur le mock — voir
  // withLiveFallback.
  const [
    reachDailyResult, reachTotalsResult, reachMonthlyResult, periodTotalsResult,
    demographicsResult, engagedAudienceResult, mentionsResult, competitorsResult,
    topCommentersResult, postInsightsResult, storyInsightsResult,
  ] = await Promise.all([
    withLiveFallback(() => notWiredYet("GET /{ig-user-id}/insights?metric=reach&metric_type=time_series&since&until"), () => mockAccountReachSeries(account.id, followersTotal)),
    withLiveFallback(() => notWiredYet("GET /{ig-user-id}/insights?metric=reach&metric_type=total_value&breakdown=media_product_type"), () => mockAccountReachTotalsByFormat(account.id, followersTotal)),
    withLiveFallback(() => notWiredYet("archive interne (aucun appel Meta direct, >90 jours)"), () => mockAccountReachMonthly(account.id, followersTotal)),
    withLiveFallback(() => notWiredYet("GET /{ig-user-id}/insights?metric=accounts_engaged,total_interactions,likes,comments,shares,saves + follows_and_unfollows + profile_links_taps"), () => mockAccountPeriodTotals(account.id, followersTotal)),
    withLiveFallback(() => notWiredYet("GET /{ig-user-id}/insights?metric=follower_demographics&breakdown=city|country|gender|age"), () => mockAudienceDemographics(account.id, followersTotal)),
    withLiveFallback(() => notWiredYet("GET /{ig-user-id}/insights?metric=engaged_audience_demographics&breakdown=city"), () => mockEngagedAudienceDemographics(account.id, followersTotal)),
    withLiveFallback(() => notWiredYet("GET /{ig-user-id}/tags + webhook mentions"), () => mockMentions(account.id)),
    withLiveFallback(() => notWiredYet("GET /{ig-user-id}?fields=business_discovery"), () => mockCompetitors(account.id)),
    withLiveFallback(() => notWiredYet("webhook comments (accumulation nominative)"), () => mockTopCommenters(account.id)),
    withLiveFallback(() => notWiredYet("GET /{media-id}/insights (par publication)"), () => (posts ?? []).map((p) => mockMediaInsights(p.id, p.media_type as MediaType, followersTotal))),
    withLiveFallback(() => notWiredYet("GET /{media-id}/insights (par story)"), () => (stories ?? []).map((s) => mockMediaInsights(s.id, "story", followersTotal))),
  ]);

  const reachDaily = reachDailyResult.data;
  const reachTotalsByFormat = reachTotalsResult.data;
  const reachMonthly = reachMonthlyResult.data;
  const periodTotals = periodTotalsResult.data;
  const demographics = demographicsResult.data;
  const engagedAudience = engagedAudienceResult.data;
  const mentions = mentionsResult.data;
  const competitors = competitorsResult.data;
  const topCommenters = topCommentersResult.data;
  const postInsightsList = postInsightsResult.data;
  const storyInsightsList = storyInsightsResult.data;

  const genderReported = demographics.genderSplit.female + demographics.genderSplit.male;
  const genderMeasured = genderReported + demographics.genderSplit.unspecified;
  const unspecifiedPct = genderMeasured > 0 ? (demographics.genderSplit.unspecified / genderMeasured) * 100 : 0;

  // Deux populations distinctes (follower_demographics vs
  // engaged_audience_demographics) : une ville qui apparaît côté audience
  // touchée sans apparaître côté abonnés est un signal d'expansion, pas un
  // sous-ensemble des abonnés — voir le commentaire d'en-tête de la
  // section "8. Audience Instagram".
  const followerCityLabels = new Set(demographics.followerCities.map((c) => c.label));
  const newEngagedCities = engagedAudience.ok ? engagedAudience.rows.filter((c) => !followerCityLabels.has(c.label)) : [];

  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 44, maxWidth: 1120, minWidth: 0, paddingBottom: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: "-0.01em" }}>Import / API</h1>
        <p style={{ margin: 0, fontSize: 15, color: "var(--text-muted)" }}>Tout ce qu&apos;on sait sur @{account.handle}, en deux temps.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 620 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15 }}>
            <span aria-hidden style={{ color: "var(--vert-logo)", fontWeight: 800 }}>✓</span>
            Déjà actif — qui reste, qui part, qui revient, à partir des exports mensuels.
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15 }}>
            <span aria-hidden style={{ color: "var(--bleu)", fontWeight: 800 }}>→</span>
            À venir — les métriques Instagram en direct, une fois l&apos;API branchée.
            <UnverifiedNote callToTest={`Aucune de ces métriques n'est encore récupérée en direct — chaque appel est documenté et confirmé contre la doc Graph API Meta (${GRAPH_VERSION}), mais le jeton n'est pas encore branché.`} />
          </span>
        </div>
      </div>

      {/* 1. Aperçu du compte
          v_overview (abonnés, croissance nette, part organique — calculés à
          partir de audience_insights + follower_observations), v_reconciliation
          (couverture nommée face aux chiffres Meta). Donnée réelle (import),
          pas de repli mock ici. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
          <span style={{ fontSize: 19, fontWeight: 800 }}>@{account.handle}</span>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Eden Park · prêt-à-porter, identité rugby</span>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            abonnés {windowLabel} · Insights {insightsLabel}
          </span>
        </div>

        {comparability.is_single_import && (
          <div style={{ background: "var(--panneau)", border: "1px solid var(--bordure)", borderRadius: 18, padding: "16px 20px", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>
            Un seul import disponible pour @{account.handle}. Les nouveaux/partis identifiés individuellement restent
            indisponibles tant qu&apos;un deuxième import n&apos;a pas été traité — il faut deux exports consécutifs
            pour établir une variation.
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
            sub={
              hasComparison && reconciliation?.observed_arrivals != null
                ? `abonnés ${windowLabel} · ${fr(identifiedCount ?? null)} identifiés individuellement (+${fr(reconciliation.observed_arrivals)} depuis le dernier import)`
                : `abonnés ${windowLabel} · ${fr(identifiedCount ?? null)} identifiés individuellement`
            }
          />
          <KpiCard
            label="Croissance nette"
            value={hasComparison ? signedFr(ownNet) : signedFr(overview?.followers_net ?? null)}
            sub={
              hasComparison
                ? `${fr(reconciliation?.observed_arrivals ?? null)} identifiés en plus · ${fr(reconciliation?.observed_departures ?? null)} identifiés partis · depuis le dernier import`
                : `${fr(overview?.followers_gained ?? null)} gagnés · ${fr(overview?.followers_lost ?? null)} perdus (rapport Meta) · Insights ${insightsLabel}`
            }
          />
          <KpiCard
            label="Part organique"
            value={pct(overview?.organic_share != null ? overview.organic_share * 100 : null)}
            sub={`${fr(overview?.organic_gained ?? null)} sur ${fr(overview?.followers_gained ?? null)} · Insights ${insightsLabel}`}
          />
        </div>
      </div>

      {/* 2. Suivi nominatif
          La mécanique (v_follower_movements, v_recent_departures,
          v_recent_arrivals — comparaison directe des deux derniers imports
          de follower_observations, sans aucune table à maintenir) est réelle
          et déjà active en base ; c'est désormais le SEUL usage de l'import
          dans l'app. L'exemple ci-dessous, en revanche, utilise des comptes
          fictifs (mockFollowerMovementsExample, lib/analyse-mock.ts) : un
          tableau à noms inventés se lit mieux, en démo, qu'un tableau
          clairsemé sur un compte réel où peu de mouvements ont été
          identifiés récemment. Aucun mécanisme de révélation ici — ces
          identités sont déjà fictives. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle
          n={2}
          title="Suivi nominatif"
          subtitle="Qui est nouveau, qui est revenu, qui est parti — en comparant les deux derniers imports."
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Exemple ci-dessous à comptes fictifs — la mécanique de comparaison, elle, est bien réelle.</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          <Card variant="claire" interactive={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>Nouveaux</span>
              <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1, color: "var(--bleu)" }}>{fr(movementsExample.counts.nouveau)}</span>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>jamais identifiés avant</span>
            </div>
          </Card>
          {movementsExample.counts.revenu > 0 && (
            <Card variant="claire" interactive={false}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>Revenus</span>
                <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>{fr(movementsExample.counts.revenu)}</span>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>partis, puis réabonnés</span>
              </div>
            </Card>
          )}
          <Card variant="claire" interactive={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>Toujours là</span>
              <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>{fr(movementsExample.counts.toujoursLa)}</span>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>identifiés aux deux derniers imports</span>
            </div>
          </Card>
          <Card variant="claire" interactive={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>Partis</span>
              <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1, color: "#A8A196" }}>{fr(movementsExample.counts.parti)}</span>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>absents du dernier import</span>
            </div>
          </Card>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16 }}>
          <Card variant="claire" interactive={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Derniers nouveaux et revenus</h3>
              <div style={{ overflowX: "auto", minWidth: 0 }}>
                <table style={{ width: "100%", minWidth: 420, fontSize: 14, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "var(--text-muted)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      <th style={{ padding: "0 0 10px", fontWeight: 600 }}>Compte</th>
                      <th style={{ padding: "0 0 10px", fontWeight: 600 }}>Mouvement</th>
                      <th style={{ padding: "0 0 10px", fontWeight: 600, textAlign: "right" }}>Abonné depuis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movementsExample.arrivals.map((a) => (
                      <tr key={a.username} style={{ borderTop: "1px solid var(--bordure-carte)" }}>
                        <td style={{ padding: "11px 0", fontWeight: 600 }}>
                          @{a.username}
                          {a.verified && <span aria-label="Compte vérifié" title="Compte vérifié" style={{ marginLeft: 4, color: "var(--vert-logo)" }}>✓</span>}
                        </td>
                        <td style={{ padding: "11px 0" }}>{a.movement === "revenu" ? "Revenu" : "Nouveau"}</td>
                        <td style={{ padding: "11px 0", textAlign: "right", color: "var(--text-muted)" }}>{shortDate(a.followedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          <Card variant="claire" interactive={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Derniers départs</h3>
              <div style={{ overflowX: "auto", minWidth: 0 }}>
                <table style={{ width: "100%", minWidth: 420, fontSize: 14, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "var(--text-muted)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      <th style={{ padding: "0 0 10px", fontWeight: 600 }}>Compte</th>
                      <th style={{ padding: "0 0 10px", fontWeight: 600 }}>Ancienneté</th>
                      <th style={{ padding: "0 0 10px", fontWeight: 600, textAlign: "right" }}>Parti le</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movementsExample.departures.map((d) => (
                      <tr key={d.username} style={{ borderTop: "1px solid var(--bordure-carte)" }}>
                        <td style={{ padding: "11px 0", fontWeight: 600 }}>
                          @{d.username}
                          {d.verified && <span aria-label="Compte vérifié" title="Compte vérifié" style={{ marginLeft: 4, color: "var(--vert-logo)" }}>✓</span>}
                        </td>
                        <td style={{ padding: "11px 0", color: "var(--text-muted)" }}>{d.tenureDays} j</td>
                        <td style={{ padding: "11px 0", textAlign: "right", color: "var(--text-muted)" }}>{shortDate(d.windowEnd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 3. Vue d'ensemble
          GET /{ig-user-id}/insights — 5 appels, VÉRIFIÉS le 08/09/2026 sauf
          mention contraire :
          (1) reach, metric_type=time_series, period=day, SANS breakdown —
              since ET until en timestamps Unix OBLIGATOIRES (sans eux,
              seulement 2 points sur une fenêtre 24 h par défaut ; avec eux,
              30 points exacts en un seul appel, pas de pagination). end_time
              revient à 07:00:00+0000 sur tous les points, pas minuit UTC :
              le fuseau du compte fixe la journée. Les jours sans activité
              sont présents à 0, la série ne saute aucun jour.
          (2) reach, metric_type=total_value, breakdown=media_product_type,
              même fenêtre → un total par format, pas une série quotidienne
              (confirmé : time_series et breakdown sont exclusifs dans la
              même réponse).
          (3) accounts_engaged/total_interactions/likes/comments/shares/
              saves, metric_type=total_value, aucun breakdown.
          (4) follows_and_unfollows, breakdown=follow_type, ≥100 abonnés.
          (5) profile_links_taps, breakdown=contact_button_type — NON
              VÉRIFIÉ CONTRE L'API. Peut ne renvoyer aucune donnée (profil
              sans bouton de contact configuré), auquel cas la vignette et
              son détail disparaissent plutôt que d'afficher un compte à 0.
              Ne couvre PAS le clic sur le lien en bio (voir section 4,
              profile_activity) : deux métriques distinctes, jamais
              additionnées.
          Le breakdown est gratuit (même appel que la métrique seule), mais
          chaque métrique avec breakdown doit rester isolée dans sa propre
          requête : la mélanger à une métrique qui n'en a pas renvoie un
          générique "An unknown error has occurred" sans préciser laquelle.
          Parseur commun aux cinq formes de réponse observées : voir
          lib/analyse-mock.ts (parseInsightsBreakdown/SimpleValue/
          MediaSimpleValue/TimeSeries). */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle n={3} title="Vue d'ensemble Instagram" cadence={<CadenceChip cadence="J" />} subtitle="Indicateurs du compte sur 30 jours." />
        <div style={{ background: "var(--pastel-jaune)", borderRadius: 14, padding: "12px 16px", fontSize: 13, color: "var(--encre)", lineHeight: 1.5 }}>
          Meta ne garde que <strong>90 jours</strong> d&apos;historique — on l&apos;archive chez nous dès le premier jour pour ne rien perdre.
        </div>
        <Card variant="claire" interactive={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Comptes touchés, chaque jour</span>
              <LiveSourceTag source={reachDailyResult.source} reason={reachDailyResult.reason} />
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Courbe globale, tous formats confondus. Le détail par format est juste en dessous.
            </span>
            <TrendLine
              labels={reachDaily.map((p) => shortDate(p.date))}
              series={[{ key: "reach", label: "Comptes touchés", color: "var(--bleu)", values: reachDaily.map((p) => p.reach) }]}
            />
          </div>
        </Card>
        <Card variant="claire" interactive={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Comptes touchés, total par format sur la période</span>
              <LiveSourceTag source={reachTotalsResult.source} reason={reachTotalsResult.reason} />
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Répartition par format sur les 30 derniers jours.
            </span>
            <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
              {(["post", "reel", "story"] as MediaType[])
                .filter((type) => reachTotalsByFormat[type] != null)
                .map((type) => (
                  <div key={type} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: SERIES_COLOR[type] }} />
                      {MEDIA_LABEL[type]}
                    </span>
                    <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>{fr(reachTotalsByFormat[type])}</span>
                  </div>
                ))}
            </div>
          </div>
        </Card>
        <Card variant="claire" interactive={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Tendance de la portée, sur plusieurs mois</span>
              <UnverifiedNote callToTest="infaisable en un seul appel — nécessite d'archiver nos propres relevés de GET /{ig-user-id}/insights?metric=reach&period=day dans le temps" />
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Vue longue durée, construite mois après mois grâce à notre propre historique.
            </span>
            <TrendLine
              labels={reachMonthly.map((p) => monthLabel(p.month))}
              series={[{ key: "reach", label: "Comptes touchés", color: "var(--bleu)", values: reachMonthly.map((p) => p.reach) }]}
            />
          </div>
        </Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LiveSourceTag source={periodTotalsResult.source} reason={periodTotalsResult.reason} />
        </div>
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
            ] as [string, TrendMetric | null][]
          )
            .filter((entry): entry is [string, TrendMetric] => entry[1] != null)
            .map(([label, metric]) => (
              <TrendTile key={label} label={label} metric={metric} />
            ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 760 }}>
          <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
            Un « désabonnement » regroupe aussi les comptes supprimés ou désactivés — Meta ne distingue pas les deux.
          </p>
          {periodTotals.profileLinksTaps != null && (
            <div>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Clics sur les liens du profil, par type de bouton :</span>
              <BreakdownList rows={periodTotals.profileLinksTapsByButton} />
            </div>
          )}
        </div>
      </div>

      {/* 4. Publications
          GET /{media-id}/insights par publication (posts et reels), toutes
          VÉRIFIÉES le 08/09/2026 sur un compte réel à 2429 abonnés : reach,
          views, likes, comments, saved, shares, reposts, total_interactions.
          follows/profile_visits/profile_activity (breakdown=action_type,
          gratuit dans le même appel mais à isoler de toute métrique sans
          breakdown) : posts uniquement, absents sans erreur sur les reels.
          profile_activity ne renvoie que les postes non nuls parmi
          BIO_LINK_CLICKED, CALL, DIRECTION, EMAIL, TEXT — jamais tous à la
          fois. reels_skip_rate (pourcentage direct) et
          ig_reels_avg_watch_time (millisecondes, ex. observé 4840 ms) :
          reels uniquement. La liste elle-même vient de notre propre table
          `content` (import ZIP), pas de GET /{ig-user-id}/media — le jour où
          elle sera branchée en direct, prévoir sa pagination par curseurs
          (paging.cursors.after, paging.next), jamais par offset ; noter
          aussi que media_type (IMAGE/VIDEO/CAROUSEL_ALBUM observés) et
          media_product_type (FEED/REELS observés dans l'échantillon) sont
          deux axes différents — un CAROUSEL_ALBUM est classé FEED, pas un
          troisième type à mapper. NON VÉRIFIÉ CONTRE L'API : total_views/
          total_likes/total_comments (agrégat multi-surfaces, Facebook
          Login) et ig_reels_video_view_total_time (non affiché ici). Aucun
          insight sur les images d'un carrousel pris individuellement
          (Meta parle de « conteneur de carrousel » dans la description de
          reach). Conservation 2 ans. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle
          n={4}
          title="Publications"
          cadence={<CadenceChip cadence="J" />}
          subtitle="Contenu réel (légende, date) — métriques en attendant le branchement de l'API. Aucun insight n'existe pour les images individuelles d'un carrousel : seul l'album entier est mesuré."
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <LiveSourceTag source={postInsightsResult.source} reason={postInsightsResult.reason} />
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
          Un taux « j&apos;aime / portée » au-dessus de 100 % n&apos;est pas une anomalie — la portée compte des comptes
          uniques, les j&apos;aime s&apos;accumulent dans le temps. <UnverifiedNote callToTest="GET /{media-id}/insights?metric=total_views,total_likes,total_comments — agrégat multi-surfaces, jamais rejoué en conditions réelles" />
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {(posts ?? []).map((p, i) => {
            const insights = postInsightsList[i];
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
                    <MetricRow label="Comptes touchés" value={insights.reach} />
                    <MetricRow label="Vues" value={insights.views} />
                    <MetricRow label="J'aime" value={insights.likes} />
                    <MetricRow label="Commentaires" value={insights.comments} />
                    <MetricRow label="Enregistrements" value={insights.saved} />
                    <MetricRow label="Partages" value={insights.shares} />
                    <MetricRow label="Reposts" value={insights.reposts} />
                    <MetricRow label="Interactions totales" value={insights.totalInteractions} />
                    <MetricRow label="Abonnements générés" value={insights.follows} />
                    <MetricRow label="Visites de profil générées" value={insights.profileVisits} />
                    {insights.profileActivity && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <MetricRow label="Actions sur le profil" value={insights.profileActivity.total} />
                        <BreakdownList rows={insights.profileActivity.byAction} />
                      </div>
                    )}
                    {insights.reelsSkipRate != null && <MetricRow label="Taux de skip (3 premières s)" value={pct(insights.reelsSkipRate, 1)} />}
                    {insights.avgWatchTimeMs != null && <MetricRow label="Durée de visionnage moyenne" value={`${Math.round(insights.avgWatchTimeMs / 1000)} s`} />}
                    {insights.totalViews != null && (
                      <div title="Agrège Instagram + surfaces Facebook cross-postées ou boostées — Facebook Login. C'est le chiffre que le client voit dans l'app Instagram.">
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

      {/* 5. Commentaires en direct
          Webhook `comments` (Facebook Login, demande une URL publique de
          réception) : chaque commentaire pousserait un événement avec
          from.username/from.id, texte et média — aucun sondage, donc pas de
          nombre d'appels à documenter ici. Ce serait la seule donnée
          entrante nominative de tout le périmètre. NON VÉRIFIÉ CONTRE
          L'API : webhook jamais configuré (URL publique manquante),
          compte de test sans commentaire pendant la fenêtre de test. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle
          n={5}
          title="Commentaires en direct"
          cadence={
            <>
              <CadenceChip cadence="RT" />
              <UnverifiedNote callToTest="configurer le webhook `comments` (Facebook Login, URL publique requise) et publier un commentaire de test pour confirmer la charge utile" />
            </>
          }
          subtitle="Aperçu du flux temps réel : dès qu'un abonné commente, l'entrée apparaît ici sans recharger la page."
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

      {/* 6. Top commentateurs
          Aucun endpoint Meta ne classe les commentateurs : reconstruit chez
          nous à partir des commentaires collectés (webhook ou lecture
          périodique de GET /{media-id}/comments). VÉRIFIÉ le 08/09/2026 :
          cet endpoint fonctionne et renvoie bien le USERNAME du
          commentateur (avec id, text, timestamp, like_count) — le
          classement nominatif est donc techniquement possible dès le
          premier commentaire lu, pas seulement "à terme". NON VÉRIFIÉ CONTRE
          L'API : notre propre mécanisme de collecte en continu (webhook ou
          sondage périodique), jamais configuré ni testé dans la durée. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle
          n={6}
          title="Top 50 des commentateurs"
          cadence={
            <>
              <CadenceChip cadence="CUMUL" />
              <UnverifiedNote callToTest="mettre en place la collecte continue (webhook `comments` ou sondage périodique de GET /{media-id}/comments) — l'identité du commentateur est déjà confirmée présente dans la réponse" />
            </>
          }
          subtitle="En stockant chaque commentaire reçu au fil du temps (§5 ci-dessus), on reconstitue qui commente le plus souvent — un classement qui s'affine mois après mois, à mesure que l'historique s'accumule."
        />
        <Card variant="claire" interactive={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Classement illustratif — le vrai classement se construira à partir des commentaires réellement reçus.
              </span>
              <LiveSourceTag source={topCommentersResult.source} reason={topCommentersResult.reason} />
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

      {/* 7. Stories
          GET /{media-id}/insights — reach, views, shares, reposts,
          total_interactions, follows, profile_visits, profile_activity
          (breakdown=action_type), navigation (tap_forward/tap_back/exits/
          swipe_forward, breakdown story_navigation_action_type).
          Contrairement aux reels, follows/profile_visits/profile_activity
          EXISTENT bien sur les stories (doc + §1 du compte-rendu). PAS de
          likes, PAS de comments, PAS de saved. `replies` existe mais
          remonte toujours 0 pour un compte créé en Europe (depuis le
          01/12/2020) ou au Japon (depuis le 14/04/2021) — au lieu d'afficher
          ce zéro trompeur par story, un seul bandeau statique l'explique une
          fois. <5 vues → erreur (#10) Not enough viewers, affichée comme un
          état, pas comme un score cassé. Disponible 24 h seulement : il faut
          le webhook story_insights (Facebook Login) pour le capter à temps.
          SECTION ENTIÈRE NON VÉRIFIÉE CONTRE L'API : le compte de test
          n'avait aucune story active — rien ci-dessus, y compris le seuil
          des 5 vues, replies=0 et le webhook, n'a été rejoué en conditions
          réelles. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle
          n={7}
          title="Stories"
          cadence={
            <>
              <CadenceChip cadence="STORY-END" />
              <UnverifiedNote callToTest="publier une story de test puis GET /{media-id}/insights?metric=reach,views,navigation,replies,follows,profile_visits,shares,reposts,total_interactions,profile_activity — aucune n'a été rejouée en conditions réelles" />
            </>
          }
          subtitle="Les chiffres d'une story disparaissent 24 h après sa publication : seul le webhook, capté au bon moment, permet de les garder."
        />
        <div style={{ background: "var(--pastel-jaune)", borderRadius: 14, padding: "12px 16px", fontSize: 13, color: "var(--encre)", lineHeight: 1.5 }}>
          🇫🇷 Sur un compte français, les réponses aux stories ne remontent jamais — une contrainte Meta, pas un bug.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LiveSourceTag source={storyInsightsResult.source} reason={storyInsightsResult.reason} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {(stories ?? []).map((s, i) => {
            const insights = storyInsightsList[i];
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
                    {insights.tooFewViewers ? (
                      <span style={{ fontSize: 12, fontStyle: "italic", color: "var(--text-muted)" }}>Trop peu de vues pour être mesuré</span>
                    ) : (
                      <>
                        <MetricRow label="Comptes touchés" value={insights.reach} />
                        <MetricRow label="Vues" value={insights.views} />
                        <MetricRow label="Partages" value={insights.shares} />
                        <MetricRow label="Reposts" value={insights.reposts} />
                        <MetricRow label="Interactions totales" value={insights.totalInteractions} />
                        <MetricRow label="Abonnements générés" value={insights.follows} />
                        <MetricRow label="Visites de profil générées" value={insights.profileVisits} />
                        {insights.profileActivity && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <MetricRow label="Actions sur le profil" value={insights.profileActivity.total} />
                            <BreakdownList rows={insights.profileActivity.byAction} />
                          </div>
                        )}
                        {insights.navigation && (
                          <>
                            <MetricRow label="Tap suivant" value={insights.navigation.tapForward} />
                            <MetricRow label="Tap précédent" value={insights.navigation.tapBack} />
                            <MetricRow label="Sorties" value={insights.navigation.tapExit} />
                            <MetricRow label="Swipe vers la story suivante" value={insights.navigation.swipeForward} />
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 8. Audience Instagram
          GET /{ig-user-id}/insights?metric=follower_demographics&
          period=lifetime&timeframe=this_month&metric_type=total_value&
          breakdown=<city|country|gender|age> — un appel par breakdown,
          jamais mélangés → 4 appels, VÉRIFIÉS le 08/09/2026 pour LES
          QUATRE : plafond top 45 confirmé (city et country), toutes les
          valeurs sont des effectifs absolus (converties en % ici à
          l'affichage, jamais générées comme telles). city : libellé "Ville,
          Région" concaténé en une seule chaîne (ex. "Marseille,
          Provence-Alpes-Côte d'Azur"), traité comme opaque. country : codes
          ISO 3166-1 alpha-2 ("FR", "BR"...), traduits ici via une table de
          correspondance. gender : F/M/U — "U" signifie non renseigné (93 %
          observé sur le compte de test), pas "autre" : Instagram ne demande
          pas le genre à l'inscription. age : SEPT tranches, 13-17 à 65+.
          Le total mesuré est inférieur au nombre d'abonnés (observé : 2164
          sur 2429) — seuls les abonnés pour qui Meta a la donnée entrent
          dans le calcul, jamais présenté comme exhaustif. Cartes "Villes —
          abonnés" et "Pays — abonnés" (ex-"Top villes"/"Top pays",
          renommées le 09/09/2026 pour ne pas laisser croire à un
          sous-ensemble de la carte engagée ci-dessous).
          5e appel séparé : engaged_audience_demographics, breakdown=city —
          À ISOLER (une erreur ici ferait tomber tout le reste si groupée).
          Population DIFFÉRENTE de follower_demographics : comptes ayant
          interagi sur la période, abonnés ou non — jamais un sous-ensemble
          des abonnés, carte "Villes — audience touchée" (ex-"Villes
          engagées") volontairement placée à côté de "Villes — abonnés"
          (plus séparée par la carte Pays) pour rendre la comparaison
          visuelle possible ; les villes qui n'apparaissent pas côté
          abonnés y sont signalées (pastille), signal d'expansion précoce.
          Comportement DIFFÉRENT au niveau de l'erreur : sous le seuil
          (≥100 engagements par critère), Meta renvoie une vraie erreur
          (code 3006 "Not enough users"), pas un jeu vide — capturée et
          affichée telle quelle (error_user_msg, déjà en français), précédée
          d'une ligne de contexte pour ne pas la lire comme un bug. VÉRIFIÉ
          le 08/09/2026 UNIQUEMENT sur ce chemin d'erreur ; le chemin de
          succès n'a jamais été observé (compte de test sous le seuil) — et
          l'interprétation du seuil elle-même (par ville, pas au total) est
          elle aussi non vérifiée, voir mockEngagedAudienceDemographics
          dans analyse-mock.ts. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle n={8} title="Audience Instagram" cadence={<CadenceChip cadence="S" />} subtitle="Profil agrégé des abonnés — jamais attribué à une personne. Classement limité au top 45 par Meta." />
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <LiveSourceTag source={demographicsResult.source} reason={demographicsResult.reason} />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Basé sur {fr(demographics.measuredTotal)} abonnés mesurés sur {fr(followersTotal)}.
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
          Deux populations distinctes : vos abonnés d&apos;un côté, les comptes qui interagissent de l&apos;autre — même
          s&apos;ils ne vous suivent pas.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          <Card variant="claire" interactive={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Villes — abonnés</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Où vivent les personnes qui vous suivent déjà.</span>
              </div>
              {demographics.followerCities.map((c) => (
                <div key={c.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-muted)" }}>{c.label}</span>
                  <span style={{ fontWeight: 700 }}>{fr(c.value)}</span>
                </div>
              ))}
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>Meta plafonne ce classement à 45 entrées.</span>
            </div>
          </Card>
          <Card variant="claire" interactive={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>Villes — audience touchée</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Où votre contenu génère de l&apos;interaction, abonnés ou non.</span>
                </div>
                <LiveSourceTag source={engagedAudienceResult.source} reason={engagedAudienceResult.reason} />
              </div>
              {engagedAudience.ok ? (
                <>
                  {engagedAudience.rows.map((c) => {
                    const isNew = !followerCityLabels.has(c.label);
                    return (
                      <div key={c.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 13 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", minWidth: 0 }}>
                          {isNew && (
                            <span
                              aria-hidden
                              title="Ville absente des abonnés"
                              style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--vert-logo)", flex: "0 0 auto" }}
                            />
                          )}
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.label}</span>
                        </span>
                        <span style={{ fontWeight: 700, flex: "0 0 auto" }}>{fr(c.value)}</span>
                      </div>
                    );
                  })}
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>Meta plafonne ce classement à 45 entrées.</span>
                  {newEngagedCities.length > 0 && (
                    <span style={{ fontSize: 11, color: "var(--vert-logo)", fontWeight: 600 }}>
                      Signalées : villes où vous engagez sans y être encore suivi.
                    </span>
                  )}
                </>
              ) : (
                <div style={{ background: "var(--panneau)", border: "1px solid var(--bordure)", borderRadius: 12, padding: "10px 12px", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, display: "flex", flexDirection: "column", gap: 6 }}>
                  <span>Cette mesure demande un volume d&apos;interactions plus élevé que le nombre d&apos;abonnés.</span>
                  <span>{engagedAudience.errorUserMsg}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          <Card variant="claire" interactive={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Pays — abonnés</span>
              {demographics.followerCountries.map((c) => (
                <div key={c.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-muted)" }}>{c.label}</span>
                  <span style={{ fontWeight: 700 }}>{fr(c.value)}</span>
                </div>
              ))}
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>Meta plafonne ce classement à 45 entrées.</span>
            </div>
          </Card>
          <Card variant="claire" interactive={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Genre</span>
              {unspecifiedPct >= 20 && (
                <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>
                  {pct(unspecifiedPct, 0)} des abonnés mesurés n&apos;ont pas renseigné leur genre — répartition calculée
                  sur les {fr(genderReported)} restants.
                </span>
              )}
              {genderReported > 0 ? (
                <>
                  <MetricRow label="Femmes" value={pct((demographics.genderSplit.female / genderReported) * 100)} />
                  <MetricRow label="Hommes" value={pct((demographics.genderSplit.male / genderReported) * 100)} />
                </>
              ) : (
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
                  Aucun abonné mesuré n&apos;a renseigné son genre.
                </span>
              )}
            </div>
          </Card>
          <Card variant="claire" interactive={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Âge</span>
              {demographics.ageSplit.map((a) => (
                <MetricRow key={a.label} label={a.label} value={demographics.measuredTotal > 0 ? pct((a.value / demographics.measuredTotal) * 100) : null} />
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* 9. Mentions et veille
          Mentions : edge /{ig-user-id}/tags — VÉRIFIÉ le 08/09/2026 :
          accessible avec les scopes courants, renvoie {"{"}"data":[]{"}"} sur
          le compte de test (structure confirmée, aucune mention à ce jour).
          Webhook `mentions` (temps réel, légende/commentaire) — NON VÉRIFIÉ
          CONTRE L'API : demande une URL publique de réception, jamais
          configurée. Ne capte de toute façon pas les mentions en story.
          Veille : GET /{ig-user-id}?fields=business_discovery.username(...)
          — VÉRIFIÉ le 08/09/2026 (exemple : lacoste, 8 873 423 abonnés) — un
          appel par concurrent, données publiques uniquement. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle n={9} title="Mentions et veille" subtitle="Ce qui se dit autour de la marque, et où elle se situe face à ses concurrents." />
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16, alignItems: "start" }}>
          <Card variant="claire" interactive={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Mentions</span>
                <CadenceChip cadence="RT" />
                <LiveSourceTag source={mentionsResult.source} reason={mentionsResult.reason} />
                <UnverifiedNote callToTest="configurer le webhook `mentions` (URL publique requise), puis mentionner le compte pour confirmer la charge utile — l'edge /{ig-user-id}/tags, lui, est déjà confirmé accessible" />
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
                <LiveSourceTag source={competitorsResult.source} reason={competitorsResult.reason} />
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

      {/* 10. Aller plus loin
          Composition purement illustrative (aucune intégration réelle,
          aucun logo cliquable) : le seul satellite "connecté" est
          Instagram, parce que c'est la seule source déjà branchée sur ce
          compte. Les six autres sont un horizon, pas une roadmap engagée —
          rien ici ne dit quand ni si ils seront construits. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <SectionTitle
          n={10}
          title="Aller plus loin"
          subtitle="Instagram est la brique qu'on construit en premier — le socle. D'autres sources peuvent s'y greffer ensuite, pour raconter une histoire qu'aucune ne raconte seule."
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 1, maxWidth: 420 }}>
          {[
            ["Shopify seul", "ce qui s'est vendu"],
            ["Instagram seul", "ce qui a été vu"],
          ].map(([source, insight]) => (
            <div key={source} style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "9px 4px", fontSize: 14, color: "var(--text-muted)" }}>
              <span>{source}</span>
              <span>→ {insight}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "10px 14px", borderRadius: 12, background: "var(--bleu-bg)", fontSize: 14, fontWeight: 700, color: "var(--encre)" }}>
            <span>Les deux</span>
            <span style={{ color: "var(--bleu)" }}>→ quel contenu a vendu</span>
          </div>
        </div>

        <SourcesRadialDiagram />

        <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
          Instagram déjà connecté. Les autres sources : un horizon, pas un calendrier.
        </p>
      </div>

      {/* 11. Ce qu'on ne peut pas récupérer */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle n={11} title="Ce qu'on ne peut pas récupérer" subtitle="Pour que le périmètre soit clair dans les deux sens." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {[
            ["Qui a mis un « j'aime »", "Cette liste n'est fournie ni par l'API ni par l'application Instagram."],
            ["Qui a vu une story", "Seuls des chiffres globaux existent, jamais nommément."],
            ["La liste des abonnés", "Aucune API ni webhook ne la fournit."],
            ["La date de création du compte", "Visible uniquement dans l'appli, pas via l'API."],
            ["Le détail d'une image dans un carrousel", "Seul l'album entier est mesurable."],
            ["Qui a publié un post trouvé par hashtag", "Le nom d'utilisateur n'est pas fourni dans ce cas."],
            ["Plus de 2 ans d'historique d'un contenu", "Au-delà, Meta ne conserve plus les statistiques."],
            ["Les comptes personnels", "Aucun accès, quel que soit l'outil."],
            ["Être alerté d'un nouvel abonné ou d'un départ", "Ces événements n'existent pour aucun webhook Meta."],
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
