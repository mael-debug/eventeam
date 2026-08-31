// Community Intelligence — bascule d'affichage agence/marque.
//
// Ne modifie jamais les droits réels : la RLS (organization_members.role /
// brand_members.role) reste l'unique frontière de sécurité, appliquée côté
// base indépendamment de ce fichier. Ceci ne pilote que le rendu — masquer
// la saisie de budget, le dépôt d'import, la révélation d'identités — pour
// qu'un utilisateur agence puisse prévisualiser ce qu'un client en lecture
// seule verrait, sans se reconnecter avec un second compte (cf. le
// `toggleRole` du gabarit de design, Community Intelligence.dc.html ~L1727).
//
// Un `brand_viewer` ne peut jamais bascule vers "agence" : sa vue est
// toujours "marque", quoi que porte le cookie.

import { cookies } from "next/headers";

export const VIEW_ROLE_COOKIE = "ci_view_role";
export type ViewRole = "agence" | "marque";

export async function getViewRole(realRole: string | null): Promise<ViewRole> {
  if (!realRole || realRole === "brand_viewer") return "marque";
  const store = await cookies();
  return store.get(VIEW_ROLE_COOKIE)?.value === "marque" ? "marque" : "agence";
}

export function canToggleView(realRole: string | null): boolean {
  return !!realRole && realRole !== "brand_viewer";
}
