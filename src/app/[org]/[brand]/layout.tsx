import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

const UPCOMING_MODULES = [
  "Audience",
  "Croissance & Départs",
  "Qualité d'acquisition",
  "Contenu",
  "Écosystème",
];

export default async function BrandLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ org: string; brand: string }>;
}) {
  const { org: orgSlug, brand: brandSlug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", orgSlug)
    .single();
  if (!org) notFound();

  const { data: brand } = await supabase
    .from("brands")
    .select("id, name, slug")
    .eq("org_id", org.id)
    .eq("slug", brandSlug)
    .single();
  if (!brand) notFound();

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <header className="flex flex-col gap-1">
        <Link href={`/${org.slug}`} className="text-xs text-neutral-500 hover:underline">
          ← {org.name}
        </Link>
        <h1 className="text-xl font-semibold">{brand.name}</h1>
      </header>

      <nav className="flex flex-wrap gap-2 border-b border-neutral-200 pb-3 text-sm">
        <Link
          href={`/${org.slug}/${brand.slug}`}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-neutral-50"
        >
          Vue d&apos;ensemble
        </Link>
        {UPCOMING_MODULES.map((m) => (
          <span
            key={m}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-neutral-400"
          >
            {m}
            <Badge variant="outline" className="text-[10px]">
              Lot 4
            </Badge>
          </span>
        ))}
      </nav>

      {children}
    </div>
  );
}
