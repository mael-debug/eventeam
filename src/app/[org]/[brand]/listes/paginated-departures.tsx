"use client";

// Écran Listes — pagination réelle (1138 comptes partis sur le compte
// canari) : ne récupère qu'une page à la fois, refetch au changement de
// page plutôt qu'un chargement complet en une fois. L'ordre du view
// (v_recent_departures) est reproduit explicitement dans le tri client :
// LIMIT/OFFSET sans ORDER BY explicite n'est pas garanti stable entre deux
// requêtes séparées, contrairement à un simple LIMIT sans offset.

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds";
import { fr, shortDate } from "@/lib/format";
import { NominativeList, type ListRow } from "@/components/nominative-list";

const PAGE_SIZE = 50;

export function PaginatedDepartures({ accountId, totalCount }: { accountId: string; totalCount: number }) {
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<ListRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);
    const supabase = createClient();
    supabase
      .from("v_recent_departures")
      .select("*")
      .eq("account_id", accountId)
      .order("departure_window_end", { ascending: false, nullsFirst: false })
      .order("tenure_days", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
      .then(({ data, error: fetchError }) => {
        if (cancelled) return;
        if (fetchError) {
          setError(fetchError.message);
          return;
        }
        const mapped: ListRow[] = (data ?? [])
          .filter((d): d is typeof d & { profile_id: number; followed_at: string; cohort_week: string } => d.profile_id != null && d.followed_at != null && d.cohort_week != null)
          .map((d) => ({
            profileId: d.profile_id,
            followedAtLabel: shortDate(d.followed_at),
            cohortLabel: shortDate(d.cohort_week),
            intervalLabel:
              d.departure_window_start && d.departure_window_end
                ? `${shortDate(d.departure_window_start)} → ${shortDate(d.departure_window_end)}`
                : "—",
          }));
        setRows(mapped);
      });
    return () => {
      cancelled = true;
    };
  }, [accountId, page]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
      {error ? (
        <p style={{ fontSize: 14, color: "#7A2E22" }}>Erreur : {error}</p>
      ) : rows === null ? (
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Chargement…</p>
      ) : rows.length === 0 ? (
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Aucun départ sur cette page.</p>
      ) : (
        <NominativeList key={page} accountId={accountId} rows={rows} />
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderTop: "1px solid var(--bordure-carte)", paddingTop: 12 }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Page {page + 1} sur {fr(totalPages)} · {fr(totalCount)} comptes au total
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondaire" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            Précédent
          </Button>
          <Button variant="secondaire" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}
