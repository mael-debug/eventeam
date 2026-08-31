import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Toutes les routes sauf assets statiques et fichiers Next internes —
    // sans ce fichier à la racine, updateSession() n'était jamais invoqué :
    // chaque page se protégeait elle-même de façon incohérente (layout.tsx
    // fait `user!.id`, qui plante au lieu de rediriger si la session est
    // absente).
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
