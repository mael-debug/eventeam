import { resolveBrandContext } from "@/lib/context/brand-context";
import { Sidebar } from "@/components/shell/sidebar";
import { Header } from "@/components/shell/header";
import { toggleViewRoleAction } from "./actions";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default async function BrandLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ org: string; brand: string }>;
}) {
  const { org: orgSlug, brand: brandSlug } = await params;
  const { supabase, org, brand, user, accounts, role, viewRole, canToggleView } = await resolveBrandContext(
    orgSlug,
    brandSlug,
  );

  const { data: brands } = await supabase.from("brands").select("slug, name").eq("org_id", org.id).order("name");
  const accountIds = accounts.map((a) => a.id);

  const { data: lastImport } = accountIds.length
    ? await supabase
        .from("imports")
        .select("window_start, window_end, completed_at")
        .in("account_id", accountIds)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const windowLabel =
    lastImport?.window_start && lastImport?.window_end
      ? `Abonnés ${formatDate(lastImport.window_start)} → ${formatDate(lastImport.window_end)}`
      : null;
  const lastImportLabel =
    lastImport?.completed_at && windowLabel
      ? `${new Date(lastImport.completed_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} · ${windowLabel.toLowerCase()}`
      : null;

  const userInitials = (user?.email ?? "?")
    .split(/[@.]/)[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "var(--font-corps)",
        color: "var(--encre)",
        background: "var(--fond)",
        fontSize: 15,
        lineHeight: 1.5,
      }}
    >
      <Sidebar orgSlug={org.slug} brandSlug={brand.slug} orgName={org.name} lastImportLabel={lastImportLabel} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Header
          orgSlug={org.slug}
          brands={brands ?? []}
          currentBrandSlug={brand.slug}
          windowLabel={windowLabel}
          compareLabel={null}
          role={role}
          userInitials={userInitials}
          viewRole={viewRole}
          canToggleView={canToggleView}
          toggleViewRoleAction={toggleViewRoleAction.bind(null, org.slug, brand.slug)}
        />
        <main style={{ flex: 1, overflowY: "auto", padding: "32px" }}>{children}</main>
      </div>
    </div>
  );
}
