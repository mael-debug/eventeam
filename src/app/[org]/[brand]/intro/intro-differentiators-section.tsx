import { Card } from "@/components/ds";

// Page Intro — Instagram fournit déjà beaucoup de métriques natives : cette
// section ne doit jamais laisser croire que Community Intelligence les
// "invente". La phrase différenciatrice ci-dessous doit rester proche du
// texte validé.

const DIFFERENTIATORS: { title: string; text: string }[] = [
  {
    title: "Mémoire",
    text: "Chaque export s'ajoute aux précédents plutôt que de les remplacer — l'historique s'accumule au lieu de disparaître.",
  },
  {
    title: "Cohortes",
    text: "Les followers recrutés à une période donnée sont suivis dans le temps, pour voir combien restent réellement à 30, 60 ou 90 jours.",
  },
  {
    title: "Croisements",
    text: "Contenu, acquisition, rétention et écosystème sont reliés entre eux plutôt que consultés séparément.",
  },
  {
    title: "Action",
    text: "Les constats se traduisent en pistes concrètes — sans jamais présenter une corrélation comme une certitude.",
  },
];

export function IntroDifferentiatorsSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.01em" }}>
          Instagram Insights fournit déjà beaucoup de métriques
        </h2>
        <p style={{ margin: 0, fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 760, textWrap: "pretty" }}>
          Portée, impressions, visites de profil, clics, performance des publications : Instagram affiche déjà
          tout cela nativement. Community Intelligence ne réinvente pas ces métriques — elle les prolonge dans le
          temps.
        </p>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--bleu)", lineHeight: 1.55, maxWidth: 760, textWrap: "pretty" }}>
          Instagram vous montre les métriques. Community Intelligence construit leur historique, relie les
          périodes entre elles et répond à des questions qu&apos;un rapport ponctuel ne pose pas.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {DIFFERENTIATORS.map((d) => (
          <Card key={d.title} variant="claire" interactive={false} style={{ padding: 18 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 800 }}>{d.title}</span>
              <span style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, textWrap: "pretty" }}>{d.text}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
