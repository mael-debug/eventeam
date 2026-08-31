import { resolveBrandContext } from "@/lib/context/brand-context";
import { CATALOGUE, type CatalogueRating } from "@/lib/catalogue";
import { CatalogueBoard } from "./catalogue-board";

export default async function CataloguePage({
  params,
}: {
  params: Promise<{ org: string; brand: string }>;
}) {
  const { org: orgSlug, brand: brandSlug } = await params;
  const { supabase, accounts, canWriteView } = await resolveBrandContext(orgSlug, brandSlug);

  if (accounts.length === 0) {
    return <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Aucun compte Instagram rattaché.</p>;
  }
  const account = accounts[0];

  const { data: entries } = await supabase
    .from("manual_entries")
    .select("entity_key, field, value_text")
    .eq("account_id", account.id)
    .eq("entity_type", "feature_catalog");

  const validSlugs = new Set(CATALOGUE.flatMap((g) => g.items.map((it) => it.slug)));
  const initialRatings: Record<string, CatalogueRating> = {};
  const initialNotes: Record<string, string> = {};
  for (const e of entries ?? []) {
    if (!validSlugs.has(e.entity_key) || e.value_text == null) continue;
    if (e.field === "rating") initialRatings[e.entity_key] = e.value_text as CatalogueRating;
    if (e.field === "note") initialNotes[e.entity_key] = e.value_text;
  }

  return (
    <CatalogueBoard accountId={account.id} initialRatings={initialRatings} initialNotes={initialNotes} readOnly={!canWriteView} />
  );
}
