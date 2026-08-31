// Community Intelligence — résolution org/marque/rôle partagée entre
// layout.tsx et chaque écran (qui la refait indépendamment aujourd'hui,
// chacun revalidé par la RLS de toute façon — cf. le repère laissé par
// l'agent d'exploration : ce doublon devenait coûteux dès le 3e écran).

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getViewRole, canToggleView, type ViewRole } from "@/lib/view-role";

export async function resolveBrandContext(orgSlug: string, brandSlug: string) {
  const supabase = await createClient();

  const { data: org } = await supabase.from("organizations").select("id, name, slug").eq("slug", orgSlug).single();
  if (!org) notFound();

  const { data: brand } = await supabase.from("brands").select("id, name, slug").eq("org_id", org.id).eq("slug", brandSlug).single();
  if (!brand) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: accounts }, { data: orgMembership }, { data: brandMembership }] = await Promise.all([
    supabase.from("instagram_accounts").select("id, handle, display_name, import_cadence").eq("brand_id", brand.id).order("handle"),
    supabase.from("organization_members").select("role").eq("org_id", org.id).eq("user_id", user!.id).maybeSingle(),
    supabase.from("brand_members").select("role, can_view_identities").eq("brand_id", brand.id).eq("user_id", user!.id).maybeSingle(),
  ]);

  const role = orgMembership?.role ?? brandMembership?.role ?? null;
  const viewRole: ViewRole = await getViewRole(role);

  return {
    supabase,
    org,
    brand,
    user,
    accounts: accounts ?? [],
    role,
    viewRole,
    canToggleView: canToggleView(role),
    canWriteView: viewRole === "agence",
  };
}
