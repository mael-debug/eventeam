import { Card } from "@/components/ds";

// Page Intro — "Ce qu'un export mensuel ne pourra jamais nous dire". Wording
// validé : toujours "départ observé", jamais "cette personne s'est
// désabonnée avec certitude" — un export ne voit qu'une absence entre deux
// photos, jamais l'acte lui-même.

const LIMITS: { title: string; text: string }[] = [
  {
    title: "Le moment exact d'un départ",
    text: "Un export situe un départ quelque part entre deux snapshots, jamais à l'heure ou au jour près.",
  },
  {
    title: "Ceux qui arrivent puis repartent entre deux imports",
    text: "Une personne qui suit puis se désabonne entre deux exports n'apparaît dans aucun des deux snapshots — elle reste invisible.",
  },
  {
    title: "La raison d'un départ",
    text: "Un export montre qu'une personne n'est plus présente, jamais pourquoi elle est partie.",
  },
  {
    title: "L'âge, le genre ou la ville d'une personne précise",
    text: "Les données démographiques d'un export sont agrégées sur l'ensemble de l'audience, jamais attribuées à un individu.",
  },
  {
    title: "Les départs antérieurs au premier snapshot",
    text: "Sans photo avant le premier import, aucun départ antérieur ne peut être reconstitué.",
  },
  {
    title: "Un « unfollow certain à 100 % »",
    text: "Un export ne montre qu'un départ observé entre deux snapshots — jamais un désabonnement confirmé avec certitude.",
  },
  {
    title: "Une causalité marketing",
    text: "Un export peut montrer une coïncidence temporelle avec une campagne, jamais prouver qu'elle en est la cause.",
  },
];

export function IntroLimitsSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.01em" }}>
          Ce qu&apos;un export mensuel ne pourra jamais nous dire
        </h2>
        <p style={{ margin: 0, fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 720 }}>
          Connaître ses limites fait partie de la fiabilité du produit.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14 }}>
        {LIMITS.map((l) => (
          <Card key={l.title} variant="claire" interactive={false} style={{ padding: 18 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.35, textWrap: "pretty" }}>{l.title}</span>
              <span style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, textWrap: "pretty" }}>{l.text}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
