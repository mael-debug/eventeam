// Community Intelligence — formatage partagé entre les écrans (fr-FR,
// séparateurs de milliers, pourcentages signés). Un seul endroit pour ces
// règles, réutilisé par la bannière de réconciliation et par les écrans.

export function fr(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("fr-FR");
}

export function signedFr(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  const s = n.toLocaleString("fr-FR");
  return n > 0 ? `+${s}` : s;
}

export function pct(n: number | null | undefined, decimals = 1): string {
  if (n === null || n === undefined) return "—";
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} %`;
}

export function signedPct(n: number | null | undefined, decimals = 1): string {
  if (n === null || n === undefined) return "—";
  const s = pct(Math.abs(n), decimals);
  return n > 0 ? `+${s}` : n < 0 ? `-${s}` : s;
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}
