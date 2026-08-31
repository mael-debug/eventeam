import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImportUploader } from "./import-uploader";

const CADENCE_WEEKS: Record<string, number> = { weekly: 1, monthly: 4, quarterly: 13 };
const CADENCE_LABEL: Record<string, string> = { weekly: "hebdomadaire", monthly: "mensuelle", quarterly: "trimestrielle" };

const STATUS_VARIANT: Record<string, "outline" | "success" | "warning"> = {
  completed: "success",
  failed: "warning",
  uploading: "outline",
  uploaded: "outline",
  parsing: "outline",
  computing: "outline",
};

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
        .select("id, account_id, status, window_start, window_end, created_at, exported_at")
        .in("account_id", accountIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <main className="flex flex-col gap-6">
      {(accounts ?? []).map((account) => {
        const cadenceWeeks = CADENCE_WEEKS[account.import_cadence] ?? null;
        const accountImports = (imports ?? []).filter((i) => i.account_id === account.id);

        return (
          <div key={account.id} className="flex flex-col gap-3">
            {cadenceWeeks && cadenceWeeks > 1 && (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Vos exports pour @{account.handle} sont espacés de {cadenceWeeks} semaines
                (cadence {CADENCE_LABEL[account.import_cadence]}). La date de désabonnement est
                donc connue à {cadenceWeeks} semaines près. En passant à un export hebdomadaire,
                elle serait connue à la semaine.
              </p>
            )}

            <ImportUploader accountId={account.id} accountHandle={account.handle} />

            {accountImports.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Historique des imports — @{account.handle}</CardTitle>
                  <CardDescription>Fenêtre temporelle de chaque export.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {accountImports.map((imp) => (
                    <div key={imp.id} className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">
                        {imp.window_start && imp.window_end
                          ? `${new Date(imp.window_start).toLocaleDateString("fr-FR")} → ${new Date(imp.window_end).toLocaleDateString("fr-FR")}`
                          : new Date(imp.created_at).toLocaleDateString("fr-FR")}
                      </span>
                      <Badge variant={STATUS_VARIANT[imp.status] ?? "outline"}>{imp.status}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        );
      })}

      {(!accounts || accounts.length === 0) && (
        <p className="text-sm text-neutral-500">
          Aucun compte Instagram rattaché. Ajoutez-en un depuis la vue d&apos;ensemble.
        </p>
      )}
    </main>
  );
}
