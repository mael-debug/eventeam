"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds";
import {
  CATALOGUE,
  CATALOGUE_TOTAL,
  CATALOGUE_RATINGS,
  CATALOGUE_STATUS_LABEL,
  CATALOGUE_STATUS_STYLE,
  type CatalogueRating,
} from "@/lib/catalogue";

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
    const header = "Module,Fonctionnalité,Statut,Avertissement,Arbitrage,Commentaire";
    const lines = CATALOGUE.flatMap((g) =>
      g.items.map((it) =>
        [g.module, it.title, CATALOGUE_STATUS_LABEL[it.status], it.warning ?? "", ratings[it.slug] ?? "", notes[it.slug] ?? ""]
          .map((v) => `"${v.replace(/"/g, '""')}"`)
          .join(","),
      ),
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
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1280, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.01em" }}>Catalogue et liste de courses</h1>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {CATALOGUE_TOTAL} fonctionnalités · {rated} / {CATALOGUE_TOTAL} arbitrées
          </span>
        </div>
        <Button variant="encre" size="md" onClick={exportCsv}>
          Exporter le catalogue annoté
        </Button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 12 }}>
        {(Object.keys(CATALOGUE_STATUS_LABEL) as (keyof typeof CATALOGUE_STATUS_LABEL)[]).map((s) => (
          <span
            key={s}
            style={{ borderRadius: 999, padding: "5px 12px", fontWeight: 600, background: CATALOGUE_STATUS_STYLE[s].bg, color: CATALOGUE_STATUS_STYLE[s].fg }}
          >
            {CATALOGUE_STATUS_LABEL[s]}
          </span>
        ))}
      </div>

      {CATALOGUE.map((g) => (
        <div key={g.module} style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
          <h2 style={{ margin: "8px 0 0", fontSize: 17, fontWeight: 800 }}>{g.module}</h2>
          {g.items.map((it) => {
            const style = CATALOGUE_STATUS_STYLE[it.status];
            const rating = ratings[it.slug];
            return (
              <div
                key={it.slug}
                style={{
                  background: "var(--carte-claire)",
                  border: "1px solid var(--bordure-carte)",
                  borderRadius: 18,
                  padding: "16px 20px",
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  gap: 14,
                  alignItems: "start",
                  boxShadow: "var(--ombre-carte)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{it.title}</span>
                    <span style={{ borderRadius: 999, padding: "4px 10px", fontSize: 11, fontWeight: 700, background: style.bg, color: style.fg, border: `1px solid ${style.bd}` }}>
                      {CATALOGUE_STATUS_LABEL[it.status]}
                    </span>
                  </div>
                  {it.warning && <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{it.warning}</div>}
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
                      marginTop: 4,
                      width: "100%",
                      maxWidth: 420,
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
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
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
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
