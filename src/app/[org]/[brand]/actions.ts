"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
