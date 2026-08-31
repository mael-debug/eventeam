import { Card, Button } from "@/components/ds";
import { resolveBrandContext } from "@/lib/context/brand-context";
import { fr, shortDate } from "@/lib/format";
import { NominativeList, type ListRow } from "@/components/nominative-list";

const LIST_LIMIT = 200;

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

  const [{ data: cohortTotals }, { data: departures, count: totalCount }] = await Promise.all([
    supabase.from("v_cohort_totals").select("*").eq("account_id", account.id).maybeSingle(),
    supabase.from("v_recent_departures").select("*", { count: "exact" }).eq("account_id", account.id).limit(LIST_LIMIT),
  ]);

  const rows: ListRow[] = (departures ?? [])
    .filter((d): d is typeof d & { profile_id: number; followed_at: string; cohort_week: string } => d.profile_id != null && d.followed_at != null && d.cohort_week != null)
    .map((d) => ({
      profileId: d.profile_id,
      followedAtLabel: shortDate(d.followed_at),
      cohortLabel: shortDate(d.cohort_week),
      intervalLabel:
        d.departure_window_start && d.departure_window_end
          ? `${shortDate(d.departure_window_start)} → ${shortDate(d.departure_window_end)}`
          : "—",
    }));

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
          {rows.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Aucun départ mesuré sur cet import.</p>
          ) : canViewIdentities ? (
            <NominativeList accountId={account.id} rows={rows} />
          ) : (
            <div style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 320, lineHeight: 1.5 }}>
              Rôle lecture seule : identités masquées et export désactivé tant que la marque n&apos;y est pas autorisée dans les
              paramètres.
            </div>
          )}
          <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
            {rows.length} ligne{rows.length > 1 ? "s" : ""} sur {fr(totalCount ?? rows.length)}. L&apos;intervalle de départ
            correspond à l&apos;écart entre les deux imports qui encadrent la disparition du compte ; aucune date exacte n&apos;existe.
          </div>
        </div>
      </Card>
    </main>
  );
}
