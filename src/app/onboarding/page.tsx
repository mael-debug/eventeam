import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createOrganizationAction } from "./actions";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Créer votre agence</CardTitle>
          <CardDescription>
            Vous deviendrez administrateur de cette organisation. Vous pourrez ensuite y
            rattacher des marques et des comptes Instagram.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createOrganizationAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nom de l&apos;agence</Label>
              <Input id="name" name="name" required autoFocus placeholder="Eventeam" />
            </div>
            {error && <p className="text-sm text-red-600">{decodeURIComponent(error)}</p>}
            <Button type="submit">Créer l&apos;agence</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
