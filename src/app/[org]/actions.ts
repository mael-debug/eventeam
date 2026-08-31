"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

export async function createBrandAction(orgSlug: string, orgId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("brands")
    .insert({ org_id: orgId, name, slug: slugify(name) });

  if (error) {
    redirect(`/${orgSlug}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath(`/${orgSlug}`);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
