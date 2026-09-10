import { Card, Button } from "@/components/ds";
import { resolveBrandContext } from "@/lib/context/brand-context";
import { fr, eur, pct, shortDate } from "@/lib/format";
import { mockShopifyOverview, type ShopifyPost, type ShopifyPersonaCommerce } from "@/lib/shopify-mock";
import { PERSONA_DEFINITIONS, PERSONA_COLORS, type MediaType, type PersonaDefinition } from "@/lib/analyse-mock";
import { PersonaBadge } from "../analyse/persona-badge";
import { PublicationsTable } from "./publications-table";

// Page "Shopify" — AUCUNE partie de cette page n'a été vérifiée contre l'API
// Shopify Admin GraphQL (contrairement aux données Instagram d'Import/API,
// elles rejouées contre un compte réel le 08/09/2026). Shopify n'est pas
// branché sur ce compte : tout ce qui suit est une PROJECTION de ce que
// l'intégration produirait une fois en place, construite à partir de
// lib/shopify-mock.ts (générateur déterministe, cf. son en-tête pour la
// référence technique complète : version d'API, scopes, convention UTM,
// limite des 60 jours). Cette distinction (vérifié / projeté) reste interne
// au code — rien ne la distingue dans l'interface, à dessein : le client
// doit lire une page de démonstration cohérente, pas un rapport d'audit.
//
// Cohérence avec Import/API : les publications listées ici viennent de la
// MÊME requête `content` (mêmes 12 dernières publications, mêmes id) et les
// métriques Instagram (portée, clics en bio) sont produites par le MÊME
// mockMediaInsights avec les mêmes arguments — une publication présente sur
// les deux pages y affiche des chiffres identiques par construction.

const MEDIA_LABEL: Record<MediaType, string> = { post: "Post", reel: "Reel", story: "Story" };

function SectionTitle({ n, title, subtitle }: { n: number; title: string; subtitle?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>{n}.</span>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em" }}>{title}</h2>
      </div>
      {subtitle && <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 760 }}>{subtitle}</p>}
    </div>
  );
}

// Toute la page est en repli mock (rien n'est branché) : ce badge apparaît
// systématiquement, comme les sections encore non branchées d'Import/API.
function LiveSourceTag({ reason }: { reason: string }) {
  return (
    <span
      title={reason}
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

function MockCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1.5px dashed var(--bleu)", borderRadius: 16, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10, background: "var(--bleu-bg)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{title}</span>
        <span style={{ fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700, color: "var(--bleu)", background: "var(--surface-creme)", borderRadius: 999, padding: "3px 9px" }}>
          Exemple illustratif
        </span>
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--encre)", display: "flex", flexDirection: "column", gap: 6 }}>{children}</div>
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card variant="claire" interactive={false}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</div>
        <div style={{ fontSize: "clamp(24px, 2.4vw, 32px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.05 }}>{value}</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{sub}</div>
      </div>
    </Card>
  );
}

function PersonaCommerceCard({ persona, commerce }: { persona: PersonaDefinition; commerce: ShopifyPersonaCommerce }) {
  const colors = PERSONA_COLORS[persona.key];
  const trend = commerce.trendPts;
  return (
    <Card variant="claire" interactive={false}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: colors.text }}>{persona.name}</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>{eur(commerce.revenue)}</span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>CA attribué, 30 jours</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13 }}>
          <span style={{ color: "var(--text-muted)" }}>Commandes</span>
          <span style={{ fontWeight: 700 }}>{fr(commerce.orders)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13 }}>
          <span style={{ color: "var(--text-muted)" }}>Panier moyen</span>
          <span style={{ fontWeight: 700 }}>{eur(commerce.aov)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, fontSize: 13, borderTop: "1px solid var(--bordure-carte)", paddingTop: 8 }}>
          <span style={{ color: "var(--text-muted)" }}>Évolution 3 mois</span>
          <span style={{ fontWeight: 700, color: trend > 0 ? "var(--vert-logo)" : "var(--text-muted)" }}>
            {trend > 0 ? "↗" : trend < 0 ? "↘" : "→"} {trend > 0 ? `+${trend}` : trend} %
          </span>
        </div>
      </div>
    </Card>
  );
}

