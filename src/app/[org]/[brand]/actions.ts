"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { VIEW_ROLE_COOKIE } from "@/lib/view-role";

export async function createInstagramAccountAction(
  orgSlug: string,
  brandSlug: string,
  brandId: string,
  formData: FormData,
) {
  const handle = String(formData.get("handle") ?? "").trim().replace(/^@/, "");
  if (!handle) return;

  const supabase = await createClient();
  await supabase.from("instagram_accounts").insert({ brand_id: brandId, handle });

  revalidatePath(`/${orgSlug}/${brandSlug}`);
}

export async function updateImportCadenceAction(orgSlug: string, brandSlug: string, accountId: string, formData: FormData) {
  const cadence = String(formData.get("cadence") ?? "");
  if (!["weekly", "monthly", "quarterly"].includes(cadence)) return;
  const supabase = await createClient();
  await supabase.from("instagram_accounts").update({ import_cadence: cadence }).eq("id", accountId);
  revalidatePath(`/${orgSlug}/${brandSlug}/parametres`);
}

export async function setIdentityAccessAction(
  orgSlug: string,
  brandSlug: string,
  brandId: string,
  userId: string,
  enabled: boolean,
) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_brand_identity_access", { p_brand_id: brandId, p_user_id: userId, p_enabled: enabled });
  if (error) throw new Error(error.message);
  revalidatePath(`/${orgSlug}/${brandSlug}/parametres`);
}

// Bascule agence/marque (cf. src/lib/view-role.ts) — n'affecte que l'affichage,
// jamais les droits réels (RLS). Réservée aux rôles agence côté serveur :
// resolveBrandContext() force viewRole="marque" pour un brand_viewer quel que
// soit le cookie, donc un appel direct par un brand_viewer est sans effet
// sur ce qui lui est réellement affiché.
export async function toggleViewRoleAction(orgSlug: string, brandSlug: string, formData: FormData) {
  const mode = String(formData.get("mode") ?? "agence") === "marque" ? "marque" : "agence";
  const store = await cookies();
  store.set(VIEW_ROLE_COOKIE, mode, { path: "/", maxAge: 60 * 60 * 24 * 30 });
  revalidatePath(`/${orgSlug}/${brandSlug}`, "layout");
}
