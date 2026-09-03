"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds";
import { CATALOGUE, CATALOGUE_TOTAL, CATALOGUE_RATINGS, type CatalogueRating } from "@/lib/catalogue";

// Arbitrage client du catalogue — persisté dans manual_entries
// (entity_type='feature_catalog', cf. 0019) plutôt qu'une table dédiée :
// c'est exactement le motif de saisie manuelle que cette table généralise.
// Écriture gated par can_write_account côté RLS (agence uniquement, même
// garde que la cadence d'import) : readOnly ici reflète ce que la policy
// autoriserait de toute façon.
export function CatalogueBoard({
  accountId,
  initialRatings,
  initialNotes,
  readOnly,
}: {
  accountId: string;
  initialRatings: Record<string, CatalogueRating>;
  initialNotes: Record<string, string>;
  readOnly: boolean;
}) {
  const [ratings, setRatings] = useState(initialRatings);
  const [notes, setNotes] = useState(initialNotes);
  const [savingNote, setSavingNote] = useState<string | null>(null);

  const rated = Object.keys(ratings).length;

  async function handleRate(slug: string, value: CatalogueRating) {
    if (readOnly) return;
    const supabase = createClient();
    const current = ratings[slug];
    if (current === value) {
      const next = { ...ratings };
      delete next[slug];
      setRatings(next);
      await supabase
        .from("manual_entries")
        .delete()
        .eq("account_id", accountId)
        .eq("entity_type", "feature_catalog")
        .eq("entity_key", slug)
        .eq("field", "rating");
      return;
    }
    setRatings({ ...ratings, [slug]: value });
    await supabase.from("manual_entries").upsert(
      { account_id: accountId, entity_type: "feature_catalog", entity_key: slug, field: "rating", value_text: value },
      { onConflict: "account_id,entity_type,entity_key,field" },
    );
  }

  async function handleNoteBlur(slug: string, value: string) {
    if (readOnly) return;
    setSavingNote(slug);
    const supabase = createClient();
    if (value.trim() === "") {
      await supabase
        .from("manual_entries")
        .delete()
        .eq("account_id", accountId)
        .eq("entity_type", "feature_catalog")
        .eq("entity_key", slug)
        .eq("field", "note");
    } else {
      await supabase.from("manual_entries").upsert(
        { account_id: accountId, entity_type: "feature_catalog", entity_key: slug, field: "note", value_text: value },
        { onConflict: "account_id,entity_type,entity_key,field" },
      );
    }
    setSavingNote(null);
  }

  function exportCsv() {
    const header = "Sujet,Avis,Commentaire";
    const lines = CATALOGUE.map((it) =>
      [it.title, ratings[it.slug] ?? "", notes[it.slug] ?? ""].map((v) => `"${v.replace(/"/g, '""')}"`).join(","),
    );
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "catalogue-annote.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 900, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.01em" }}>Ce qu&apos;on peut faire</h1>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {CATALOGUE_TOTAL} sujets · {rated} / {CATALOGUE_TOTAL} arbitrés
          </span>
        </div>
        <Button variant="encre" size="md" onClick={exportCsv}>
          Exporter en CSV
        </Button>
      </div>

      {CATALOGUE.map((it) => {
        const rating = ratings[it.slug];
        return (
          <div
            key={it.slug}
            style={{
              background: "var(--carte-claire)",
              border: "1px solid var(--bordure-carte)",
              borderRadius: 18,
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              boxShadow: "var(--ombre-carte)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{it.title}</span>
              <span style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>{it.description}</span>
              {it.note && (
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--bleu)" }}>{it.note}</span>
              )}
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {CATALOGUE_RATINGS.map((r) => {
                const active = rating === r;
                return (
                  <button
                    key={r}
                    onClick={() => handleRate(it.slug, r)}
                    disabled={readOnly}
                    style={{
                      cursor: readOnly ? "default" : "pointer",
                      borderRadius: 999,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      border: `1px solid ${active ? "var(--encre)" : "var(--bordure)"}`,
                      background: active ? "var(--encre)" : "transparent",
                      color: active ? "#FAF8F3" : "var(--text-muted)",
                    }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>

            <input
              defaultValue={notes[it.slug] ?? ""}
              onBlur={(e) => {
                const value = e.target.value;
                setNotes((prev) => ({ ...prev, [it.slug]: value }));
                void handleNoteBlur(it.slug, value);
              }}
              placeholder="Commentaire du client"
              disabled={readOnly}
              style={{
                width: "100%",
                border: "1px solid var(--bordure)",
                background: "var(--surface-creme)",
                borderRadius: 12,
                padding: "8px 12px",
                fontSize: 13,
                color: "var(--encre)",
                outline: "none",
                opacity: savingNote === it.slug ? 0.6 : 1,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