function FunnelStage({ label, value, note, unavailable }: { label: string; value?: string; note?: string; unavailable?: boolean }) {
  return (
    <div
      style={{
        flex: "1 1 210px", minWidth: 190, display: "flex", flexDirection: "column", gap: 6, padding: "16px 18px", borderRadius: 14,
        background: unavailable ? "var(--panneau)" : "var(--carte-claire)",
        border: unavailable ? "1.5px dashed var(--bordure)" : "1px solid var(--bordure-carte)",
      }}
    >
      <span style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</span>
      {unavailable ? (
        <span style={{ fontSize: 13, fontStyle: "italic", color: "var(--text-muted)", lineHeight: 1.4 }}>
          Indisponible aujourd&apos;hui — nécessite Google Analytics 4
        </span>
      ) : (
        <>
          <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>{value}</span>
          {note && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{note}</span>}
        </>
      )}
    </div>
  );
}

function FunnelArrow() {
  return (
    <span aria-hidden style={{ alignSelf: "center", fontSize: 18, color: "var(--text-muted)", padding: "0 2px" }}>
      →
    </span>
  );
}

export default async function ShopifyPage({
  params,
}: {
  params: Promise<{ org: string; brand: string }>;
}) {
  const { org: orgSlug, brand: brandSlug } = await params;
  const { supabase, accounts } = await resolveBrandContext(orgSlug, brandSlug);
  const base = `/${orgSlug}/${brandSlug}`;

  if (accounts.length === 0) {
    return (
      <main style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 480 }}>
        <Card variant="claire" interactive={false}>
          <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Aucun compte Instagram rattaché.</div>
        </Card>
      </main>
    );
  }
  const account = accounts[0];

  // Source : v_overview (followers_total) pour que mockMediaInsights (donc
  // portée/clics en bio) produise EXACTEMENT les mêmes valeurs qu'Import/API
  // pour une même publication ; content (id, media_type, published_at,
  // caption) — requête identique à Import/API (mêmes 12 dernières
  // publications), garantissant les mêmes id des deux côtés.
  const [{ data: overview }, { data: posts }] = await Promise.all([
    supabase.from("v_overview").select("*").eq("account_id", account.id).maybeSingle(),
    supabase
      .from("content")
      .select("id, media_type, published_at, caption")
      .eq("account_id", account.id)
      .in("media_type", ["post", "reel"])
      .not("caption", "is", null)
      .neq("caption", "")
      .order("published_at", { ascending: false })
      .limit(12),
  ]);

  const followersTotal = overview?.followers_total ?? 0;
  const rawPosts: ShopifyPost[] = (posts ?? []).map((p) => ({
    id: p.id,
    mediaType: p.media_type as MediaType,
    publishedAt: p.published_at,
    caption: p.caption ?? "",
  }));

  if (rawPosts.length === 0) {
    return (
      <main style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 480 }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>Shopify</h1>
        <Card variant="claire" interactive={false}>
          <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
            Aucune publication disponible pour @{account.handle} — cette page a besoin d&apos;au moins un import contenant des
            publications pour construire sa projection.
          </div>
          <Button href={`${base}/imports`}>Aller à Imports</Button>
        </Card>
      </main>
    );
  }

  const data = mockShopifyOverview(account.id, followersTotal, rawPosts);

  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 44, maxWidth: 1120, minWidth: 0, paddingBottom: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: "-0.01em" }}>Shopify</h1>
        <p style={{ margin: 0, fontSize: 15, color: "var(--text-muted)" }}>
          Ce que l&apos;outil affichera une fois la boutique @{account.handle} branchée — aucune donnée réelle ci-dessous.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, background: "var(--panneau)", border: "1px solid var(--bordure)", borderRadius: 18, padding: "18px 22px", maxWidth: 720 }}>
          <span style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, lineHeight: 1.5 }}>
            <span aria-hidden style={{ color: "var(--text-muted)", fontWeight: 800 }}>—</span>
            Shopify n&apos;est pas encore branché : toutes les données de cette page sont simulées, à titre de projection.
          </span>
          <div style={{ background: "var(--pastel-jaune)", borderRadius: 14, padding: "12px 16px", fontSize: 14, color: "var(--encre)", lineHeight: 1.5, fontWeight: 600 }}>
            À faire dès maintenant, avant le branchement : mettre en place le marquage UTM sur chaque lien en bio
            (utm_source=instagram, utm_medium, utm_campaign, utm_content). Sans ce marquage en place au moment du
            branchement, les ventes passées ne pourront jamais être rattachées à une publication a posteriori.
          </div>
          <span style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, lineHeight: 1.5 }}>
            <span aria-hidden style={{ color: "var(--text-muted)", fontWeight: 800 }}>—</span>
            Les scopes prévus (read_orders, read_products, read_inventory, read_discounts, read_returns) ne touchent
            aucune donnée client protégée (nom, e-mail, adresse, téléphone).
          </span>
        </div>
      </div>

      {/* 1. Vue d'ensemble
          GET orders — champs createdAt, totalPriceSet, customAttributes
          (NÉCESSITE UTM pour le rattachement, cf. utm_content). Scope
          read_orders. Fraîcheur envisagée : quotidienne. Fenêtre : 30
          derniers jours (rappel limite : commandes >60 jours hors scope
          par défaut, scope read_all_orders nécessaire au-delà — détaillé
          en section 10). */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle n={1} title="Vue d'ensemble" subtitle="Attribution du CA à Instagram, 30 derniers jours." />
        <LiveSourceTag reason="Shopify non branché — orders (createdAt, totalPriceSet, customAttributes), scope read_orders" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
          <KpiCard label="CA attribué à Instagram" value={eur(data.revenue30d)} sub="30 derniers jours" />
          <KpiCard label="Commandes" value={fr(data.orders30d)} sub="attribuées à Instagram · 30 jours" />
          <KpiCard label="Panier moyen" value={eur(data.aov30d)} sub="commandes attribuées · 30 jours" />
          <KpiCard
            label="Part du CA total"
            value={pct(data.shareOfTotalRevenue * 100, 0)}
            sub={`sur ${eur(data.totalStoreRevenue30d)} de CA boutique · 30 jours`}
          />
        </div>
      </div>

      {/* 2. CA par publication
          orders filtrées sur customAttributes.utm_content (NÉCESSITE UTM),
          croisées avec GET /media (caption, media_product_type) et
          GET /{media-id}/insights (reach) côté Instagram. Scope read_orders
          + jeton Instagram (Import/API). Fraîcheur envisagée : quotidienne. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle
          n={2}
          title="CA par publication"
          subtitle="Une ligne par publication, triée par CA généré — pas nécessairement la même publication qui a la plus grande portée."
        />
        <LiveSourceTag reason="Shopify non branché — orders filtrées sur customAttributes.utm_content (NÉCESSITE UTM), croisées avec /media et /{media-id}/insights" />
        <PublicationsTable rows={data.posts} />
      </div>

      {/* 3. Produits vendus par contenu
          Pour les 3 publications au CA le plus élevé : orders > lineItems
          (variant, quantity, originalTotalSet). Scope read_orders +
          read_products (nom produit / variante). Fraîcheur envisagée :
          quotidienne. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle n={3} title="Produits vendus par contenu" subtitle="Détail des références vendues pour les 3 publications au CA le plus élevé." />
        <LiveSourceTag reason="Shopify non branché — orders > lineItems (variant, quantity, originalTotalSet), scopes read_orders + read_products" />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {data.topPostsLineItems.map(({ postId, items }) => {
            const post = data.posts.find((p) => p.id === postId);
            if (!post) return null;
            const sorted = [...items].sort((a, b) => b.revenue - a.revenue);
            const top = sorted[0];
            return (
              <Card key={postId} variant="claire" interactive={false}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>
                      {MEDIA_LABEL[post.mediaType]} du {shortDate(post.publishedAt)}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <PersonaBadge personaKey={post.personaKey} />
                      <span style={{ fontSize: 15, fontWeight: 800 }}>{eur(post.revenue)}</span>
                    </div>
                  </div>
                  <div style={{ overflowX: "auto", minWidth: 0 }}>
                    <table style={{ width: "100%", minWidth: 480, fontSize: 13, borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ textAlign: "left", color: "var(--text-muted)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                          <th style={{ padding: "0 10px 8px 0", fontWeight: 600 }}>Produit</th>
                          <th style={{ padding: "0 10px 8px 0", fontWeight: 600 }}>Variante</th>
                          <th style={{ padding: "0 10px 8px 0", fontWeight: 600, textAlign: "right" }}>Quantité</th>
                          <th style={{ padding: "0 10px 8px 0", fontWeight: 600, textAlign: "right" }}>CA</th>
                          <th style={{ padding: "0 0 8px", fontWeight: 600, textAlign: "right" }}>Part de la publication</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sorted.map((item, i) => (
                          <tr key={`${item.product}-${i}`} style={{ borderTop: "1px solid var(--bordure-carte)" }}>
                            <td style={{ padding: "8px 10px 8px 0" }}>{item.product}</td>
                            <td style={{ padding: "8px 10px", color: "var(--text-muted)" }}>{item.variant}</td>
                            <td style={{ padding: "8px 10px", textAlign: "right" }}>{fr(item.quantity)}</td>
                            <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700 }}>{eur(item.revenue)}</td>
                            <td style={{ padding: "8px 0", textAlign: "right", color: "var(--text-muted)" }}>{pct(item.shareOfPost * 100, 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {top && (
                    <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
                      {eur(post.revenue)} dont {pct(top.shareOfPost * 100, 0)} sur le {top.product.toLowerCase()}, taille {top.variant}.
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 4. Panier moyen par persona
          orders > customer + lineItems, rapprochés du persona dominant des
          publications à l'origine de la commande (customAttributes.
          utm_content, NÉCESSITE UTM). Scope read_orders. Fraîcheur
          envisagée : hebdomadaire (tendance 3 mois recalculée). */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle n={4} title="Panier moyen par persona" subtitle="Le persona qui génère le plus de CA n'est pas nécessairement celui au panier le plus élevé." />
        <LiveSourceTag reason="Shopify non branché — orders rapprochées du persona dominant de la publication d'origine (NÉCESSITE UTM), scope read_orders" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {PERSONA_DEFINITIONS.map((persona) => {
            const commerce = data.personaCommerce.find((c) => c.key === persona.key);
            if (!commerce) return null;
            return <PersonaCommerceCard key={persona.key} persona={persona} commerce={commerce} />;
          })}
        </div>
      </div>

      {/* 5. Entonnoir de conversion
          Étages 1-2 : Instagram, GET /{ig-user-id}/insights (reach) et
          GET /{media-id}/insights breakdown=action_type→bio_link_clicked
          (profil_activity). Étage 3 (sessions site) : NÉCESSITE GA4, non
          disponible aujourd'hui — affiché, pas masqué. Étage 4 : Shopify,
          orders, scope read_orders. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle n={5} title="Entonnoir de conversion" subtitle="De la portée Instagram à la commande Shopify." />
        <LiveSourceTag reason="Étages 1-2 : Instagram (reach, profile_activity). Étage 3 : nécessite GA4, non branché. Étage 4 : Shopify (orders), non branché." />
        <div style={{ overflowX: "auto", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "stretch", gap: 4, minWidth: 860 }}>
            <FunnelStage label="Portée" value={fr(data.funnel.reach)} note="comptes touchés · 30 jours" />
            <FunnelArrow />
            <FunnelStage
              label="Clics lien en bio"
              value={fr(data.funnel.bioLinkClicks)}
              note={data.funnel.reach > 0 ? `${pct((data.funnel.bioLinkClicks / data.funnel.reach) * 100, 1)} de la portée` : undefined}
            />
            <FunnelArrow />
            <FunnelStage label="Sessions site" unavailable />
            <FunnelArrow />
            <FunnelStage
              label="Commandes"
              value={fr(data.funnel.orders)}
              note={data.funnel.bioLinkClicks > 0 ? `${pct((data.funnel.orders / data.funnel.bioLinkClicks) * 100, 1)} des clics lien en bio` : undefined}
            />
          </div>
        </div>
      </div>

      {/* 6. Alerte rupture
          GET /{media-id}/comments (mentions de taille) × inventoryLevels
          (stock par variante). Scopes read_products + read_inventory +
          jeton Instagram (webhook comments). Fraîcheur envisagée :
          quotidienne pour le stock, hebdomadaire pour l'accumulation des
          signaux commentaires. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle n={6} title="Alerte rupture" subtitle="Croisement des demandes de taille en commentaires avec le stock réel." />
        <LiveSourceTag reason="Shopify non branché — GET /{media-id}/comments × inventoryLevels, scopes read_products + read_inventory" />
        {data.ruptureAlerts.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Aucune alerte sur la période.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            {data.ruptureAlerts.map((alert) => (
              <MockCard key={alert.product} title={alert.product}>
                <p style={{ margin: 0 }}>
                  {alert.signalCount} signaux en {alert.windowDays} jours, dont{" "}
                  {alert.sizeBreakdown.map((s) => `${s.mentions}× ${s.size}`).join(", ")}.
                </p>
                <p style={{ margin: 0 }}>Stock : {alert.stockBySize.map((s) => `${s.stock} en ${s.size}`).join(", ")}.</p>
                <p style={{ margin: 0, fontWeight: 700 }}>Estimation demande non captée : {fr(alert.estimatedMissedDemand)} unités.</p>
              </MockCard>
            ))}
          </div>
        )}
      </div>

      {/* 7. Codes promo par publication
          discountNodes, priceRules (uses, CA généré). Seconde méthode
          d'attribution, indépendante des UTM — capte aussi les achats en
          boutique et ceux échappant au marquage du lien, donc jamais recalée
          sur les totaux de la section 1. Scope read_discounts. Fraîcheur
          envisagée : quotidienne. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle n={7} title="Codes promo par publication" subtitle="Un code par publication — seconde méthode d'attribution, indépendante du marquage de lien." />
        <LiveSourceTag reason="Shopify non branché — discountNodes, priceRules, scope read_discounts" />
        <Card variant="claire" interactive={false}>
          <div style={{ overflowX: "auto", minWidth: 0 }}>
            <table style={{ width: "100%", minWidth: 560, fontSize: 13, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--text-muted)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  <th style={{ padding: "0 10px 10px 0", fontWeight: 600 }}>Code</th>
                  <th style={{ padding: "0 10px 10px 0", fontWeight: 600 }}>Publication</th>
                  <th style={{ padding: "0 10px 10px 0", fontWeight: 600, textAlign: "right" }}>Utilisations</th>
                  <th style={{ padding: "0 10px 10px 0", fontWeight: 600, textAlign: "right" }}>CA généré</th>
                  <th style={{ padding: "0 0 10px", fontWeight: 600, textAlign: "right" }}>Panier moyen</th>
                </tr>
              </thead>
              <tbody>
                {data.promoCodes.map((code) => {
                  const post = data.posts.find((p) => p.id === code.postId);
                  return (
                    <tr key={code.code} style={{ borderTop: "1px solid var(--bordure-carte)" }}>
                      <td style={{ padding: "9px 10px 9px 0", fontWeight: 700, fontFamily: "monospace", fontSize: 12 }}>{code.code}</td>
                      <td style={{ padding: "9px 10px", color: "var(--text-muted)" }}>
                        {post ? `${MEDIA_LABEL[post.mediaType]} du ${shortDate(post.publishedAt)}` : "—"}
                      </td>
                      <td style={{ padding: "9px 10px", textAlign: "right" }}>{fr(code.uses)}</td>
                      <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: 700 }}>{eur(code.revenue)}</td>
                      <td style={{ padding: "9px 0", textAlign: "right", color: "var(--text-muted)" }}>{eur(code.aov)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p style={{ margin: "12px 0 0", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
            Les codes captent aussi les achats en boutique et ceux qui échappent au marquage du lien en bio — à ne pas
            recouper directement avec le CA de la section 2.
          </p>
        </Card>
      </div>

      {/* 8. Retours
          returns, refunds (reason). Scope read_returns. Fraîcheur
          envisagée : quotidienne. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle n={8} title="Retours" subtitle="Taux de retour par référence et par publication, avec motif." />
        <LiveSourceTag reason="Shopify non branché — returns, refunds (reason), scope read_returns" />
        <Card variant="claire" interactive={false}>
          <div style={{ overflowX: "auto", minWidth: 0 }}>
            <table style={{ width: "100%", minWidth: 560, fontSize: 13, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--text-muted)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  <th style={{ padding: "0 10px 10px 0", fontWeight: 600 }}>Produit</th>
                  <th style={{ padding: "0 10px 10px 0", fontWeight: 600 }}>Publication liée</th>
                  <th style={{ padding: "0 10px 10px 0", fontWeight: 600, textAlign: "right" }}>Taux de retour</th>
                  <th style={{ padding: "0 0 10px", fontWeight: 600 }}>Motif dominant</th>
                </tr>
              </thead>
              <tbody>
                {data.returns.map((row) => {
                  const post = data.posts.find((p) => p.id === row.postId);
                  return (
                    <tr key={row.product} style={{ borderTop: "1px solid var(--bordure-carte)" }}>
                      <td style={{ padding: "9px 10px 9px 0" }}>{row.product}</td>
                      <td style={{ padding: "9px 10px", color: "var(--text-muted)" }}>
                        {post ? `${MEDIA_LABEL[post.mediaType]} du ${shortDate(post.publishedAt)}` : "—"}
                      </td>
                      <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: 700, color: row.rate >= 0.15 ? "var(--encre)" : "var(--text-muted)" }}>
                        {pct(row.rate * 100, 0)}
                      </td>
                      <td style={{ padding: "9px 0", color: "var(--text-muted)" }}>{row.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p style={{ margin: "12px 0 0", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
            Un taux de retour élevé signale le plus souvent un problème de taille ou de description — à croiser avec les
            questions de taille laissées en commentaire (section 6).
          </p>
        </Card>
      </div>

      {/* 9. Clients
          orders > customer (numberOfOrders uniquement — aucun nom, e-mail,
          ligne nominative). Scope read_orders. Fraîcheur envisagée :
          hebdomadaire. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle n={9} title="Clients" subtitle="Agrégats uniquement — aucune ligne nominative." />
        <LiveSourceTag reason="Shopify non branché — orders > customer (numberOfOrders uniquement), scope read_orders" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
          <KpiCard label="Nouveaux clients" value={fr(data.customers.newCustomers)} sub="commandes attribuées à Instagram · 30 jours" />
          <KpiCard label="Clients récurrents" value={fr(data.customers.returningCustomers)} sub="commandes attribuées à Instagram · 30 jours" />
          <KpiCard label="Délai moyen entre deux commandes" value={`${fr(data.customers.avgDaysBetweenOrders)} j`} sub="clients récurrents" />
        </div>
      </div>

      {/* 10. Ce qu'on ne pourra pas récupérer — même traitement que
          Import/API : signaler plutôt que masquer. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionTitle n={10} title="Ce qu'on ne pourra pas récupérer" />
        <div style={{ background: "var(--panneau)", border: "1px solid var(--bordure)", borderRadius: 18, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            "CA par tranche d'âge — aucune clé ne relie une commande Shopify à la démographie Instagram.",
            "Parcours de navigation sur le site — relève de Google Analytics 4, pas de l'API Shopify.",
            "Visiteurs qui n'achètent pas et n'abandonnent pas de panier — cette population n'existe dans aucun objet de l'API Shopify.",
            "Commandes de plus de 60 jours — hors scope par défaut, nécessite read_all_orders sur demande à Shopify.",
          ].map((item) => (
            <span key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "var(--encre)", lineHeight: 1.5 }}>
              <span aria-hidden style={{ color: "var(--text-muted)", fontWeight: 800 }}>—</span>
              {item}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
