import { Card, Button } from "@/components/ds";
import { resolveBrandContext } from "@/lib/context/brand-context";
import { fr } from "@/lib/format";
import { PaginatedDepartures } from "./paginated-departures";

export default async function ListesPage({
  params,
}: {
  params: Promise<{ org: string; brand: string }>;
}) {
  const { org: orgSlug, brand: brandSlug } = await params;
  const base = `/${orgSlug}/${brandSlug}`;
  const { supabase, accounts, canViewIdentities } = await resolveBrandContext(orgSlug, brandSlug);

  if (accounts.length === 0) {
    return <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Aucun compte Instagram rattaché.</p>;
  }
  const account = accounts[0];

  const { data: comparability } = await supabase.from("import_comparability").select("*").eq("account_id", account.id).maybeSingle();

  if (!comparability) {
    return (
      <Card variant="claire" interactive={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 19, fontWeight: 800 }}>Aucun import traité</div>
          <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Les listes nominatives apparaissent après le premier import.</div>
          <Button href={`${base}/imports`}>Aller à Imports</Button>
        </div>
      </Card>
    );
  }

  // count only : la liste elle-même est chargée page par page côté client
  // (PaginatedDepartures) pour ne pas transférer les 1138+ lignes d'un coup.
  const [{ data: cohortTotals }, { count: totalCount }] = await Promise.all([
    supabase.from("v_cohort_totals").select("*").eq("account_id", account.id).maybeSingle(),
    supabase.from("v_recent_departures").select("*", { count: "exact", head: true }).eq("account_id", account.id),
  ]);

  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1280, minWidth: 0 }}>
      <div style={{ background: "var(--encre)", color: "var(--surface-creme)", borderRadius: 18, padding: "16px 20px", fontSize: 14, lineHeight: 1.5 }}>
        Données personnelles. L&apos;usage est limité à l&apos;analyse interne de l&apos;agence et de la marque. Chaque
        consultation et chaque export sont journalisés.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.01em" }}>Listes nominatives</h1>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {fr(cohortTotals?.total_departed ?? null)} comptes partis sur la cohorte suivie de {fr(cohortTotals?.total_measurable ?? null)} comptes
        </span>
      </div>

      <Card variant="claire" interactive={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          {!totalCount ? (
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Aucun départ mesuré sur cet import.</p>
          ) : canViewIdentities ? (
            <PaginatedDepartures accountId={account.id} totalCount={totalCount} />
          ) : (
            <div style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 320, lineHeight: 1.5 }}>
              Rôle lecture seule : identités masquées et export désactivé tant que la marque n&apos;y est pas autorisée dans les
              paramètres.
            </div>
          )}
          <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
            L&apos;intervalle de départ correspond à l&apos;écart entre les deux imports qui encadrent la disparition du
            compte ; aucune date exacte n&apos;existe.
          </div>
        </div>
      </Card>
    </main>
  );
}
