import { Card } from "@/components/ds";
import { resolveBrandContext } from "@/lib/context/brand-context";
import { fr, pct, signedPct, shortDate } from "@/lib/format";
import { SampleWindow } from "@/components/sample-window";
import { TrendLine, type TrendSeries } from "@/components/trend-line";
import { isoWeekMonday } from "@/lib/cohort-quality";
import { ContentFeed, type ContentItem } from "./content-feed";

const SERIES_COLOR: Record<string, string> = { post: "var(--bleu)", reel: "var(--vert-logo)", story: "#8B5CF6" };
const FORMAT_LABEL: Record<string, string> = { post: "Posts", reel: "Reels", story: "Stories" };

export default async function ContenuPage({
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

  const { data: latestImport } = await supabase
    .from("latest_completed_import")
    .select("import_id, window_start, window_end")
    .eq("account_id", account.id)
    .maybeSingle();

  if (!latestImport) {
    return (
      <Card variant="claire" interactive={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 19, fontWeight: 800 }}>Aucun import traité</div>
          <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Le contenu apparaît après le premier import.</div>
        </div>
      </Card>
    );
  }

  // Toute publication (post, reel, story) datée dans la fenêtre de l'import
  // — pas first_import_id, qui ne marque que la première fois qu'un média
  // a été VU dans un export (reels.json/stories.json redonnent l'historique
  // complet à chaque fois) : sur ce compte, filtrer par first_import_id
  // masquait 23 posts sur 27 et 91 stories sur 134 réellement publiées
  // dans la période affichée.
  let contentQuery = supabase.from("content").select("*").eq("account_id", account.id);
  if (latestImport.window_start) contentQuery = contentQuery.gte("published_at", latestImport.window_start);
  if (latestImport.window_end) contentQuery = contentQuery.lte("published_at", latestImport.window_end);

  const [{ data: content }, { data: metrics }, { data: attribution }, { data: interactions }, { data: formatRetention }] = await Promise.all([
    contentQuery.order("published_at", { ascending: false }),
    supabase.from("content_metrics").select("*").eq("account_id", account.id).eq("import_id", latestImport.import_id!),
    supabase.from("content_attribution").select("*").eq("account_id", account.id).eq("import_id", latestImport.import_id!),
    supabase.from("interaction_insights").select("*").eq("account_id", account.id).eq("import_id", latestImport.import_id!).in("format", ["reels", "posts"]),
    // Croisement rétention × format (§3.3) : media_type est une donnée
    // réelle (contrairement au territoire éditorial, non classifiable) —
    // calculée à partir de content_attribution.retention_rate.
    supabase
      .from("cross_analyses")
      .select("dimension, payload, sample_size, confidence, confidence_reason")
      .eq("account_id", account.id)
      .eq("import_id", latestImport.import_id!)
      .eq("code", "format_retention")
      .order("dimension"),
  ]);

  const metricsByContent = new Map((metrics ?? []).map((m) => [m.content_id, m]));
  const attributionByContent = new Map((attribution ?? []).map((a) => [a.content_id, a]));

  const posts = (content ?? []).map((c) => ({
    content: c,
    metrics: metricsByContent.get(c.id),
    attribution: attributionByContent.get(c.id),
  }));

  // Plus de vignette : les fichiers médias (.jpg/.png/.mp4) ne sont plus
  // importés — seule la légende, déjà dans le JSON de l'export, est affichée.
  const contentItems: ContentItem[] = posts.map(({ content: c, metrics: m, attribution: a }) => ({
    id: c.id,
    publishedAt: c.published_at,
    mediaType: c.media_type,
    caption: c.caption,
    permalink: c.permalink,
    reach: m?.reach ?? null,
    impressions: m?.impressions ?? null,
    profileVisits: m?.profile_visits ?? null,
    saves: m?.saves ?? null,
    shares: m?.shares ?? null,
    followsGained: m?.follows_gained ?? null,
    followConversionRate: m?.follow_conversion_rate ?? null,
    excessArrivals: a?.excess_arrivals ?? null,
    retentionRate: a?.retention_rate ?? null,
    confidence: a?.confidence ?? null,
  }));

  const reels = (interactions ?? []).find((i) => i.format === "reels");
  const postsAgg = (interactions ?? []).find((i) => i.format === "posts");

  // Courbe : arrivées excédentaires attribuées (48 h post-publication),
  // sommées par semaine ISO et par format — la seule série avec assez de
  // points pour dessiner une évolution sur la période (contrairement aux
  // métriques Insights, qui n'ont qu'un point par import, deux à ce jour).
  const weeklyByFormat: Record<string, Map<string, number>> = { post: new Map(), reel: new Map(), story: new Map() };
  for (const { content: c, attribution: a } of posts) {
    if (!a || a.excess_arrivals == null) continue;
    const bucket = weeklyByFormat[c.media_type];
    if (!bucket) continue;
    const week = isoWeekMonday(c.published_at.slice(0, 10));
    bucket.set(week, (bucket.get(week) ?? 0) + a.excess_arrivals);
  }
  const allWeeks = [...new Set(Object.values(weeklyByFormat).flatMap((m) => [...m.keys()]))].sort();
  const trendLabels = allWeeks.map((w) => shortDate(w));
  const trendSeries: TrendSeries[] = (["post", "reel", "story"] as const)
    .filter((type) => weeklyByFormat[type].size > 0)
    .map((type) => ({
      key: type,
      label: FORMAT_LABEL[type],
      color: SERIES_COLOR[type],
      values: allWeeks.map((w) => weeklyByFormat[type].get(w) ?? 0),
    }));

  const formatCounts = { post: 0, reel: 0, story: 0 } as Record<string, number>;
  for (const { content: c } of posts) formatCounts[c.media_type] = (formatCounts[c.media_type] ?? 0) + 1;

  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1280, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.01em" }}>Contenu</h1>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {fr(posts.length)} publication{posts.length > 1 ? "s" : ""} · {fr(formatCounts.post)} posts · {fr(formatCounts.reel)} reels ·{" "}
          {fr(formatCounts.story)} stories
          {latestImport.window_start && latestImport.window_end ? ` · ${shortDate(latestImport.window_start)} → ${shortDate(latestImport.window_end)}` : ""}
        </span>
      </div>

      {trendLabels.length > 1 && trendSeries.length > 0 && (
        <Card variant="claire" interactive={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Arrivées excédentaires attribuées, par semaine</h2>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Somme des arrivées excédentaires (48 h post-publication, cf. cartes ci-dessous), par format et par semaine —
                cliquez une puce pour isoler ou masquer un format ; survolez un point pour le détail. Une corrélation
                temporelle, jamais une attribution certaine.
              </span>
            </div>
            <TrendLine labels={trendLabels} series={trendSeries} />
          </div>
        </Card>
      )}

      {posts.length === 0 ? (
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Aucune publication datée dans cette période.</p>
      ) : (
        <ContentFeed items={contentItems} />
      )}

      {(reels || postsAgg) && (
        <Card variant="encre" interactive={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Reels contre posts</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(250,248,243,0.55)" }}>Reels · interactions</span>
                <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1, color: "var(--vert-logo)" }}>{fr(reels?.interactions ?? null)}</span>
                <span style={{ fontSize: 15, color: "rgba(250,248,243,0.8)" }}>{signedPct(reels?.delta_pct ?? null)} sur la période</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(250,248,243,0.55)" }}>Posts · interactions</span>
                <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>{fr(postsAgg?.interactions ?? null)}</span>
                <span style={{ fontSize: 15, color: "rgba(250,248,243,0.8)" }}>{signedPct(postsAgg?.delta_pct ?? null)} sur la période</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {(formatRetention ?? []).length > 0 && (
        <Card variant="claire" interactive={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Rétention par format</h2>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Moyenne de la rétention à 48 h (ci-dessus) regroupée par format réel.
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
              {(formatRetention ?? []).map((f) => {
                const retention = (f.payload as { retention_moyenne?: number })?.retention_moyenne;
                return (
                  <div key={f.dimension} style={{ border: "1px solid var(--bordure-carte)", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>{FORMAT_LABEL[f.dimension] ?? f.dimension}</span>
                    <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>
                      {retention != null ? pct(retention * 100) : "—"}
                    </span>
                    <SampleWindow n={f.sample_size} confidence={f.confidence} reason={f.confidence_reason} />
                  </div>
                );
              })}
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              La rétention par territoire éditorial (thème, mise en scène) reste hors de portée : contrairement au format,
              elle nécessite une classification automatique du contenu jamais construite.
            </span>
          </div>
        </Card>
      )}
    </main>
  );
}
