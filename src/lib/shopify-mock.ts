// Community Intelligence — mock déterministe pour la page Shopify.
//
// RIEN de ce fichier n'a été vérifié contre l'API Shopify — aucun appel
// n'a été exécuté, à la différence des données Instagram d'Import/API qui,
// elles, l'ont été le 08/09/2026. Tout ce qui suit est une PROJECTION de ce
// que l'intégration Shopify Admin GraphQL (version 2026-07 ; 2026-10 en
// release candidate) produirait une fois branchée. L'API REST Shopify est
// en fin de vie et n'est mentionnée nulle part ici.
//
// Scopes minimaux, aucun ne touche à une donnée client protégée (nom,
// e-mail, adresse, téléphone) — read_orders, read_products, read_inventory,
// read_discounts, read_returns.
//
// Le rattachement publication ↔ vente repose entièrement sur les attributs
// de session Shopify (landingPage, referrerUrl, paramètres UTM) portés par
// chaque commande. Convention utilisée dans tous les exemples ci-dessous :
//   utm_source=instagram
//   utm_medium=bio | story
//   utm_campaign=<collection>
//   utm_content=<AAAA-MM-JJ>-<format>
// Sans ce marquage (à mettre en place AVANT le branchement), aucune vente
// passée ne pourra jamais être rattachée à une publication a posteriori.
//
// Limite documentée : seules les commandes des 60 derniers jours sont
// accessibles par défaut (scope read_all_orders nécessaire au-delà, sur
// demande à Shopify — aucune démarche d'approbation liée aux données
// protégées, ces scopes n'en touchent aucune).
//
// Cohérence avec Import/API : ce module reprend PERSONA_DEFINITIONS,
// PERSONA_COLORS et mockMediaInsights depuis analyse-mock.ts plutôt que de
// dupliquer quoi que ce soit — une publication qui apparaît sur les deux
// pages y affiche exactement les mêmes portée/likes/clics en bio, parce que
// c'est littéralement le même appel de fonction, avec les mêmes arguments
// (id de contenu réel + followersTotal du compte).

import { PERSONA_DEFINITIONS, mockMediaInsights, type MediaType, type PersonaKey } from "@/lib/analyse-mock";

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rng(seed: string) {
  return mulberry32(hashSeed(seed));
}

function between(r: () => number, min: number, max: number): number {
  return Math.round(min + r() * (max - min));
}

export interface ShopifyPost {
  id: string;
  mediaType: MediaType;
  publishedAt: string;
  caption: string;
}

// Nom affiché d'une publication — la vraie légende importée (content.
// caption), jamais un libellé générique de type "Reel du 12/03" : ne garde
// que la première ligne (les légendes multi-lignes commencent presque
// toujours par l'accroche, le reste est hashtags/mentions) et tronque à
// une longueur de tableau raisonnable.
export function postDisplayName(caption: string, maxLen = 64): string {
  const firstLine = caption.split("\n")[0]?.trim() ?? "";
  if (firstLine.length === 0) return "(légende vide)";
  return firstLine.length > maxLen ? `${firstLine.slice(0, maxLen - 1).trimEnd()}…` : firstLine;
}

// Persona dominant d'une publication — indépendant de mockCommenterPersona
// (analyse-mock.ts, qui classe des COMMENTATEURS) : ici on classe la
// publication elle-même, par sa légende (④ dans le commentaire de section
// 2 plus bas). Simulé — la classification par LLM n'est pas branchée.
function mockPostPersona(accountId: string, postId: string): PersonaKey {
  const r = rng(`${accountId}:shopify:post-persona:${postId}`);
  return PERSONA_DEFINITIONS[Math.floor(r() * PERSONA_DEFINITIONS.length)].key;
}

// Fourchette de panier moyen par persona — reflète un archétype d'achat
// plausible (Rugby Lifestyle : volume, jerseys/accessoires ; Casual
// Premium : peu de pièces mais plus chères, blazers/chinos), pas une
// mesure. Sert à garantir par construction que le persona qui génère le
// PLUS de CA (probablement Rugby Lifestyle, cœur historique de la
// communauté, donc le plus de publications et de commandes) n'est jamais
// celui qui a le panier le plus élevé — l'arbitrage volume/marge demandé
// en section 4.
const PERSONA_AOV_RANGE: Record<PersonaKey, [number, number]> = {
  "rugby-lifestyle": [45, 78],
  "sport-outdoor": [55, 88],
  "urban-lifestyle": [72, 105],
  "casual-premium": [115, 165],
};

