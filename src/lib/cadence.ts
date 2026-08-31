// Community Intelligence — cadence d'import. Partagé entre /imports (bandeau
// d'avertissement) et Vue d'ensemble ("connue à N semaines près").

export const CADENCE_WEEKS: Record<string, number> = { weekly: 1, monthly: 4, quarterly: 13 };
export const CADENCE_LABEL: Record<string, string> = { weekly: "hebdomadaire", monthly: "mensuelle", quarterly: "trimestrielle" };
