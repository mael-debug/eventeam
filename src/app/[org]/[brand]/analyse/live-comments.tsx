"use client";

// Page Analyse — aperçu simulé du flux de commentaires en temps réel
// (§3.F, cadence RT). Une nouvelle entrée toutes les 15-20 s pour
// matérialiser le webhook — le contenu est un aperçu, jamais présenté
// comme un vrai commentaire reçu.

import { useEffect, useState } from "react";
import { LIVE_COMMENT_POOL } from "@/lib/analyse-mock";

interface LiveEntry {
  id: number;
  author: string;
  text: string;
  postLabel: string;
  time: string;
}

export function LiveComments({ postLabels }: { postLabels: string[] }) {
  const [entries, setEntries] = useState<LiveEntry[]>([]);

  useEffect(() => {
    let id = 0;
    function push() {
      const seed = LIVE_COMMENT_POOL[Math.floor(Math.random() * LIVE_COMMENT_POOL.length)];
      const postLabel = postLabels[Math.floor(Math.random() * postLabels.length)] ?? "une publication";
      setEntries((prev) => [
        { id: id++, author: seed.author, text: seed.text, postLabel, time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) },
        ...prev.slice(0, 7),
      ]);
    }
    push();
    const interval = setInterval(push, 15000 + Math.random() * 5000);
    return () => clearInterval(interval);
  }, [postLabels]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
      {entries.map((e, i) => (
        <div
          key={e.id}
          style={{
            display: "flex",
            gap: 12,
            padding: "12px 14px",
            borderRadius: 14,
            background: i === 0 ? "var(--vert-pastel)" : "var(--carte-claire)",
            border: "1px solid var(--bordure-carte)",
            transition: "background .4s ease",
            minWidth: 0,
          }}
        >
          <div style={{ width: 34, height: 34, flex: "0 0 34px", borderRadius: "50%", background: "var(--panneau)", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>
            {e.author.slice(0, 1).toUpperCase()}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>@{e.author}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{e.time}</span>
            </div>
            <span style={{ fontSize: 13, color: "var(--encre)", textWrap: "pretty" }}>{e.text}</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>sur « {e.postLabel} »</span>
          </div>
        </div>
      ))}
    </div>
  );
}
