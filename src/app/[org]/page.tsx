import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createBrandAction, signOutAction } from "./actions";

export default async function OrgPage({
  params,
  searchParams,
}: {
  params: Promise<{ org: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { org: orgSlug } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", orgSlug)
    .single();

  if (!org) notFound();

  const [{ data: brands }, { data: canManage }] = await Promise.all([
    supabase.from("brands").select("id, name, slug").eq("org_id", org.id).order("name"),
    supabase.rpc("can_manage_org", { p_org: org.id }),
  ]);

  const createBrand = createBrandAction.bind(null, org.slug, org.id);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{org.name}</h1>
        <form action={signOutAction}>
          <Button type="submit" variant="ghost" size="sm">
            Déconnexion
          </Button>
        </form>
      </header>

      <div className="grid gap-4">
        {(brands ?? []).map((brand) => (
          <Link key={brand.id} href={`/${org.slug}/${brand.slug}`}>
            <Card className="transition-colors hover:border-neutral-400">
              <CardHeader>
                <CardTitle>{brand.name}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
        {(!brands || brands.length === 0) && (
          <p className="text-sm text-neutral-500">Aucune marque pour le moment.</p>
        )}
      </div>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Ajouter une marque</CardTitle>
            <CardDescription>Réservé aux administrateurs et membres de l&apos;agence.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createBrand} className="flex gap-2">
              <Input name="name" required placeholder="Eden Park" />
              <Button type="submit">Ajouter</Button>
            </form>
            {error && <p className="mt-2 text-sm text-red-600">{decodeURIComponent(error)}</p>}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
