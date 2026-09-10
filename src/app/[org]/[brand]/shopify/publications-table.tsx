"use client";

import { useMemo, useState } from "react";
import { fr, eur, shortDate } from "@/lib/format";
import { postDisplayName, type ShopifyPostRow } from "@/lib/shopify-mock";
import { PersonaBadge } from "../analyse/persona-badge";

// Même mécanique de tri que top-commenters-table.tsx (Import/API) — pas de
// nouveau composant de tri générique tant qu'un seul autre écran en a
// besoin. PersonaBadge est importé tel quel depuis analyse/ (pas dupliqué) :
// c'est ce partage de code qui garantit les mêmes couleurs de persona des
// deux côtés. Colonne "Publication" : la vraie légende importée
// (postDisplayName), jamais un libellé générique — c'est la publication
// réelle qui a généré la vente, le client doit pouvoir la reconnaître.
type SortKey = "publishedAt" | "reach" | "bioLinkClicks" | "orders" | "revenue" | "aov";
type SortDir = "asc" | "desc";

const FORMAT_LABEL: Record<string, string> = { post: "Post", reel: "Reel", story: "Story" };

function SortHeader({
  label,
  sortKey,
  activeKey,
  dir,
  align,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  align?: "left" | "right";
  onSort: (key: SortKey) => void;
}) {
  const active = sortKey === activeKey;
  return (
    <th style={{ padding: "0 10px 10px 0", fontWeight: 600, textAlign: align ?? "left" }}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", padding: 0,
          font: "inherit", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase",
          color: active ? "var(--encre)" : "var(--text-muted)", fontWeight: 600, cursor: "pointer",
        }}
      >
        {label}
        {active && <span aria-hidden>{dir === "asc" ? "↑" : "↓"}</span>}
      </button>
    </th>
  );
}

export function PublicationsTable({ rows }: { rows: ShopifyPostRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "publishedAt" ? "desc" : "desc");
    }
  }

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "publishedAt") cmp = a.publishedAt.localeCompare(b.publishedAt);
      else if (sortKey === "reach") cmp = a.reach - b.reach;
      else if (sortKey === "bioLinkClicks") cmp = (a.bioLinkClicks ?? -1) - (b.bioLinkClicks ?? -1);
      else if (sortKey === "orders") cmp = a.orders - b.orders;
      else if (sortKey === "revenue") cmp = a.revenue - b.revenue;
      else cmp = (a.aov ?? -1) - (b.aov ?? -1);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  if (rows.length === 0) {
    return <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Aucune publication éligible sur la période.</p>;
  }

  return (
    <div style={{ overflowX: "auto", minWidth: 0 }}>
      <table style={{ width: "100%", minWidth: 760, fontSize: 13, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", color: "var(--text-muted)" }}>
            <th style={{ padding: "0 10px 10px 0", fontWeight: 600, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>Publication</th>
            <SortHeader label="Date" sortKey="publishedAt" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
            <th style={{ padding: "0 10px 10px 0", fontWeight: 600, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>Persona</th>
            <SortHeader label="Portée" sortKey="reach" activeKey={sortKey} dir={sortDir} align="right" onSort={handleSort} />
            <SortHeader label="Clics lien en bio" sortKey="bioLinkClicks" activeKey={sortKey} dir={sortDir} align="right" onSort={handleSort} />
            <SortHeader label="Commandes" sortKey="orders" activeKey={sortKey} dir={sortDir} align="right" onSort={handleSort} />
            <SortHeader label="CA" sortKey="revenue" activeKey={sortKey} dir={sortDir} align="right" onSort={handleSort} />
            <SortHeader label="Panier moyen" sortKey="aov" activeKey={sortKey} dir={sortDir} align="right" onSort={handleSort} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr key={p.id} style={{ borderTop: "1px solid var(--bordure-carte)" }}>
              <td style={{ padding: "9px 10px 9px 0", maxWidth: 260 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span
                    style={{
                      flex: "0 0 auto", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 7,
                      background: "var(--panneau)", border: "1px solid var(--bordure)", fontSize: 9.5, fontWeight: 700, color: "var(--text-muted)",
                    }}
                    title={FORMAT_LABEL[p.mediaType]}
                  >
                    {FORMAT_LABEL[p.mediaType].slice(0, 2).toUpperCase()}
                  </span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={postDisplayName(p.caption, 200)}>
                    {postDisplayName(p.caption)}
                  </span>
                </div>
              </td>
              <td style={{ padding: "9px 10px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{shortDate(p.publishedAt)}</td>
              <td style={{ padding: "9px 10px" }}>
                <PersonaBadge personaKey={p.personaKey} />
              </td>
              <td style={{ padding: "9px 10px", textAlign: "right" }}>{fr(p.reach)}</td>
              <td style={{ padding: "9px 10px", textAlign: "right", color: p.bioLinkClicks == null ? "var(--text-muted)" : "var(--encre)" }}>
                {p.bioLinkClicks == null ? "—" : fr(p.bioLinkClicks)}
              </td>
              <td style={{ padding: "9px 10px", textAlign: "right" }}>{fr(p.orders)}</td>
              <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: 700 }}>{eur(p.revenue)}</td>
              <td style={{ padding: "9px 10px", textAlign: "right", color: "var(--text-muted)" }}>{eur(p.aov)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
