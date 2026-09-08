import { redirect } from "next/navigation";

// Racine de marque — fusionnée dans /analyse ("Import / API", 2026-09-08) :
// Vue d'ensemble, Audience, Croissance, Contenu et Écosystème sont
// regroupés sur une seule page. Cette route reste en place (pas de 404)
// car elle est toujours la cible directe du sélecteur de marque (Header)
// et de la liste des marques (/{org}) — elle redirige simplement.
export default async function BrandRootPage({
  params,
}: {
  params: Promise<{ org: string; brand: string }>;
}) {
  const { org: orgSlug, brand: brandSlug } = await params;
  redirect(`/${orgSlug}/${brandSlug}/analyse`);
}
