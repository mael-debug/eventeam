import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ds";
import { ImportUploader } from "./import-uploader";
import { StuckImport } from "./stuck-import";
import { CADENCE_WEEKS, CADENCE_LABEL } from "@/lib/cadence";
import { shortDate } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  completed: "réussi",
  failed: "échoué",
  uploading: "en cours",
  uploaded: "en cours",
  parsing: "en cours",
  computing: "en cours",
};
const STATUS_VARIANT: Record<string, "forfait" | "temps" | "statut"> = {
  completed: "forfait",
  failed: "temps",
  uploading: "statut",
  uploaded: "statut",
  parsing: "statut",
  computing: "statut",
};
const FILE_STATUS_LABEL: Record<string, string> = { pending: "en attente", parsed: "traité", error: "erreur" };

export default async function ImportsPage({
  params,
}: {
  params: Promise<{ org: string; brand: string }>;
}) {
  const { org: orgSlug, brand: brandSlug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase.from("organizations").select("id").eq("slug", orgSlug).single();
  if (!org) notFound();

  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("org_id", org.id)
    .eq("slug", brandSlug)
    .single();
  if (!brand) notFound();

  const { data: accounts } = await supabase
    .from("instagram_accounts")
    .select("id, handle, import_cadence")
    .eq("brand_id", brand.id)
    .order("handle");

  const accountIds = (accounts ?? []).map((a) => a.id);
  const { data: imports } = accountIds.length
    ? await supabase
        .from("imports")
        .select("id, account_id, status, window_start, window_end, created_at, exported_at, error_message, started_at")
        .in("account_id", accountIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const importIds = (imports ?? []).map((i) => i.id);
  const { data: files } = importIds.length
    ? await supabase.from("import_files").select("import_id, source_path, category, status, error_message").in("import_id", importIds)
    : { data: [] };

  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.01em" }}>Imports</h1>
      </div>

      {(accounts ?? []).map((account) => {
        const cadenceWeeks = CADENCE_WEEKS[account.import_cadence] ?? null;
        const accountImports = (imports ?? []).filter((i) => i.account_id === account.id);

        return (
          <div key={account.id} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {cadenceWeeks && cadenceWeeks > 1 && (
              <div style={{ background: "var(--pastel-jaune)", borderRadius: 12, padding: "10px 14px", fontSize: 14, color: "var(--encre)" }}>
                Vos exports pour @{account.handle} sont espacés de {cadenceWeeks} semaines (cadence{" "}
                {CADENCE_LABEL[account.import_cadence]}). La date de désabonnement est donc connue à {cadenceWeeks} semaines près.
                En passant à un export hebdomadaire, elle serait connue à la semaine.
              </div>
            )}

            <ImportUploader accountId={account.id} accountHandle={account.handle} />

            {accountImports.length > 0 && (
              <Card variant="claire" interactive={false}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Historique des imports — @{account.handle}</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Fenêtre temporelle et détail par fichier de chaque export.</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {accountImports.map((imp) => {
                    const impFiles = (files ?? []).filter((f) => f.import_id === imp.id && f.category !== "media");
                    const errored = impFiles.filter((f) => f.status === "error");
                    const pending = impFiles.filter((f) => f.status === "pending");
                    const inProgress = imp.status === "parsing" || imp.status === "computing" || imp.status === "uploaded";
                    const stuck = imp.status === "uploading" && imp.started_at === null;
                    return (
                      <div key={imp.id} style={{ borderTop: "1px solid var(--bordure-carte)", paddingTop: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14 }}>
                          <span style={{ color: "var(--text-muted)" }}>
                            {imp.window_start && imp.window_end
                              ? `${shortDate(imp.window_start)} → ${shortDate(imp.window_end)}`
                              : shortDate(imp.created_at)}
                            {impFiles.length > 0 && ` · ${impFiles.length - pending.length}/${impFiles.length} fichiers traités`}
                          </span>
                          <Badge variant={STATUS_VARIANT[imp.status] ?? "statut"}>{STATUS_LABEL[imp.status] ?? imp.status}</Badge>
                        </div>
                        {imp.status === "failed" && imp.error_message && (
                          <div style={{ fontSize: 12, color: "#7A2E22", marginTop: 4 }}>{imp.error_message}</div>
                        )}
                        {stuck && <StuckImport importId={imp.id} />}
                        {inProgress && impFiles.length > 0 && (
                          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                            {impFiles.map((f) => (
                              <div key={f.source_path} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.source_path}</span>
                                <span style={{ flex: "0 0 auto", color: f.status === "error" ? "#7A2E22" : f.status === "parsed" ? "var(--bleu)" : "var(--text-muted)" }}>
                                  {FILE_STATUS_LABEL[f.status] ?? f.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {errored.length > 0 && (
                          <div style={{ fontSize: 12, color: "#7A2E22", marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                            {errored.map((f) => (
                              <span key={f.source_path}>
                                {f.source_path} — {f.error_message ?? "erreur"}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        );
      })}

      {(!accounts || accounts.length === 0) && (
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
          Aucun compte Instagram rattaché. Ajoutez-en un depuis la vue d&apos;ensemble.
        </p>
      )}
    </main>
  );
}
