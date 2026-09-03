"use client";

// Écran Contenu — liste des publications, triée par date, groupée par
// format. Plus de vignette (les fichiers médias ne seront plus importés) :
// la légende remplace l'image. Le filtre ci-dessus ne refait aucun appel
// réseau, il montre ou cache des groupes déjà reçus du serveur.

import { useState } from "react";
import { Card } from "@/components/ds";
import { fr, pct, shortDate } from "@/lib/format";

const CONFIDENCE_LABEL: Record<string, string> = { robuste: "Fiabilité élevée", indicatif: "Fiabilité indicative", insuffisant: "Fiabilité faible" };
const CONFIDENCE_BG: Record<string, string> = {
  robuste: "var(--vert-pastel)",
  indicatif: "var(--pastel-jaune)",
  insuffisant: "var(--creme-fonce)",
};
const FORMAT_LABEL: Record<string, string> = { post: "Posts", reel: "Reels", story: "Stories" };

export interface ContentItem {
  id: string;
  publishedAt: string;
  mediaType: string;
  caption: string | null;
  permalink: string | null;
  reach: number | null;
  followsGained: number | null;
  followConversionRate: number | null;
  excessArrivals: number | null;
  retentionRate: number | null;
  confidence: string | null;
}

function ContentCard({ item }: { item: ContentItem }) {
  return (
    <Card variant="claire" interactive={false}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, fontSize: 13, color: "var(--text-muted)" }}>
          <span style={{ fontWeight: 600, color: "var(--encre)" }}>{shortDate(item.publishedAt)}</span>
          {item.permalink && (
            <a href={item.permalink} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 600, color: "var(--bleu)" }}>
              Voir sur Instagram ↗
            </a>
          )}
        </div>

        <p style={{ margin: 0, fontSize: 13, color: item.caption ? "var(--encre)" : "var(--text-muted)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", fontStyle: item.caption ? "normal" : "italic" }}>
          {item.caption || "Sans légende"}
        </p>

        {item.followsGained != null ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: "clamp(24px, 2.6vw, 32px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                {fr(item.followsGained)} nouveaux abonnés
              </span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Instagram attribue directement ces abonnements à ce post.</span>
            </div>
            {(item.followConversionRate != null || item.reach != null) && (
              <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                {item.followConversionRate != null && <div>{pct(item.followConversionRate * 100)} des personnes touchées se sont abonnées</div>}
                {item.reach != null && <div>{fr(item.reach)} personnes touchées</div>}
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
            Aucune métrique de portée pour ce format — Meta ne l&apos;expose que pour les posts statiques.
          </div>
        )}

        <div style={{ borderTop: "1px solid var(--bordure-carte)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <span style={{ color: "var(--text-muted)" }}>Pic d&apos;abonnements dans les 48 h</span>
              <span style={{ fontWeight: 700 }}>{item.excessArrivals != null ? `+${fr(item.excessArrivals)} vs habituel` : "—"}</span>
            </div>
            {item.excessArrivals != null && (
              <span style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                Dans les 48 h suivant la publication, le compte a gagné {fr(item.excessArrivals)} abonnés de plus que son rythme
                habituel. Signal temporel, pas attribution certaine.
              </span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <span style={{ color: "var(--text-muted)" }}>Encore abonnés aujourd&apos;hui</span>
              <span style={{ fontWeight: 700 }}>{item.retentionRate != null ? pct(item.retentionRate * 100) : "non calculé"}</span>
            </div>
            {item.retentionRate != null && (
              <span style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                Parmi les personnes qui se sont abonnées pendant ces 48 h, {pct(item.retentionRate * 100)} suivent encore le
                compte au dernier point de mesure.
              </span>
            )}
          </div>

          {item.confidence && (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <span style={{ color: "var(--text-muted)" }}>Fiabilité de l&apos;analyse</span>
                <span style={{ borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700, background: CONFIDENCE_BG[item.confidence] ?? "var(--creme-fonce)" }}>
                  {CONFIDENCE_LABEL[item.confidence] ?? item.confidence}
                </span>
              </div>
              <span style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                Le pic est une corrélation temporelle : il peut être lié au post, à une campagne, à un événement ou à une autre
                source d&apos;acquisition.
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export function ContentFeed({ items }: { items: ContentItem[] }) {
  const [filter, setFilter] = useState<"all" | "post" | "reel" | "story">("all");

  const counts = { post: 0, reel: 0, story: 0 } as Record<string, number>;
  for (const item of items) counts[item.mediaType] = (counts[item.mediaType] ?? 0) + 1;

  const groups = (["post", "reel", "story"] as const)
    .filter((type) => filter === "all" || filter === type)
    .map((type) => ({ type, items: items.filter((i) => i.mediaType === type) }))
    .filter((g) => g.items.length > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 720, textWrap: "pretty" }}>
        Pour chaque publication, Community Intelligence distingue ce qu&apos;Instagram attribue directement au contenu et ce
        qui est simplement observé autour de sa publication.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {(["all", "post", "reel", "story"] as const).map((type) => {
          const active = filter === type;
          const label = type === "all" ? "Tous" : FORMAT_LABEL[type];
          const count = type === "all" ? items.length : counts[type] ?? 0;
          return (
            <button
              key={type}
              onClick={() => setFilter(type)}
              style={{
                cursor: "pointer",
                borderRadius: 999,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 600,
                border: active ? "1px solid transparent" : "1px solid var(--bordure)",
                background: active ? "var(--encre)" : "transparent",
                color: active ? "#FAF8F3" : "var(--text-muted)",
              }}
            >
              {label} · {fr(count)}
            </button>
          );
        })}
      </div>

      {groups.length === 0 ? (
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Aucune publication de ce type dans cette période.</p>
      ) : (
        groups.map((g) => (
          <div key={g.type} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {filter === "all" && (
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>
                {FORMAT_LABEL[g.type]} · {fr(g.items.length)}
              </h2>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {g.items.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
