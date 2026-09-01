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

// Tuiles plutôt que phrases (retour du 01/09) : les deux chiffres qui
// comptent (couverture nommée des départs et des arrivées) se lisent en un
// coup d'œil au lieu d'être noyés dans deux paragraphes de prose répétés
// sur chaque écran. La réserve méthodologique reste, en légende courte.
export function ReconciliationBanner({ reconciliation }: { reconciliation: ReconciliationRow | null }) {
  if (!reconciliation) return null;
  const { meta_gained, observed_arrivals, arrivals_coverage, meta_lost, observed_departures, departures_coverage, unobservable_reason } =
    reconciliation;

  const hasDepartures = meta_lost != null && observed_departures != null && departures_coverage != null;
  const hasArrivals = meta_gained != null && observed_arrivals != null && arrivals_coverage != null;
  if (!hasDepartures && !hasArrivals) return null;

  return (
    <div style={{ background: "var(--encre)", color: "var(--surface-creme)", borderRadius: "18px", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
      <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(250,248,243,0.55)" }}>
        Couverture face aux chiffres Meta
      </span>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
        {hasDepartures && (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(250,248,243,0.55)" }}>Départs identifiés nommément</span>
            <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>{pct(departures_coverage)}</span>
            <span style={{ fontSize: 13, color: "rgba(250,248,243,0.75)" }}>
              {fr(observed_departures!)} identifiés sur {fr(meta_lost!)} annoncés par Meta
            </span>
          </div>
        )}
        {hasArrivals && (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(250,248,243,0.55)" }}>Arrivées identifiées nommément</span>
            <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>{pct(arrivals_coverage)}</span>
            <span style={{ fontSize: 13, color: "rgba(250,248,243,0.75)" }}>
              {fr(observed_arrivals!)} identifiées sur {fr(meta_gained!)} annoncées par Meta
            </span>
          </div>
        )}
      </div>
      {unobservable_reason && (
        <div style={{ fontSize: 12, color: "rgba(250,248,243,0.6)", lineHeight: 1.5, borderTop: "1px solid rgba(250,248,243,0.15)", paddingTop: 10 }}>
          {unobservable_reason}
        </div>
      )}
    </div>
  );
}
