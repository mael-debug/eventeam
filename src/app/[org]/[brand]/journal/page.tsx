import { Card, Button } from "@/components/ds";
import { resolveBrandContext } from "@/lib/context/brand-context";
import { fr } from "@/lib/format";

const ACTION_LABEL: Record<string, string> = {
  reveal_usernames: "Révélation d'identités",
  export_csv: "Export CSV",
  erasure_requested: "Demande d'effacement",
};

export default async function JournalPage({
  params,
}: {
  params: Promise<{ org: string; brand: string }>;
}) {
  const { org: orgSlug, brand: brandSlug } = await params;
  const base = `/${orgSlug}/${brandSlug}`;
  const { supabase, accounts } = await resolveBrandContext(orgSlug, brandSlug);

  if (accounts.length === 0) {
    return <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Aucun compte Instagram rattaché.</p>;
  }
  const account = accounts[0];

  const { data: entries, error } = await supabase.rpc("audit_log_for_account", { p_account: account.id });

  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1000, minWidth: 0 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.01em" }}>Journal de consultation</h1>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Chaque accès aux données personnelles est enregistré (@{account.handle}).
        </span>
      </div>

      <Card variant="claire" interactive={false}>
        {error ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Accès au journal non autorisé pour ce rôle.</p>
            <Button href={base}>Retour à la vue d&apos;ensemble</Button>
          </div>
        ) : !entries || entries.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Aucune consultation de données personnelles enregistrée pour ce compte.</p>
        ) : (
          <div style={{ overflowX: "auto", minWidth: 0 }}>
            <table style={{ width: "100%", minWidth: 620, fontSize: 14, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--text-muted)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  <th style={{ padding: "0 8px 10px 0", fontWeight: 600 }}>Date</th>
                  <th style={{ padding: "0 8px 10px", fontWeight: 600 }}>Utilisateur</th>
                  <th style={{ padding: "0 8px 10px", fontWeight: 600 }}>Action</th>
                  <th style={{ padding: "0 0 10px", fontWeight: 600, textAlign: "right" }}>Volume</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((j, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--bordure-carte)" }}>
                    <td style={{ padding: "11px 8px 11px 0", color: "var(--text-muted)" }}>
                      {new Date(j.created_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td style={{ padding: "11px 8px", fontWeight: 600 }}>{j.user_email ?? "—"}</td>
                    <td style={{ padding: "11px 8px" }}>{ACTION_LABEL[j.action] ?? j.action}</td>
                    <td style={{ padding: "11px 0", textAlign: "right", color: "var(--text-muted)" }}>{fr(j.target_count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </main>
  );
}
