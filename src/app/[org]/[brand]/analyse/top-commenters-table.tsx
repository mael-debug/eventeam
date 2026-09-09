"use client";

import { useMemo, useState } from "react";
import { fr, shortDate } from "@/lib/format";
import { PERSONA_DEFINITIONS, type TopCommenter, type PersonaKey } from "@/lib/analyse-mock";
import { PersonaBadge } from "./persona-badge";

// Seul tableau réellement triable de la page (colonnes cliquables) — les
// autres listes restent des rendus statiques serveur, déjà triés côté
// mock. Composant client minimal : les données sont déjà connues côté
// serveur (aucun fetch ici), seul le tri se fait dans le navigateur.
const PERSONA_NAME = Object.fromEntries(PERSONA_DEFINITIONS.map((p) => [p.key, p.name])) as Record<PersonaKey, string>;

type SortKey = "username" | "commentCount" | "lastCommentDate" | "persona";
type SortDir = "asc" | "desc";

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
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          background: "none",
          border: "none",
          padding: 0,
          font: "inherit",
          fontSize: 11,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: active ? "var(--encre)" : "var(--text-muted)",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {label}
        {active && <span aria-hidden>{dir === "asc" ? "↑" : "↓"}</span>}
      </button>
    </th>
  );
}

export function TopCommentersTable({ rows }: { rows: TopCommenter[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("commentCount");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "username" ? "asc" : "desc");
    }
  }

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "username") cmp = a.username.localeCompare(b.username);
      else if (sortKey === "commentCount") cmp = a.commentCount - b.commentCount;
      else if (sortKey === "lastCommentDate") cmp = a.lastCommentDate.localeCompare(b.lastCommentDate);
      else cmp = (PERSONA_NAME[a.personaKey as PersonaKey] ?? "").localeCompare(PERSONA_NAME[b.personaKey as PersonaKey] ?? "");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ maxHeight: 480, overflow: "auto" }}>
        <table style={{ width: "100%", minWidth: 480, fontSize: 13, borderCollapse: "collapse" }}>
          <thead style={{ position: "sticky", top: 0, background: "var(--carte-claire)" }}>
            <tr style={{ textAlign: "left", color: "var(--text-muted)" }}>
              <SortHeader label="Compte" sortKey="username" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHeader label="Commentaires" sortKey="commentCount" activeKey={sortKey} dir={sortDir} align="right" onSort={handleSort} />
              <SortHeader label="Dernier commentaire" sortKey="lastCommentDate" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHeader label="Persona" sortKey="persona" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr key={c.username} style={{ borderTop: "1px solid var(--bordure-carte)" }}>
                <td style={{ padding: "8px 10px 8px 0", fontWeight: 700, color: "var(--bleu)" }}>
                  @{c.username}
                  {c.verified && (
                    <span aria-label="Compte vérifié" title="Compte vérifié" style={{ marginLeft: 4, color: "var(--vert-logo)" }}>
                      ✓
                    </span>
                  )}
                </td>
                <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700 }}>{fr(c.commentCount)}</td>
                <td style={{ padding: "8px 10px", color: "var(--text-muted)" }}>{shortDate(c.lastCommentDate)}</td>
                <td style={{ padding: "8px 0" }}>
                  <PersonaBadge personaKey={c.personaKey} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
        Persona dominant, déduit des commentaires. Nécessite au moins 3 commentaires.
      </span>
    </div>
  );
}
