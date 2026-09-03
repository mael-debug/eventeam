import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, Button, Badge } from "@/components/ds";
import { Input } from "@/components/ui/input";
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

  // Un compte = un compte Instagram rattaché à une marque (souvent un seul
  // par marque) — affiché sous le nom pour que la sélection porte
  // directement sur ce qui sera analysé, pas juste un nom de client.
  const brandIds = (brands ?? []).map((b) => b.id);
  const { data: accountRows } = brandIds.length
    ? await supabase.from("instagram_accounts").select("brand_id, handle").in("brand_id", brandIds).order("handle")
    : { data: [] };
  const handlesByBrand = new Map<string, string[]>();
  for (const a of accountRows ?? []) {
    handlesByBrand.set(a.brand_id, [...(handlesByBrand.get(a.brand_id) ?? []), a.handle]);
  }

  const createBrand = createBrandAction.bind(null, org.slug, org.id);

  return (
    <main style={{ minHeight: "100vh", background: "var(--fond)" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "48px 32px 64px", display: "flex", flexDirection: "column", gap: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>{org.name}</span>
            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.01em" }}>Sélectionner un compte à analyser</h1>
          </div>
          <form action={signOutAction}>
            <Button type="submit" variant="lien" size="sm">
              Déconnexion
            </Button>
          </form>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {(brands ?? []).map((brand) => {
            const handles = handlesByBrand.get(brand.id) ?? [];
            return (
              <Link key={brand.id} href={`/${org.slug}/${brand.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                <Card variant="claire">
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.01em" }}>{brand.name}</div>
                    {handles.length > 0 ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {handles.map((h) => (
                          <Badge key={h} variant="forfait">
                            @{h}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>Aucun compte Instagram rattaché</span>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {(!brands || brands.length === 0) && (
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Aucun compte pour le moment.</p>
        )}

        {canManage && (
          <Card variant="claire" interactive={false} style={{ maxWidth: 420 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Ajouter un compte</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Réservé aux administrateurs et membres de l&apos;agence. Le compte Instagram se rattache ensuite depuis la
                page du compte créé.
              </div>
              <form action={createBrand} style={{ display: "flex", gap: 8 }}>
                <Input name="name" required placeholder="Eden Park" />
                <Button type="submit">Ajouter</Button>
              </form>
              {error && <p style={{ marginTop: 8, fontSize: 13, color: "#C0392B" }}>{decodeURIComponent(error)}</p>}
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
