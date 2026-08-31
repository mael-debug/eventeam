// Community Intelligence — Addendum v1.1 §4, §7.6 — bandeau de
// réconciliation permanent. Présent en pied de tout écran affichant un
// chiffre de croissance : protège contre le contresens le plus probable en
// réunion (lire un taux de couverture partielle comme le churn réel du
// compte). Style repris tel quel du gabarit de design (Card encre pleine
// largeur, cf. Community Intelligence.dc.html ~L370).

type ReconciliationRow = {
  meta_gained: number | null;
  observed_arrivals: number | null;
  arrivals_coverage: number | null;
  meta_lost: number | null;
  observed_departures: number | null;
  departures_coverage: number | null;
  unobservable_reason: string | null;
};

function fr(n: number) {
  return n.toLocaleString("fr-FR");
}

function pct(rate: number | null) {
  if (rate === null) return null;
  return rate.toLocaleString("fr-FR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function ReconciliationBanner({ reconciliation }: { reconciliation: ReconciliationRow | null }) {
  if (!reconciliation) return null;
  const { meta_gained, observed_arrivals, arrivals_coverage, meta_lost, observed_departures, departures_coverage, unobservable_reason } =
    reconciliation;

  const departuresLine =
    meta_lost != null && observed_departures != null && departures_coverage != null
      ? `Meta annonce ${fr(meta_lost)} désabonnements. Nous en identifions ${fr(observed_departures)} nommément, soit ${pct(departures_coverage)}.`
      : null;
  const arrivalsLine =
    meta_gained != null && observed_arrivals != null && arrivals_coverage != null
      ? `Sur les arrivées, Meta en annonce ${fr(meta_gained)}, nous en identifions ${fr(observed_arrivals)} nommément, soit ${pct(arrivals_coverage)}.`
      : null;

  if (!departuresLine && !arrivalsLine) return null;

  return (
    <div
      style={{
        background: "var(--encre)",
        color: "var(--surface-creme)",
        borderRadius: "18px",
        padding: "18px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {departuresLine && (
        <div style={{ fontSize: 14, lineHeight: 1.55, textWrap: "pretty" }}>
          {departuresLine} {unobservable_reason ?? ""}
        </div>
      )}
      {arrivalsLine && (
        <div style={{ fontSize: 14, color: "rgba(250,248,243,0.75)", lineHeight: 1.55, textWrap: "pretty" }}>
          {arrivalsLine}
        </div>
      )}
    </div>
  );
}
