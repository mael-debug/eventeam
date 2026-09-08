import { Card, Chip } from "@/components/ds";
import { resolveBrandContext } from "@/lib/context/brand-context";
import { fr, pct, shortDate, signedPct } from "@/lib/format";
import { TrendLine } from "@/components/trend-line";
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
  withLiveFallback,
  notWiredYet,
  GRAPH_VERSION,
  type MediaType,
  type TrendMetric,
  type DemographicRow,
} from "@/lib/analyse-mock";
import { CadenceChip } from "./cadence-chip";
import { LiveComments } from "./live-comments";

// Page Analyse — uniquement les métriques réellement récupérables dans le
// cadre de ce projet, pour que chaque appel passe du premier coup une fois
// branché. Toute métrique absente du catalogue vérifié n'apparaît nulle
// part sur cette page — pas de tiret, pas de placeholder : la ligne
// disparaît. Chaque section garde un commentaire d'en-tête donnant
// l'endpoint, la ou les métriques, le breakdown, le metric_type, le nombre
// d'appels et la fraîcheur réelle (jamais "chaque nuit" quand Meta autorise
// un retard jusqu'à 48 h).
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
// Chaque section tente l'appel réel (aujourd'hui un stub qui échoue
// systématiquement, voir withLiveFallback/notWiredYet dans analyse-mock.ts)
// et retombe sur le mock en cas d'échec — c'est le même mécanisme qu'en
// production le jour où un appel échouera pour de vraies raisons (jeton
// expiré, limite de débit, panne Meta). Le badge "Simulé" à côté d'une
// cadence signale ce repli ; aujourd'hui il apparaît partout puisque rien
// n'est encore branché.
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

