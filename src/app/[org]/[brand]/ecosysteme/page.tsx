import { Card } from "@/components/ds";
import { resolveBrandContext } from "@/lib/context/brand-context";
import { fr, pct } from "@/lib/format";

// your_chat_information.json (Lot 5) a été inspecté sur un export réel :
// chaque discussion porte un fbid (identifiant Meta interne) sans aucune
// correspondance avec le pseudo Instagram utilisé par
// followers_*.json/following.json, et aucun des indicateurs exposés par
// Meta ne porte de palier d'audience. Cet écran ne peut donc jamais
// devenir une liste de comptes nommés ni afficher un palier d'audience —
// uniquement un agrégat sur l'ensemble des discussions (cf. catalogue).
export default async function EcosystemePage({
  params,
}: {
  params: Promise<{ org: string; brand: string }>;
}) {
  const { org: orgSlug, brand: brandSlug } = await params;
  const { supabase, accounts } = await resolveBrandContext(orgSlug, brandSlug);

  if (accounts.length === 0) {
    return <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Aucun compte Instagram rattaché.</p>;
  }
  const account = accounts[0];

  const { data: summary } = await supabase
    .from("v_ecosystem_chat_summary")
    .select("*")
    .eq("account_id", account.id)
    .maybeSingle();

  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1280, minWidth: 0 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.01em" }}>Écosystème</h1>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Caractéristiques des discussions, à partir des métadonnées de conversation.</span>
      </div>

      {!summary || !summary.n ? (
        <Card variant="claire" interactive={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>En attente de your_chat_information.json</div>
            <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.55 }}>
              Ce module lit les caractéristiques des discussions à partir des métadonnées de conversation fournies par Meta —
              jamais le contenu des messages. Le fichier <code>your_chat_information.json</code> n&apos;a pas encore été fourni
              dans un import ; le module reste vide tant qu&apos;il ne l&apos;est pas.
            </div>
          </div>
        </Card>
      ) : (
        (() => {
          const n = summary.n;
          const rows = [
            { label: "Comportent une marque", n: summary.n_brand ?? 0 },
            { label: "Comportent un Creator", n: summary.n_creator ?? 0 },
            { label: "Comportent un(e) abonné(e)", n: summary.n_subscriber ?? 0 },
            { label: "Comportent un follower", n: summary.n_follower ?? 0 },
            { label: "Profil vérifié", n: summary.n_verified ?? 0 },
            { label: "Ont obtenu une réponse", n: summary.n_got_reply ?? 0 },
          ];
          return (
            <>
              <div style={{ background: "var(--panneau)", border: "1px solid var(--bordure)", borderRadius: 18, padding: "16px 20px", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5, textWrap: "pretty" }}>
                Agrégat sur {fr(n)} discussions — jamais une liste de comptes : le fichier de métadonnées de conversation
                identifie chaque discussion par un identifiant Meta interne, sans aucune correspondance avec les identifiants
                Instagram des comptes suivis ou abonnés. Aucun palier d&apos;audience n&apos;est exposé par Meta dans ce fichier.
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                {rows.map((row) => (
                  <Card key={row.label} variant="claire" interactive={false}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>{row.label}</span>
                      <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em" }}>{pct((row.n / n) * 100)}</span>
                      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{fr(row.n)} discussion{row.n > 1 ? "s" : ""}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          );
        })()
      )}
    </main>
  );
}
