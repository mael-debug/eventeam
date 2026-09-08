import { Card } from "@/components/ds";
import { resolveBrandContext } from "@/lib/context/brand-context";
import { fr, signedPct, shortDate } from "@/lib/format";
import { ContentFeed, type ContentItem } from "./content-feed";

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

  const [{ data: content }, { data: metrics }, { data: interactions }] = await Promise.all([
    contentQuery.order("published_at", { ascending: false }),
    supabase.from("content_metrics").select("*").eq("account_id", account.id).eq("import_id", latestImport.import_id!),
    supabase.from("interaction_insights").select("*").eq("account_id", account.id).eq("import_id", latestImport.import_id!).in("format", ["reels", "posts"]),
  ]);

  const metricsByContent = new Map((metrics ?? []).map((m) => [m.content_id, m]));

  const posts = (content ?? []).map((c) => ({
    content: c,
    metrics: metricsByContent.get(c.id),
  }));

  // Plus de vignette : les fichiers médias (.jpg/.png/.mp4) ne sont plus
  // importés — seule la légende, déjà dans le JSON de l'export, est affichée.
  const contentItems: ContentItem[] = posts.map(({ content: c, metrics: m }) => ({
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
  }));

  const reels = (interactions ?? []).find((i) => i.format === "reels");
  const postsAgg = (interactions ?? []).find((i) => i.format === "posts");

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
    </main>
  );
}