const PRODUCT_CATALOG: { name: string; variants: string[]; personas: PersonaKey[] }[] = [
  { name: "Polo marine col contrasté", variants: ["S", "M", "L", "XL"], personas: ["rugby-lifestyle", "casual-premium"] },
  { name: "Maillot replica XV de rugby", variants: ["S", "M", "L", "XL", "XXL"], personas: ["rugby-lifestyle"] },
  { name: "Blazer chino tailored", variants: ["46", "48", "50", "52"], personas: ["casual-premium"] },
  { name: "Chemise oxford rayée", variants: ["S", "M", "L"], personas: ["casual-premium", "urban-lifestyle"] },
  { name: "Écharpe jacquard héritage", variants: ["Taille unique"], personas: ["rugby-lifestyle", "urban-lifestyle"] },
  { name: "Sneakers cuir cousu", variants: ["40", "41", "42", "43", "44"], personas: ["urban-lifestyle"] },
  { name: "Coupe-vent running technique", variants: ["S", "M", "L", "XL"], personas: ["sport-outdoor"] },
  { name: "Short training performance", variants: ["S", "M", "L", "XL"], personas: ["sport-outdoor"] },
  { name: "Nœud papillon rose édition limitée", variants: ["Taille unique"], personas: ["rugby-lifestyle", "casual-premium"] },
  { name: "Sac week-end toile enduite", variants: ["Taille unique"], personas: ["urban-lifestyle", "casual-premium"] },
];

export interface ShopifyPostRow {
  id: string;
  mediaType: MediaType;
  publishedAt: string;
  caption: string;
  personaKey: PersonaKey;
  reach: number;
  likes: number | null;
  bioLinkClicks: number | null;
  orders: number;
  revenue: number;
  aov: number | null;
}

export interface ShopifyLineItem {
  product: string;
  variant: string;
  quantity: number;
  revenue: number;
  shareOfPost: number;
}

export interface ShopifyPersonaCommerce {
  key: PersonaKey;
  revenue: number;
  orders: number;
  aov: number;
  trendPts: number;
}

export interface ShopifyPromoCode {
  code: string;
  postId: string;
  uses: number;
  revenue: number;
  aov: number;
}

export interface ShopifyReturnRow {
  product: string;
  postId: string | null;
  rate: number;
  reason: string;
}

export interface RuptureAlert {
  product: string;
  signalCount: number;
  windowDays: number;
  sizeBreakdown: { size: string; mentions: number }[];
  stockBySize: { size: string; stock: number }[];
  estimatedMissedDemand: number;
}

export interface ShopifyOverview {
  revenue30d: number;
  orders30d: number;
  aov30d: number;
  shareOfTotalRevenue: number;
  totalStoreRevenue30d: number;
  posts: ShopifyPostRow[];
  topPostsLineItems: { postId: string; items: ShopifyLineItem[] }[];
  personaCommerce: ShopifyPersonaCommerce[];
  funnel: { reach: number; bioLinkClicks: number; orders: number };
  ruptureAlerts: RuptureAlert[];
  promoCodes: ShopifyPromoCode[];
  returns: ShopifyReturnRow[];
  customers: { newCustomers: number; returningCustomers: number; avgDaysBetweenOrders: number };
}

