import type { createClient as createServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ds";
import { fr, pct, shortDate } from "@/lib/format";
import { CustomWindowModal } from "./custom-window-modal";
import { DeleteWindowButton } from "./delete-window-button";

function eur(n: number | null) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
}

export async function CustomWindowsSection({
  supabase,
  orgSlug,
  brandSlug,
  accountId,
  canWriteView,
}: {
  supabase: Awaited<ReturnType<typeof createServerClient>>;
  orgSlug: string;
  brandSlug: string;
  accountId: string;
  canWriteView: boolean;
}) {
  const base = `/${orgSlug}/${brandSlug}`;

  const { data: windows } = await supabase
    .from("custom_acquisition_windows")
    .select("*")
    .eq("account_id", accountId)
    .order("window_start", { ascending: false });

  const rows = await Promise.all(
    (windows ?? []).map(async (w) => {
      const [{ data: stats }, { data: posts }] = await Promise.all([
        supabase.rpc("custom_window_stats", { p_account_id: accountId, p_window_start: w.window_start, p_window_end: w.window_end }).maybeSingle(),
        supabase
          .from("content")
          .select("id, thumb_path, published_at, media_type")
          .eq("account_id", accountId)
          .gte("published_at", w.window_start)
          .lte("published_at", `${w.window_end}T23:59:59`)
          .order("published_at"),
      ]);

      const thumbUrls = new Map<string, string>();
      await Promise.all(
        (posts ?? []).map(async (p) => {
          if (!p.thumb_path) return;
          const slash = p.thumb_path.indexOf("/");
          if (slash < 0) return;
          const bucket = p.thumb_path.slice(0, slash);
          const objectPath = p.thumb_path.slice(slash + 1);
          const { data } = await supabase.storage.from(bucket).createSignedUrl(objectPath, 3600);
          if (data?.signedUrl) thumbUrls.set(p.id, data.signedUrl);
        }),
      );

      const volume = stats?.volume ?? 0;
      const retained = stats?.retained ?? 0;
      const retentionRate = volume > 0 ? (retained / volume) * 100 : null;
      const coutBrut = w.budget_eur != null && volume > 0 ? w.budget_eur / volume : null;
      const coutRetenu = w.budget_eur != null && retained > 0 ? w.budget_eur / retained : null;

      return { window: w, volume, retained, retentionRate, coutBrut, coutRetenu, posts: posts ?? [], thumbUrls };
    }),
  );

  return (
    <Card variant="claire" interactive={false}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Périodes personnalisées</h2>
            <span style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 560, lineHeight: 1.5 }}>
              Choisissez vos propres dates pour chiffrer une campagne connue, même si le moteur n&apos;y a pas détecté de pic
              statistique. Mêmes règles que les pics automatiques : rétention mesurée aujourd&apos;hui, jamais projetée.
            </span>
          </div>
          {canWriteView && <CustomWindowModal orgSlug={orgSlug} brandSlug={brandSlug} accountId={accountId} />}
        </div>

        {rows.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Aucune période personnalisée pour le moment.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {rows.map(({ window: w, volume, retained, retentionRate, coutBrut, coutRetenu, posts, thumbUrls }) => (
              <div key={w.id} style={{ border: "1px solid var(--bordure-carte)", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>
                      {w.label || "Période sans nom"} · {shortDate(w.window_start)} → {shortDate(w.window_end)}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {fr(volume)} arrivées · {fr(retained)} encore présents ({pct(retentionRate, 0)})
                    </span>
                  </div>
                  {canWriteView && <DeleteWindowButton orgSlug={orgSlug} brandSlug={brandSlug} windowId={w.id} />}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>Budget</span>
                    <span style={{ fontSize: 18, fontWeight: 700 }}>{eur(w.budget_eur)}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>Coût brut</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-muted)" }}>{eur(coutBrut)}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>Coût conservé</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "var(--vert-logo)" }}>{eur(coutRetenu)}</span>
                  </div>
                </div>

                {posts.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {posts.length} publication{posts.length > 1 ? "s" : ""} sur cette période — pour repérer ce qui a pu jouer.
                    </span>
                    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                      {posts.map((p) => (
                        <a
                          key={p.id}
                          href={`${base}/contenu`}
                          title={`${shortDate(p.published_at)} · ${p.media_type}`}
                          style={{ flex: "0 0 auto", display: "block" }}
                        >
                          {thumbUrls.has(p.id) ? (
                            // eslint-disable-next-line @next/next/no-img-element -- URL signée temporaire, cf. contenu/page.tsx
                            <img
                              src={thumbUrls.get(p.id)}
                              alt=""
                              style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover", background: "var(--creme-fonce)" }}
                            />
                          ) : (
                            <div style={{ width: 64, height: 64, borderRadius: 10, background: "var(--creme-fonce)", display: "grid", placeItems: "center", fontSize: 10, color: "var(--text-muted)", textAlign: "center", padding: 4 }}>
                              {shortDate(p.published_at)}
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
