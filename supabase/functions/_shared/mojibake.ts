// PRD §7.3 — Les exports Instagram contiennent des chaînes en double
// encodage UTF-8 (mojibake). À corriger systématiquement à la lecture, sur
// toute chaîne ET toute clé lue depuis un JSON d'export.

export function fixMojibake(s: string): string {
  try {
    const bytes = Uint8Array.from([...s].map((c) => c.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return decoded.replace(/ /g, " ");
  } catch {
    return s;
  }
}
