import { resolveBrandContext } from "@/lib/context/brand-context";
import { CATALOGUE, type CatalogueRating } from "@/lib/catalogue";
import { CatalogueBoard } from "./catalogue-board";

export default async function CataloguePage({
  params,
}: {
  params: Promise<{ org: string; brand: string }>;
}) {
  const { org: orgSlug, brand: brandSlug } = await params;
  const { supabase, accounts, canWriteView, role } = await resolveBrandContext(orgSlug, brandSlug);
  // Le catalogue est la seule action d'écriture pensée pour le CLIENT
  // (canWriteView reste réservé à l'agence partout ailleurs — import,
  // rattachement de compte, cadence...). Un brand_viewer réel doit
  // toujours pouvoir noter, même si viewRole est forcé à "marque" pour ce
  // rôle (cf. lib/view-role.ts) : sans ce cas explicite, aucun client
  // n'a jamais pu noter le catalogue qui existe précisément pour lui.
  const canRateCatalogue = canWriteView || role === "brand_viewer";

  if (accounts.length === 0) {
    return <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Aucun compte Instagram rattaché.</p>;
  }
  const account = accounts[0];

  const { data: entries } = await supabase
    .from("manual_entries")
    .select("entity_key, field, value_text")
    .eq("account_id", account.id)
    .eq("entity_type", "feature_catalog");

  const validSlugs = new Set(CATALOGUE.map((it) => it.slug));
  const initialRatings: Record<string, CatalogueRating> = {};
  const initialNotes: Record<string, string> = {};
  for (const e of entries ?? []) {
    if (!validSlugs.has(e.entity_key) || e.value_text == null) continue;
    if (e.field === "rating") initialRatings[e.entity_key] = e.value_text as CatalogueRating;
    if (e.field === "note") initialNotes[e.entity_key] = e.value_text;
  }

  return (
    <CatalogueBoard accountId={account.id} initialRatings={initialRatings} initialNotes={initialNotes} readOnly={!canRateCatalogue} />
  );
}
