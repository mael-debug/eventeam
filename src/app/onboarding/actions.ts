"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

export async function createOrganizationAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect("/onboarding?error=nom_requis");
  }

  const supabase = await createClient();
  const { data: org, error } = await supabase.rpc("create_organization", {
    p_name: name,
    p_slug: slugify(name),
  });

  if (error || !org) {
    redirect(`/onboarding?error=${encodeURIComponent(error?.message ?? "inconnu")}`);
  }

  redirect(`/${org.slug}`);
}
