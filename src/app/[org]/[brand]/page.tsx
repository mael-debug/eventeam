import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createInstagramAccountAction } from "./actions";

const ROLE_LABEL: Record<string, string> = {
  platform_admin: "Administrateur plateforme",
  agency_admin: "Administrateur agence",
  agency_member: "Membre agence",
  brand_viewer: "Client (lecture seule)",
};

export default async function BrandOverviewPage({
  params,
}: {
  params: Promise<{ org: string; brand: string }>;
}) {
  const { org: orgSlug, brand: brandSlug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", orgSlug)
    .single();
  if (!org) notFound();

  const { data: brand } = await supabase
    .from("brands")
    .select("id, name, slug")
    .eq("org_id", org.id)
    .eq("slug", brandSlug)
    .single();
  if (!brand) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: accounts }, { data: canWrite }, { data: orgMembership }, { data: brandMembership }] =
    await Promise.all([
      supabase
        .from("instagram_accounts")
        .select("id, handle, display_name, import_cadence")
        .eq("brand_id", brand.id)
        .order("handle"),
      supabase.rpc("can_write", { p_brand: brand.id }),
      supabase.from("organization_members").select("role").eq("org_id", org.id).eq("user_id", user!.id).maybeSingle(),
      supabase
        .from("brand_members")
        .select("role, can_view_identities")
        .eq("brand_id", brand.id)
        .eq("user_id", user!.id)
        .maybeSingle(),
    ]);

  const role = orgMembership?.role ?? brandMembership?.role ?? null;
  const createAccount = createInstagramAccountAction.bind(null, org.slug, brand.slug, brand.id);

  return (
    <main className="flex flex-col gap-6">
      {role && (
        <div>
          <Badge variant="outline">{ROLE_LABEL[role] ?? role}</Badge>
          {brandMembership && !brandMembership.can_view_identities && (
            <span className="ml-2 text-xs text-neutral-500">
              Listes nominatives non activées pour ce compte.
            </span>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Comptes Instagram</CardTitle>
          <CardDescription>Comptes rattachés à cette marque.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {(accounts ?? []).map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-md border border-neutral-100 px-3 py-2 text-sm">
              <span>@{a.handle}</span>
              <Badge variant="outline">{a.import_cadence}</Badge>
            </div>
          ))}
          {(!accounts || accounts.length === 0) && (
            <p className="text-sm text-neutral-500">Aucun compte Instagram pour le moment.</p>
          )}
        </CardContent>
      </Card>

      {canWrite && (
        <Card>
          <CardHeader>
            <CardTitle>Rattacher un compte Instagram</CardTitle>
            <CardDescription>Réservé à l&apos;agence (lecture seule pour le client).</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createAccount} className="flex gap-2">
              <Input name="handle" required placeholder="edenpark" />
              <Button type="submit">Rattacher</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