// Appel exécuté et rejoué contre de vraies données (08/09/2026) vs appel
// jamais tenté sur ce compte : cette page distingue les deux plutôt que de
// présenter une capacité documentée comme équivalente à une capacité
// éprouvée. Ne retire rien — signale.
function UnverifiedNote({ callToTest }: { callToTest: string }) {
  return (
    <div style={{ border: "1px dashed var(--bordure)", borderRadius: 12, padding: "8px 12px", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
      <strong style={{ fontStyle: "normal" }}>Non vérifié contre l&apos;API</strong> — jamais rejoué en conditions réelles sur ce
      compte, à tester avant mise en prod : <code>{callToTest}</code>
    </div>
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
  const postLabels = (posts ?? []).map((p) => (p.caption ?? "").slice(0, 40));

  // Chaque source tente l'appel réel (stub qui échoue systématiquement,
  // rien n'étant branché) et retombe sur le mock — voir withLiveFallback.
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

  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 44, maxWidth: 1120, minWidth: 0, paddingBottom: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: "-0.01em" }}>Analyse</h1>
        <p style={{ margin: 0, fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 780, textWrap: "pretty" }}>
          Ce que Community Intelligence pourra remonter du compte @{account.handle}, et à quelle fréquence chaque
          donnée se rafraîchit. Chaque métrique ci-dessous est une capacité confirmée par la documentation Graph API
          Meta ({GRAPH_VERSION}) — si Meta ne peut pas la fournir de façon fiable, elle n&apos;apparaît pas sur cette
          page. Le contenu réel (légendes, dates) est déjà le nôtre ; la connexion à l&apos;API n&apos;est pas encore
          branchée, donc les chiffres affichés restent illustratifs (badge « Simulé ») en attendant l&apos;activation.
        </p>
      </div>

      {/* 1. En-tête compte
          Champs de base du nœud Instagram User (username, followers_count) —
          disponibilité certaine, aucun breakdown. Donnée réelle (import),
          pas de repli mock ici. */}
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

      {/* 2. Vue d'ensemble
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
              Ne couvre PAS le clic sur le lien en bio (voir section 3,
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
        <SectionTitle n={2} title="Vue d'ensemble" cadence={<CadenceChip cadence="J" />} subtitle="Indicateurs du compte sur 30 jours." />
        <div style={{ background: "var(--pastel-jaune)", borderRadius: 14, padding: "12px 16px", fontSize: 13, color: "var(--encre)", lineHeight: 1.5 }}>
          Meta ne conserve ces données que <strong>90 jours</strong>, avec un retard de traitement possible jusqu&apos;à{" "}
          <strong>48 h</strong> — même relevées chaque nuit, elles ne sont jamais garanties « à jour ce matin ». C&apos;est
          tout l&apos;intérêt de les archiver chez nous dès le premier jour. Et quand une donnée n&apos;existe pas, l&apos;API
          renvoie « aucune donnée », jamais un zéro — les deux ne veulent pas dire la même chose, l&apos;interface le
          distingue partout sur cette page.
        </div>
        <Card variant="claire" interactive={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Comptes touchés, chaque jour</span>
              <LiveSourceTag source={reachDailyResult.source} reason={reachDailyResult.reason} />
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Courbe globale, sans détail par format : Meta n&apos;autorise jamais de breakdown dans une série quotidienne
              (metric_type=time_series). Le détail par format existe, mais seulement en total sur la période — voir
              ci-dessous.
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
              Deuxième appel à la même métrique <code>reach</code>, cette fois en total sur 30 jours ventilé par format
              (posts, reels, stories) — pas un point par jour, cette combinaison-là n&apos;existe pas côté Meta.
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
            <span style={{ fontSize: 15, fontWeight: 700 }}>Tendance de la portée, sur plusieurs mois</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Meta ne garde que 90 jours : cette vue longue n&apos;existe que grâce à notre propre historique, construit mois après mois.
            </span>
            <UnverifiedNote callToTest="infaisable en un seul appel — nécessite d'archiver nos propres relevés de GET /{ig-user-id}/insights?metric=reach&period=day dans le temps" />
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
            « Abonnements » et « Désabonnements » viennent du même appel Meta (disponible à partir de 100 abonnés) : Meta ne
            distingue pas un départ volontaire d&apos;un compte supprimé ou désactivé, les deux comptent comme
            désabonnement.
          </p>
          {periodTotals.profileLinksTaps != null && (
            <div>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Détail des clics sur les liens du profil, par type de bouton :</span>
              <BreakdownList rows={periodTotals.profileLinksTapsByButton} />
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>
                Les types de bouton affichés dépendent de ceux configurés sur le profil Instagram — un bouton absent ne
                remonte pas comme zéro, il n&apos;apparaît simplement pas. Ne couvre pas le clic sur le lien en bio,
                comptabilisé séparément (§3, Actions sur le profil).
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Publications
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
          n={3}
          title="Publications"
          cadence={<CadenceChip cadence="J" />}
          subtitle="Contenu réel (légende, date) — métriques en attendant le branchement de l'API. Aucun insight n'existe pour les images individuelles d'un carrousel : seul l'album entier est mesuré."
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <LiveSourceTag source={postInsightsResult.source} reason={postInsightsResult.reason} />
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
          « Actions sur le profil » ne détaille que les boutons configurés sur le profil Instagram — un bouton absent ne
          remonte pas comme zéro, il n&apos;apparaît simplement pas. Les j&apos;aime sont cumulés depuis la publication
          alors que la portée est un compte de comptes uniques : un taux « j&apos;aime / portée » supérieur à 100 % n&apos;est
          pas une anomalie.
        </p>
        <UnverifiedNote callToTest="GET /{media-id}/insights?metric=total_views,total_likes,total_comments — agrégat multi-surfaces, jamais rejoué en conditions réelles" />
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

      {/* 4. Commentaires en direct
          Webhook `comments` (Facebook Login, demande une URL publique de
          réception) : chaque commentaire pousserait un événement avec
          from.username/from.id, texte et média — aucun sondage, donc pas de
          nombre d'appels à documenter ici. Ce serait la seule donnée
          entrante nominative de tout le périmètre. NON VÉRIFIÉ CONTRE
          L'API : webhook jamais configuré (URL publique manquante),
          compte de test sans commentaire pendant la fenêtre de test. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle
          n={4}
          title="Commentaires en direct"
          cadence={<CadenceChip cadence="RT" />}
          subtitle="Aperçu du flux temps réel : dès qu'un abonné commente, l'entrée apparaît ici sans recharger la page."
        />
        <UnverifiedNote callToTest="configurer le webhook `comments` (Facebook Login, URL publique requise) et publier un commentaire de test pour confirmer la charge utile" />
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

      {/* 5. Top commentateurs
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
          n={5}
          title="Top 50 des commentateurs"
          cadence={<CadenceChip cadence="CUMUL" />}
          subtitle="En stockant chaque commentaire reçu au fil du temps (§4 ci-dessus), on reconstitue qui commente le plus souvent — un classement qui s'affine mois après mois, à mesure que l'historique s'accumule."
        />
        <UnverifiedNote callToTest="mettre en place la collecte continue (webhook `comments` ou sondage périodique de GET /{media-id}/comments) — l'identité du commentateur est déjà confirmée présente dans la réponse" />
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

      {/* 6. Stories
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
          n={6}
          title="Stories"
          cadence={<CadenceChip cadence="STORY-END" />}
          subtitle="Les chiffres d'une story disparaissent 24 h après sa publication : seul le webhook, capté au bon moment, permet de les garder."
        />
        <UnverifiedNote callToTest="publier une story de test puis GET /{media-id}/insights?metric=reach,views,navigation,replies,follows,profile_visits,shares,reposts,total_interactions,profile_activity — aucune n'a été rejouée en conditions réelles" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ background: "var(--pastel-jaune)", borderRadius: 14, padding: "12px 16px", fontSize: 13, color: "var(--encre)", lineHeight: 1.5 }}>
            🇫🇷 Sur un compte français, <strong>les réponses aux stories ne remontent jamais</strong> — une contrainte que
            Meta applique à l&apos;Europe et au Japon, pas un bug de notre côté. C&apos;est pourquoi cette métrique
            n&apos;apparaît pas carte par carte ci-dessous : un zéro affiché à chaque story laisserait croire à une
            mesure, alors que Meta ne la fournit tout simplement pas ici.
          </div>
          <div style={{ background: "var(--panneau)", border: "1px solid var(--bordure)", borderRadius: 14, padding: "12px 16px", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
            Une story vue par moins de 5 personnes ne renvoie aucune donnée — l&apos;interface l&apos;affiche comme « trop
            peu de vues pour être mesuré », jamais comme un score cassé.
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
          « Actions sur le profil » ne détaille que les boutons configurés sur le profil Instagram — un bouton absent ne
          remonte pas comme zéro, il n&apos;apparaît simplement pas.
        </p>
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

      {/* 7. Audience
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
          dans le calcul, jamais présenté comme exhaustif.
          5e appel séparé : engaged_audience_demographics, breakdown=city —
          À ISOLER (une erreur ici ferait tomber tout le reste si groupée).
          Comportement DIFFÉRENT : sous le seuil (≥100 engagements par
          critère), Meta renvoie une vraie erreur (code 3006 "Not enough
          users"), pas un jeu vide — capturée et affichée telle quelle
          (error_user_msg, déjà en français). VÉRIFIÉ le 08/09/2026
          UNIQUEMENT sur ce chemin d'erreur ; le chemin de succès n'a jamais
          été observé (compte de test sous le seuil). */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle n={7} title="Audience" cadence={<CadenceChip cadence="S" />} subtitle="Profil agrégé des abonnés — jamais attribué à une personne. Classement limité au top 45 par Meta." />
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <LiveSourceTag source={demographicsResult.source} reason={demographicsResult.reason} />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Basé sur {fr(demographics.measuredTotal)} abonnés mesurés sur {fr(followersTotal)} — Meta n&apos;a de donnée
            démographique que pour une partie des abonnés, jamais la totalité.
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          <Card variant="claire" interactive={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Top villes (sur 45 max)</span>
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
              <span style={{ fontSize: 15, fontWeight: 700 }}>Top pays (sur 45 max)</span>
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
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Villes engagées (sur 45 max)</span>
                <LiveSourceTag source={engagedAudienceResult.source} reason={engagedAudienceResult.reason} />
              </div>
              <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>
                Comptes ayant interagi, pas seulement abonnés — nécessite ≥100 engagements sur la période, dans chaque
                critère de répartition. Disponible « cette semaine » ou « ce mois-ci » seulement, pas sur 90 jours comme
                le reste de cette page.
              </span>
              {engagedAudience.ok ? (
                engagedAudience.rows.map((c) => (
                  <div key={c.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "var(--text-muted)" }}>{c.label}</span>
                    <span style={{ fontWeight: 700 }}>{fr(c.value)}</span>
                  </div>
                ))
              ) : (
                <div style={{ background: "var(--panneau)", border: "1px solid var(--bordure)", borderRadius: 12, padding: "10px 12px", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  {engagedAudience.errorUserMsg}
                </div>
              )}
            </div>
          </Card>
          <Card variant="claire" interactive={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Genre</span>
              {unspecifiedPct >= 20 && (
                <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>
                  {pct(unspecifiedPct, 0)} des abonnés mesurés n&apos;ont pas renseigné leur genre auprès d&apos;Instagram
                  (« U », non demandé à l&apos;inscription) — répartition ci-dessous calculée sur les{" "}
                  {fr(genderReported)} restants.
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

      {/* 8. Mentions et veille
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
        <SectionTitle n={8} title="Mentions et veille" subtitle="Ce qui se dit autour de la marque, et où elle se situe face à ses concurrents." />
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16, alignItems: "start" }}>
          <Card variant="claire" interactive={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Mentions</span>
                <CadenceChip cadence="RT" />
                <LiveSourceTag source={mentionsResult.source} reason={mentionsResult.reason} />
              </div>
              <UnverifiedNote callToTest="configurer le webhook `mentions` (URL publique requise), puis mentionner le compte pour confirmer la charge utile — l'edge /{ig-user-id}/tags, lui, est déjà confirmé accessible" />
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

      {/* 9. Ce qu'on ne peut pas récupérer */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle n={9} title="Ce qu'on ne peut pas récupérer" subtitle="Pour que le périmètre soit clair dans les deux sens." />
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
        <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, maxWidth: 760 }}>
          Une entrée a été retirée de cette liste : « programmer une publication automatiquement » y figurait à tort.
          L&apos;API de publication de contenu (Content Publishing API) permet bien de publier un post ou un reel par
          appel programmatique — ce qui manque, c&apos;est une programmation native côté Meta (un « publier le X à
          telle heure ») ; il faut un déclencheur externe (notre propre planificateur) qui appelle l&apos;API au bon
          moment. Ce n&apos;est donc pas quelque chose qu&apos;on ne peut pas récupérer, mais un outil qu&apos;il reste à
          construire si le besoin se confirme.
        </p>
      </div>
    </main>
  );
}
