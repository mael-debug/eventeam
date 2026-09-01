import { Card } from "@/components/ds";
import { resolveBrandContext } from "@/lib/context/brand-context";
import { fr, pct, signedPct, shortDate } from "@/lib/format";
import { SampleWindow } from "@/components/sample-window";

const CONFIDENCE_LABEL: Record<string, string> = { robuste: "robuste", indicatif: "indicatif", insuffisant: "insuffisant" };
const CONFIDENCE_BG: Record<string, string> = {
  robuste: "var(--vert-pastel)",
  indicatif: "var(--pastel-jaune)",
  insuffisant: "var(--creme-fonce)",
};
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

  const [{ data: content }, { data: metrics }, { data: attribution }, { data: interactions }, { count: reelsCount }, { count: storiesCount }, { data: formatRetention }] =
    await Promise.all([
      supabase.from("content").select("*").eq("account_id", account.id).eq("first_import_id", latestImport.import_id!),
      supabase.from("content_metrics").select("*").eq("account_id", account.id).eq("import_id", latestImport.import_id!),
      supabase.from("content_attribution").select("*").eq("account_id", account.id).eq("import_id", latestImport.import_id!),
      supabase.from("interaction_insights").select("*").eq("account_id", account.id).eq("import_id", latestImport.import_id!).in("format", ["reels", "posts"]),
      supabase.from("content").select("*", { count: "exact", head: true }).eq("account_id", account.id).eq("media_type", "reel"),
      supabase.from("content").select("*", { count: "exact", head: true }).eq("account_id", account.id).eq("media_type", "story"),
      // Croisement rétention × format (§3.3) : media_type est une donnée
      // réelle (contrairement au territoire éditorial, non classifiable) —
      // calculée à partir de content_attribution.retention_rate ci-dessus.
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

  const posts = (content ?? [])
    .map((c) => ({ content: c, metrics: metricsByContent.get(c.id), attribution: attributionByContent.get(c.id) }))
    .filter((p) => p.metrics)
    .sort((a, b) => (b.metrics?.follow_conversion_rate ?? 0) - (a.metrics?.follow_conversion_rate ?? 0))
    .slice(0, 6);

  // thumb_path est stocké préfixé du bucket ("media-thumbs/...", même
  // convention que storage_path ailleurs) — media-thumbs est un bucket
  // privé, l'URL signée est donc générée côté serveur, jamais une URL
  // publique directe.
  const thumbUrls = new Map<string, string>();
  await Promise.all(
    posts.map(async ({ content: c }) => {
      if (!c.thumb_path) return;
      const slash = c.thumb_path.indexOf("/");
      if (slash < 0) return;
      const bucket = c.thumb_path.slice(0, slash);
      const objectPath = c.thumb_path.slice(slash + 1);
      const { data } = await supabase.storage.from(bucket).createSignedUrl(objectPath, 3600);
      if (data?.signedUrl) thumbUrls.set(c.id, data.signedUrl);
    }),
  );

  const reels = (interactions ?? []).find((i) => i.format === "reels");
  const postsAgg = (interactions ?? []).find((i) => i.format === "posts");

  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1280, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.01em" }}>Contenu</h1>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Tri par taux de conversion en abonnés, décroissant
          {latestImport.window_start && latestImport.window_end ? ` · ${shortDate(latestImport.window_start)} → ${shortDate(latestImport.window_end)}` : ""}
        </span>
      </div>

      {posts.length === 0 ? (
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Aucune publication rattachée à cet import (posts.json non fourni ou vide).</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {posts.map(({ content: c, metrics: m, attribution: a }) => (
            <Card key={c.id} variant="claire" interactive={false}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
                {thumbUrls.has(c.id) ? (
                  // eslint-disable-next-line @next/next/no-img-element -- URL signée temporaire (1 h), un <Image> next/image la mettrait en cache au-delà de sa validité.
                  <img
                    src={thumbUrls.get(c.id)}
                    alt=""
                    style={{ height: 150, width: "100%", borderRadius: 12, objectFit: "cover", background: "var(--creme-fonce)" }}
                  />
                ) : (
                  <div style={{ height: 150, borderRadius: 12, background: "var(--creme-fonce)", display: "grid", placeItems: "center", fontSize: 12, color: "var(--text-muted)" }}>
                    Vignette indisponible
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-muted)" }}>
                  <span style={{ fontWeight: 600, color: "var(--encre)" }}>{shortDate(c.published_at)}</span>
                  <span>·</span>
                  <span>{c.media_type}</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>Conversion</span>
                    <span style={{ fontSize: "clamp(24px, 2.6vw, 34px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>
                      {pct(m?.follow_conversion_rate != null ? m.follow_conversion_rate * 100 : null)}
                    </span>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                    <div>{fr(m?.reach ?? null)} de portée</div>
                    <div>{fr(m?.follows_gained ?? null)} abonnés gagnés</div>
                  </div>
                </div>
                <div style={{ borderTop: "1px solid var(--bordure-carte)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <span
                      style={{ color: "var(--text-muted)", textDecoration: "underline dotted", textUnderlineOffset: 3 }}
                      title="Arrivées observées dans les 48 heures suivant la publication, au-delà de la ligne de base. Une corrélation temporelle n'est pas une attribution : rien dans l'export ne relie un abonné à une publication."
                    >
                      Arrivées excédentaires 48 h
                    </span>
                    <span style={{ fontWeight: 700 }}>{a ? fr(a.excess_arrivals) : "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ color: "var(--text-muted)" }}>Rétention de ces arrivées</span>
                    <span style={{ fontWeight: 700 }}>{a?.retention_rate != null ? pct(a.retention_rate * 100) : "non calculé"}</span>
                  </div>
                  {a && (
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <span style={{ color: "var(--text-muted)" }}>Confiance</span>
                      <span style={{ borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700, background: CONFIDENCE_BG[a.confidence] ?? "var(--creme-fonce)" }}>
                        {CONFIDENCE_LABEL[a.confidence] ?? a.confidence}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
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
                Moyenne de la rétention à 48 h (ci-dessus) regroupée par format réel — la seule dimension de format que
                l&apos;export documente, contrairement au territoire éditorial ci-dessous.
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
          </div>
        </Card>
      )}

      {((reelsCount ?? 0) > 0 || (storiesCount ?? 0) > 0) && (
        <div style={{ background: "var(--panneau)", border: "1px solid var(--bordure)", borderRadius: 18, padding: "16px 20px", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5, textWrap: "pretty" }}>
          {fr(reelsCount ?? 0)} reel{(reelsCount ?? 0) > 1 ? "s" : ""} et {fr(storiesCount ?? 0)} {(storiesCount ?? 0) > 1 ? "stories" : "story"} recensés
          sur l&apos;historique du compte, hors grille ci-dessus : vérifié sur l&apos;export réel, aucune métrique de portée ou de
          conversion n&apos;existe pour ces formats, contrairement aux publications statiques. Seules leur date et leur légende
          sont connues.
        </div>
      )}

      <div style={{ background: "var(--panneau)", border: "1px solid var(--bordure)", borderRadius: 18, padding: "16px 20px", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>
        La rétention par territoire éditorial (thème, mise en scène) n&apos;est pas encore disponible : contrairement au format
        ci-dessus, elle nécessite une classification automatique du contenu qui n&apos;a pas encore été construite.
      </div>
    </main>
  );
}
