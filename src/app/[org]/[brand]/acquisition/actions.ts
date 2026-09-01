"use server";

// Community Intelligence — saisie du budget par pic d'acquisition. Le motif
// "saisie manuelle" (cf. migration 0019) : jamais dans une table recalculée,
// toujours dans manual_entries, jointe à l'affichage via
// acquisition_spikes_with_budget. La RLS (can_write_account) est la seule
// frontière réelle — un brand_viewer verra son upsert rejeté même si l'UI
// masque déjà le champ.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setSpikeBudgetAction(
  orgSlug: string,
  brandSlug: string,
  accountId: string,
  spikeStart: string,
  formData: FormData,
) {
  const raw = String(formData.get("budget_eur") ?? "").trim();
  const supabase = await createClient();

  if (raw === "") {
    await supabase
      .from("manual_entries")
      .delete()
      .eq("account_id", accountId)
      .eq("entity_type", "acquisition_spike")
      .eq("entity_key", spikeStart)
      .eq("field", "budget_eur");
  } else {
    const value = Number(raw.replace(",", "."));
    if (!Number.isFinite(value) || value < 0) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("manual_entries").upsert(
      {
        account_id: accountId,
        entity_type: "acquisition_spike",
        entity_key: spikeStart,
        field: "budget_eur",
        value_numeric: value,
        updated_by: user?.id ?? null,
      },
      { onConflict: "account_id,entity_type,entity_key,field" },
    );
  }

  revalidatePath(`/${orgSlug}/${brandSlug}/acquisition`);
}

// Périodes personnalisées (0037) — second mode de chiffrage, à côté des
// pics détectés par le moteur : l'agence choisit ses propres dates plutôt
// que d'attendre qu'un pic statistique soit détecté.
export async function createCustomWindowAction(
  orgSlug: string,
  brandSlug: string,
  accountId: string,
  formData: FormData,
) {
  const label = String(formData.get("label") ?? "").trim();
  const windowStart = String(formData.get("window_start") ?? "").trim();
  const windowEnd = String(formData.get("window_end") ?? "").trim();
  const budgetRaw = String(formData.get("budget_eur") ?? "").trim();

  if (!windowStart || !windowEnd || windowEnd < windowStart) return;

  const budgetEur = budgetRaw === "" ? null : Number(budgetRaw.replace(",", "."));
  if (budgetEur !== null && (!Number.isFinite(budgetEur) || budgetEur < 0)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("custom_acquisition_windows").insert({
    account_id: accountId,
    label: label || null,
    window_start: windowStart,
    window_end: windowEnd,
    budget_eur: budgetEur,
    created_by: user?.id ?? null,
  });

  revalidatePath(`/${orgSlug}/${brandSlug}/acquisition`);
}

export async function deleteCustomWindowAction(orgSlug: string, brandSlug: string, windowId: string) {
  const supabase = await createClient();
  await supabase.from("custom_acquisition_windows").delete().eq("id", windowId);
  revalidatePath(`/${orgSlug}/${brandSlug}/acquisition`);
}
