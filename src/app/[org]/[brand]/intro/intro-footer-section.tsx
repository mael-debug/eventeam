import { Card } from "@/components/ds";

// Page Intro — réserves de fin de page : contacts, médias physiques,
// vigilance sur Export All Time, et les 4 principes RGPD / véracité que le
// produit refuse d'enfreindre. Ne pas en ajouter de nouveaux sans revalider
// avec le métier — cette liste a été passée au crible côté produit.

const PRINCIPLES = [
  "Aucune donnée démographique individuelle n'est inventée : seules des statistiques agrégées sont affichées.",
  "Aucune causalité marketing n'est affirmée sans preuve — une coïncidence temporelle reste une coïncidence.",
  "Aucune identité n'est déduite par ressemblance de pseudo, de photo ou de nom.",
  "Aucun unfollow n'est présenté comme certain quand il ne s'agit que d'une disparition entre deux snapshots.",
];

export function IntroFooterSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        <Card variant="claire" interactive={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Contacts synchronisés</h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55, textWrap: "pretty" }}>
              Le fichier de contacts synchronisés (carnet d&apos;adresses) ne peut pas être relié de façon fiable
              à un nom d&apos;utilisateur Instagram — aucun rapprochement approximatif n&apos;est fait entre les
              deux.
            </p>
          </div>
        </Card>
        <Card variant="claire" interactive={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Fichiers médias</h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55, textWrap: "pretty" }}>
              Les fichiers .jpg, .png ou .mp4 d&apos;un export ne servent qu&apos;à afficher des vignettes. Ce sont
              les fichiers JSON — dates, légendes, métriques, identifiants — qui portent l&apos;analyse.
            </p>
          </div>
        </Card>
      </div>

      <Card variant="claire" interactive={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Vigilance sur l&apos;Export All Time</h3>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55, textWrap: "pretty" }}>
            L&apos;essentiel de la valeur du produit vient des exports mensuels réguliers. Mais un export
            « All Time » n&apos;est jamais automatiquement considéré comme complet à 100 % sans validation de sa
            couverture — l&apos;idée directrice pour le moteur est de comparer, à terme, le nombre de profils
            listés dans les fichiers <code>followers_*.json</code> au total <code>followers_total</code> fourni
            par les Insights. Le vocabulaire produit dit « snapshot complet validé », jamais « All Time = forcément
            complet ».
          </p>
        </div>
      </Card>

      <div
        style={{
          border: "1px solid var(--bordure-carte)",
          borderRadius: "var(--rayon-carte)",
          padding: 22,
          background: "var(--panneau)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Ce que nous refusons d&apos;inventer</h3>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
          {PRINCIPLES.map((p) => (
            <li key={p} style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55 }}>
              <span aria-hidden style={{ color: "var(--bleu)", fontWeight: 800 }}>—</span>
              <span style={{ textWrap: "pretty" }}>{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
