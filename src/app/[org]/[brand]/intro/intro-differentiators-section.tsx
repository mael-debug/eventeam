import { Card } from "@/components/ds";

// Page Intro — la vraie comparaison qui compte pour un client : pas
// "export vs API" (détail interne), mais "appli Instagram" vs "Community
// Intelligence". Instagram fournit déjà de vraies métriques natives ;
// cette section ne doit jamais laisser croire qu'on les réinvente.

const DIFFERENTIATORS: { title: string; text: string }[] = [
  {
    title: "Mémoire",
    text: "Chaque import mensuel s'ajoute aux précédents au lieu de les remplacer : l'historique s'accumule au lieu de disparaître, contrairement à l'appli Instagram qui ne montre que l'instant présent.",
  },
  {
    title: "Cohortes",
    text: "Les followers recrutés à une période donnée sont suivis dans le temps, pour voir combien restent réellement 30, 60 ou 90 jours plus tard.",
  },
  {
    title: "Croisements",
    text: "Contenu, acquisition, rétention et écosystème sont reliés entre eux, plutôt que consultés séparément comme dans le reporting natif.",
  },
  {
    title: "Anticipation",
    text: "Comparer un mois à celui d'il y a un an, ou à la tendance des derniers mois, permet de repérer un décrochage tôt — avant qu'il ne devienne visible dans le compteur d'abonnés.",
  },
];

export function IntroDifferentiatorsSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.01em" }}>
          En quoi Community Intelligence va plus loin qu&apos;Instagram
        </h2>
        <p style={{ margin: 0, fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 720, textWrap: "pretty" }}>
          Portée, impressions, visites de profil, clics, performance des publications, followers gagnés ou perdus :
          Instagram affiche déjà tout cela nativement, dans l&apos;instant. Community Intelligence ne réinvente pas
          ces métriques — elle les mémorise mois après mois pour raconter une histoire qu&apos;un tableau de bord
          ponctuel ne peut pas raconter.
        </p>
        <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--bleu)", lineHeight: 1.55, maxWidth: 720, textWrap: "pretty" }}>
          Instagram vous montre les métriques. Community Intelligence construit leur historique, relie les
          périodes entre elles et répond à des questions qu&apos;un rapport ponctuel ne pose pas.
        </p>
      </div>

      <Card variant="encre" interactive={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(250,248,243,0.55)" }}>
            Exemple fictif — comparer à l&apos;an dernier (N-1)
          </span>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, textWrap: "pretty" }}>
            En octobre, vous voulez savoir si la communauté grandit mieux que l&apos;octobre précédent. Instagram
            ne garde qu&apos;un instantané récent : cette comparaison n&apos;y est pas possible. Community
            Intelligence, elle, a mémorisé chaque mois depuis le début du suivi — la comparaison à un an
            d&apos;écart devient une simple lecture, pas une reconstitution.
          </p>
        </div>
      </Card>

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
