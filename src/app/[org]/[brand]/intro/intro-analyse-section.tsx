import { Card } from "@/components/ds";

// Page Intro — second pilier : ce que la connexion directe à Instagram
// (une fois branchée) ajoutera à la mémoire déjà construite par les
// exports (sections ci-dessus/ci-dessous). Les capacités listées ont été
// vérifiées auprès d'Instagram en conditions réelles (voir la page
// Analyse) — présentées ici sans jargon technique, toujours annoncées
// comme "à venir" : rien n'est branché à ce jour, cette section ne doit
// jamais laisser croire le contraire.

const CONFIRMED_CAPABILITIES: { title: string; text: string }[] = [
  { title: "Portée et audience touchée", text: "Chaque jour, et par format (post, reel, story) — plus le détail publication par publication." },
  { title: "Performance de chaque publication", text: "Vues, j'aime, commentaires, enregistrements, partages, et durée de visionnage pour les reels." },
  { title: "Profil de l'audience", text: "Villes, pays, âge — et le genre, quand l'abonné l'a renseigné auprès d'Instagram (ce n'est pas systématique)." },
  { title: "Veille concurrentielle", text: "Nombre d'abonnés et de publications des comptes concurrents suivis, en un coup d'œil." },
];

const STILL_TO_CONNECT = [
  "Les commentaires en direct, et le classement des commentateurs les plus actifs",
  "Les mentions de la marque ailleurs sur Instagram",
  "Les statistiques détaillées des stories",
];

export function IntroAnalyseSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.01em" }}>
          Un second pilier : les données Instagram en direct
        </h2>
        <p style={{ margin: 0, fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 720, textWrap: "pretty" }}>
          En plus de la mémoire construite par les exports mensuels, Community Intelligence pourra se connecter
          directement au compte Instagram pour remonter des statistiques que l&apos;export ne contient pas. Cette
          connexion n&apos;est pas encore active — les capacités ci-dessous ont déjà été vérifiées auprès
          d&apos;Instagram, en attendant le branchement.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
        {CONFIRMED_CAPABILITIES.map((c) => (
          <Card key={c.title} variant="claire" interactive={false} style={{ padding: 18 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 800 }}>{c.title}</span>
              <span style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, textWrap: "pretty" }}>{c.text}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card variant="claire" interactive={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)" }}>Encore à activer</span>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {STILL_TO_CONNECT.map((item) => (
              <li key={item} style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, textWrap: "pretty" }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
}
