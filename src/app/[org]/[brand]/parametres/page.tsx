import { Card, Button } from "@/components/ds";
import { resolveBrandContext } from "@/lib/context/brand-context";
import { CADENCE_WEEKS, CADENCE_LABEL } from "@/lib/cadence";
import { updateImportCadenceAction } from "../actions";
import { IdentityAccessToggle } from "./identity-access-toggle";

const CADENCE_OPTIONS: { value: string; label: string }[] = [
  { value: "weekly", label: "Hebdomadaire" },
  { value: "monthly", label: "Toutes les 4 semaines" },
  { value: "quarterly", label: "Toutes les 13 semaines" },
];

const ROLE_LABEL: Record<string, string> = {
  platform_admin: "Agence · accès complet",
  agency_admin: "Agence · accès complet",
  agency_member: "Agence · accès complet",
  brand_viewer: "Marque · lecture seule",
};

export default async function ParametresPage({
  params,
}: {
  params: Promise<{ org: string; brand: string }>;
}) {
  const { org: orgSlug, brand: brandSlug } = await params;
  const { supabase, brand, accounts, canWriteView } = await resolveBrandContext(orgSlug, brandSlug);

  const account = accounts[0];
  const { data: members } = await supabase.rpc("brand_members_for_settings", { p_brand_id: brand.id });
  const cadenceWeeks = account ? CADENCE_WEEKS[account.import_cadence] : null;

  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 900, minWidth: 0 }}>
      <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.01em" }}>Paramètres</h1>

      {account && (
        <Card variant="claire" interactive={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Cadence d&apos;import</h2>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Détermine la précision des dates de départ · @{account.handle}</span>
            </div>
            {canWriteView ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {CADENCE_OPTIONS.map((opt) => {
                  const active = opt.value === account.import_cadence;
                  return (
                    <form key={opt.value} action={updateImportCadenceAction.bind(null, orgSlug, brandSlug, account.id)}>
                      <input type="hidden" name="cadence" value={opt.value} />
                      <button
                        type="submit"
                        disabled={active}
                        style={{
                          cursor: active ? "default" : "pointer",
                          borderRadius: 999,
                          padding: "8px 16px",
                          fontSize: 13,
                          fontWeight: 600,
                          border: active ? "1px solid transparent" : "1px solid var(--bordure)",
                          background: active ? "var(--encre)" : "transparent",
                          color: active ? "#FAF8F3" : "var(--text-muted)",
                        }}
                      >
                        {opt.label}
                      </button>
                    </form>
                  );
                })}
              </div>
            ) : (
              <span style={{ borderRadius: 999, padding: "8px 16px", fontSize: 13, fontWeight: 600, background: "var(--encre)", color: "#FAF8F3", alignSelf: "flex-start" }}>
                {CADENCE_LABEL[account.import_cadence]}
              </span>
            )}
            <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, textWrap: "pretty" }}>
              Cadence actuelle : la date de désabonnement est connue à {cadenceWeeks ?? "?"} semaine{(cadenceWeeks ?? 0) > 1 ? "s" : ""} près.
              {account.import_cadence !== "weekly" && " En hebdomadaire, elle serait connue à la semaine."}
              {!canWriteView && " Modifiable par l'agence uniquement."}
            </div>
          </div>
        </Card>
      )}

      <Card variant="claire" interactive={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Membres</h2>
          {!members || members.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>Aucun membre.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14 }}>
              {members.map((m) => (
                <div
                  key={m.user_id}
                  style={{ display: "flex", justifyContent: "space-between", gap: 12, borderBottom: "1px solid var(--bordure-carte)", paddingBottom: 10 }}
                >
                  <span>{m.email}</span>
                  <span style={{ color: "var(--text-muted)" }}>
                    {ROLE_LABEL[m.role ?? ""] ?? m.role}
                    {m.scope === "brand" && m.can_view_identities && " · accès identités"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {canWriteView && (
        <Card variant="encre" interactive={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Accès aux identités pour le compte client</h2>
            {(members ?? []).filter((m) => m.scope === "brand").length === 0 ? (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: "rgba(250,248,243,0.85)" }}>Aucun membre côté marque pour le moment.</div>
            ) : (
              (members ?? [])
                .filter((m) => m.scope === "brand")
                .map((m) => (
                  <div key={m.user_id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 14, lineHeight: 1.55, color: "rgba(250,248,243,0.85)", textWrap: "pretty" }}>
                      {m.email} — {m.can_view_identities
                        ? "Activé. Ce compte voit les identifiants des comptes partis et peut exporter les listes."
                        : "Désactivé. Ce compte voit les volumes et les cohortes, jamais les identifiants des comptes partis, et ne peut pas déposer d'import."}
                    </div>
                    <IdentityAccessToggle
                      orgSlug={orgSlug}
                      brandSlug={brandSlug}
                      brandId={brand.id}
                      userId={m.user_id}
                      enabled={m.can_view_identities}
                    />
                  </div>
                ))
            )}
          </div>
        </Card>
      )}
    </main>
  );
}
