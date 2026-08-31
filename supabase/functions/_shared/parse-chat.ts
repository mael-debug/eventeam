// PRD §7.4 (Lot 5) — your_chat_information.json.
//
// Structure réelle vérifiée sur un export Eden Park (2967 conversations,
// via inspection directe du fichier, pas une supposition) : un tableau
// racine d'objets { timestamp, media: [], label_values: [...], fbid }.
// label_values porte jusqu'à 13 indicateurs par discussion, chacun
// { label: string, value?: "Vrai"|"Faux", ... }. Les libellés sont en
// français, avec le même risque de mojibake que les autres exports Meta.
//
// Deux limites structurelles confirmées empiriquement, pas des angles
// morts : (1) fbid est un identifiant Meta interne à la conversation —
// aucun champ commun ne le relie au pseudo Instagram utilisé par
// followers_*.json/following.json (qui n'exposent qu'un `value`/`href`
// textuel, jamais d'identifiant numérique) : impossible de savoir QUEL
// compte suivi correspond à quelle discussion. (2) aucun des 13 libellés
// observés ne porte de palier d'audience ou de nombre d'abonnés — cette
// donnée n'existe simplement pas dans ce fichier. Ces deux limites sont
// donc définitives, pas un manque de parsing : le module Écosystème ne
// peut produire qu'un agrégat sur l'ensemble des discussions, jamais une
// liste de comptes nommés ni un palier d'audience (cf. écran Écosystème
// et catalogue).

import { fixMojibake } from "./mojibake.ts";

interface RawLabelValue {
  label?: string;
  value?: string;
}
interface RawChatEntry {
  fbid?: string;
  label_values?: RawLabelValue[];
}

export interface ParsedChatConversation {
  fbid: string;
  isBrand: boolean;
  isCreator: boolean;
  isSubscriber: boolean;
  isFollower: boolean;
  isVerified: boolean;
  gotReply: boolean;
}

// Les mots-clés de correspondance ci-dessous évitent volontairement toute
// lettre accentuée : les huit libellés qu'ils distinguent les uns des
// autres ne partagent aucun de ces mots, donc la correspondance reste
// fiable même si fixMojibake ne suffit pas à restituer parfaitement les
// caractères accentués (elle ne dépend alors que du texte non accentué,
// jamais retouché par le mojibake Meta).
function canonicalize(label: string): string {
  return fixMojibake(label).toLowerCase();
}

function flag(labelValues: RawLabelValue[], keyword: string): boolean {
  for (const lv of labelValues) {
    if (!lv.label) continue;
    if (canonicalize(lv.label).includes(keyword)) return (lv.value ?? "").trim().toLowerCase() === "vrai";
  }
  return false;
}

export function parseChatFile(json: unknown): ParsedChatConversation[] {
  if (!Array.isArray(json)) return [];
  const out: ParsedChatConversation[] = [];
  for (const entry of json as RawChatEntry[]) {
    if (!entry.fbid) continue;
    const lv = entry.label_values ?? [];
    out.push({
      fbid: entry.fbid,
      isBrand: flag(lv, "marque"),
      isCreator: flag(lv, "elle un creator"),
      isSubscriber: flag(lv, "abonn"),
      isFollower: flag(lv, "elle un follower"),
      isVerified: flag(lv, "profil"),
      gotReply: flag(lv, "obtenu une"),
    });
  }
  return out;
}
