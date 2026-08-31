import { Card } from "@/components/ds";
import { resolveBrandContext } from "@/lib/context/brand-context";

export default async function EcosystemePage({
  params,
}: {
  params: Promise<{ org: string; brand: string }>;
}) {
  const { org: orgSlug, brand: brandSlug } = await params;
  const { accounts } = await resolveBrandContext(orgSlug, brandSlug);

  if (accounts.length === 0) {
    return <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Aucun compte Instagram rattaché.</p>;
  }

  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1280, minWidth: 0 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.01em" }}>Écosystème</h1>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Comptes professionnels suivis, à partir des métadonnées de conversation.</span>
      </div>

      <Card variant="claire" interactive={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>En attente de your_chat_information.json</div>
          <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.55 }}>
            Ce module lit le palier d&apos;audience des comptes professionnels suivis à partir des métadonnées de conversation
            fournies par Meta — jamais le contenu des messages. Le fichier <code>your_chat_information.json</code> n&apos;a pas
            encore été fourni dans un export ; le module reste vide tant qu&apos;il ne l&apos;est pas.
          </div>
        </div>
      </Card>
    </main>
  );
}
