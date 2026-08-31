import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: orgIds } = await supabase.rpc("user_org_ids");
  if (orgIds && orgIds.length > 0) {
    const { data: org } = await supabase
      .from("organizations")
      .select("slug")
      .eq("id", orgIds[0])
      .single();
    if (org) redirect(`/${org.slug}`);
  }

  redirect("/onboarding");
}