// GET orders (createdAt, totalPriceSet, customAttributes) filtrées sur
// utm_content — NÉCESSITE UTM — croisées avec GET /media (caption,
// media_product_type) et GET /{media-id}/insights (reach, total_
// interactions) côté Instagram. mockMediaInsights est appelée avec les
// MÊMES arguments (id réel, media_type, followersTotal) que sur Import/API :
// portée et clics en bio identiques des deux côtés pour une même
// publication, par construction plutôt que par coïncidence.
export function mockShopifyOverview(accountId: string, followersTotal: number, rawPosts: ShopifyPost[]): ShopifyOverview {
  const r = rng(`${accountId}:shopify:overview`);

  // --- Section 2 : CA par publication ------------------------------------
  const withReach = rawPosts.map((p) => {
    const insights = mockMediaInsights(p.id, p.mediaType, followersTotal);
    const bioLinkClicks =
      insights.profileActivity?.byAction.find((row) => row.label === "Clic sur le lien en bio")?.value ?? (p.mediaType === "reel" ? null : 0);
    return { post: p, insights, bioLinkClicks };
  });

  // Garantit que le classement par CA diffère nettement du classement par
  // portée : le post à la plus forte portée voit ses commandes délibérément
  // écrasées, un post à portée modeste voit les siennes délibérément
  // gonflées — c'est la démonstration centrale de la section.
  const byReachDesc = [...withReach].sort((a, b) => b.insights.reach - a.insights.reach);
  const suppressedId = byReachDesc[0]?.post.id;
  const boostedId = byReachDesc[Math.floor(byReachDesc.length * 0.7)]?.post.id ?? byReachDesc[byReachDesc.length - 1]?.post.id;

  const posts: ShopifyPostRow[] = withReach.map(({ post, insights, bioLinkClicks }) => {
    const personaKey = mockPostPersona(accountId, post.id);
    const [aovMin, aovMax] = PERSONA_AOV_RANGE[personaKey];
    const aov = between(r, aovMin, aovMax);
    const commercialWeight = post.id === suppressedId ? 0.15 : post.id === boostedId ? 2.4 : between(r, 55, 155) / 100;
    const baseOrders = between(r, 3, 16);
    const orders = Math.max(0, Math.round(baseOrders * commercialWeight));
    const revenue = orders * aov;
    return {
      id: post.id,
      mediaType: post.mediaType,
      publishedAt: post.publishedAt,
      caption: post.caption,
      personaKey,
      reach: insights.reach,
      likes: insights.likes,
      bioLinkClicks,
      orders,
      revenue,
      aov: orders > 0 ? aov : null,
    };
  });

  const revenue30d = posts.reduce((s, p) => s + p.revenue, 0);
  const orders30d = posts.reduce((s, p) => s + p.orders, 0);
  const aov30d = orders30d > 0 ? Math.round(revenue30d / orders30d) : 0;
  const shareOfTotalRevenue = between(r, 15, 34) / 100;
  const totalStoreRevenue30d = shareOfTotalRevenue > 0 ? Math.round(revenue30d / shareOfTotalRevenue) : revenue30d;

  // --- Section 3 : produits vendus, top 3 publications par CA -------------
  const top3 = [...posts].sort((a, b) => b.revenue - a.revenue).slice(0, 3);
  const topPostsLineItems = top3.map((post) => {
    const catalogForPersona = PRODUCT_CATALOG.filter((p) => p.personas.includes(post.personaKey));
    const pool = catalogForPersona.length > 0 ? catalogForPersona : PRODUCT_CATALOG;
    const itemCount = between(r, 2, 3);
    const chosen: typeof PRODUCT_CATALOG = [];
    const usedNames = new Set<string>();
    while (chosen.length < itemCount && chosen.length < pool.length) {
      const candidate = pool[Math.floor(r() * pool.length)];
      if (usedNames.has(candidate.name)) continue;
      usedNames.add(candidate.name);
      chosen.push(candidate);
    }
    const weights = chosen.map(() => between(r, 30, 100));
    const weightSum = weights.reduce((s, w) => s + w, 0);
    const items: ShopifyLineItem[] = chosen.map((product, i) => {
      const share = weightSum > 0 ? weights[i] / weightSum : 1 / chosen.length;
      const itemRevenue = Math.round(post.revenue * share);
      const variant = product.variants[Math.floor(r() * product.variants.length)];
      const unitPrice = Math.max(20, Math.round(itemRevenue / Math.max(1, between(r, 1, 3))));
      const quantity = Math.max(1, Math.round(itemRevenue / unitPrice));
      return { product: product.name, variant, quantity, revenue: itemRevenue, shareOfPost: share };
    });
    return { postId: post.id, items };
  });

  // --- Section 4 : panier moyen par persona --------------------------------
  const personaCommerce: ShopifyPersonaCommerce[] = PERSONA_DEFINITIONS.map((def) => {
    const postsOfPersona = posts.filter((p) => p.personaKey === def.key);
    const revenue = postsOfPersona.reduce((s, p) => s + p.revenue, 0);
    const orders = postsOfPersona.reduce((s, p) => s + p.orders, 0);
    const aov = orders > 0 ? Math.round(revenue / orders) : 0;
    const trendPts = between(r, -12, 22);
    return { key: def.key, revenue, orders, aov, trendPts };
  });

  // Garantit que le persona générant le plus de CA n'est pas celui au
  // panier moyen le plus élevé — l'arbitrage volume/marge de la section 4.
  // PERSONA_AOV_RANGE le rend probable mais pas certain selon la
  // répartition des publications par persona pour ce compte ; correction
  // explicite si les deux se recoupent malgré tout : on resserre le nombre
  // de commandes du 2e persona par CA (jamais son CA, pour ne pas rompre
  // l'égalité des totaux avec les sections 1 et 2) jusqu'à dépasser le
  // panier moyen du 1er.
  {
    const byRevenueDesc = [...personaCommerce].sort((a, b) => b.revenue - a.revenue);
    const revenueLeader = byRevenueDesc[0];
    const currentAovLeader = [...personaCommerce].sort((a, b) => b.aov - a.aov)[0];
    if (revenueLeader && currentAovLeader && revenueLeader.key === currentAovLeader.key) {
      const challenger = byRevenueDesc.find((p) => p.key !== revenueLeader.key && p.revenue > 0);
      if (challenger) {
        const targetAov = revenueLeader.aov + between(r, 8, 30);
        challenger.orders = Math.max(1, Math.floor(challenger.revenue / targetAov));
        challenger.aov = Math.round(challenger.revenue / challenger.orders);
      }
    }
  }

  // --- Section 5 : entonnoir de conversion ---------------------------------
  const funnel = {
    reach: posts.reduce((s, p) => s + p.reach, 0),
    bioLinkClicks: posts.reduce((s, p) => s + (p.bioLinkClicks ?? 0), 0),
    orders: orders30d,
  };

  // --- Section 6 : alertes rupture (produit × commentaires × stock) -------
  const RUPTURE_CANDIDATES = ["Polo marine col contrasté", "Maillot replica XV de rugby", "Nœud papillon rose édition limitée"];
  const ruptureAlerts: RuptureAlert[] = RUPTURE_CANDIDATES.map((product) => {
    const catalogEntry = PRODUCT_CATALOG.find((p) => p.name === product)!;
    const sizeBreakdown = catalogEntry.variants
      .map((size) => ({ size, mentions: between(r, 0, 14) }))
      .filter((row) => row.mentions > 0)
      .sort((a, b) => b.mentions - a.mentions);
    const signalCount = sizeBreakdown.reduce((s, row) => s + row.mentions, 0);
    const stockBySize = catalogEntry.variants.map((size) => {
      const isMentioned = sizeBreakdown.some((row) => row.size === size && row.mentions >= 5);
      return { size, stock: isMentioned ? between(r, 0, 1) : between(r, 0, 12) };
    });
    const estimatedMissedDemand = Math.round(signalCount * (between(r, 60, 90) / 100));
    return { product, signalCount, windowDays: 10, sizeBreakdown, stockBySize, estimatedMissedDemand };
  }).filter((alert) => alert.signalCount > 0);

  // --- Section 7 : codes promo par publication -----------------------------
  // Seconde méthode d'attribution, délibérément indépendante des chiffres
  // UTM ci-dessus (un code capte aussi les achats en boutique et ceux qui
  // échappent au marquage du lien) — jamais recalée sur les totaux du haut.
  const promoCodes: ShopifyPromoCode[] = posts.slice(0, Math.min(8, posts.length)).map((post) => {
    const d = new Date(post.publishedAt);
    const dateTag = Number.isNaN(d.getTime()) ? "0000-00-00" : d.toISOString().slice(0, 10);
    const uses = between(r, 4, 60);
    const aov = between(r, 45, 140);
    return { code: `EDENPARK-${dateTag}-${post.mediaType.toUpperCase()}`, postId: post.id, uses, revenue: uses * aov, aov };
  });

  // --- Section 8 : retours --------------------------------------------------
  const RETURN_REASONS = ["Taille ne correspondait pas", "Produit différent de la description", "Défaut constaté", "Changement d'avis"];
  const returns: ShopifyReturnRow[] = PRODUCT_CATALOG.slice(0, 6).map((product, i) => {
    const linkedPost = posts[i % Math.max(1, posts.length)];
    return {
      product: product.name,
      postId: linkedPost?.id ?? null,
      rate: between(r, 2, 22) / 100,
      reason: RETURN_REASONS[Math.floor(r() * RETURN_REASONS.length)],
    };
  });

  // --- Section 9 : clients (agrégats uniquement) ---------------------------
  const returningCustomers = Math.round(orders30d * (between(r, 15, 35) / 100));
  const newCustomers = Math.max(0, Math.round(orders30d * (between(r, 55, 75) / 100)));
  const customers = { newCustomers, returningCustomers, avgDaysBetweenOrders: between(r, 35, 95) };

  return {
    revenue30d,
    orders30d,
    aov30d,
    shareOfTotalRevenue,
    totalStoreRevenue30d,
    posts,
    topPostsLineItems,
    personaCommerce,
    funnel,
    ruptureAlerts,
    promoCodes,
    returns,
    customers,
  };
}
