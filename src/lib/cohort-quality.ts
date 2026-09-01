// Score composite cross_analyses.cohort_quality_score (migration 0017 §3.5),
// réutilisé partout où une cohorte est affichée (Croissance, Acquisition)
// pour que le code couleur ne diverge jamais d'un écran à l'autre.

export function qualityColor(score: number): string {
  if (score >= 70) return "var(--vert-logo)";
  if (score >= 40) return "var(--pastel-jaune)";
  return "#C0392B";
}

/** Lundi (UTC) de la semaine ISO contenant la date donnée — même convention
 * que date_trunc('week', ...) en Postgres, pour faire correspondre une date
 * quelconque (ex. le début d'un pic d'acquisition) à une clé cohort_week. */
export function isoWeekMonday(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  const day = d.getUTCDay(); // 0 = dimanche
  const diff = (day === 0 ? -6 : 1) - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}
