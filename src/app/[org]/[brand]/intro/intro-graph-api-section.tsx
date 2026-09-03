import { Card, Badge, Chip } from "@/components/ds";

// Section 7-8 de la page Intro : l'API Meta Graph. Toutes les métriques
// citées viennent mot pour mot de la liste validée (doc Meta actuelle,
// section 18 de la spec produit) — ne jamais en ajouter d'autres ici.

const ACCOUNT_METRICS = [
  "reach", "follower_count", "website_clicks", "profile_views", "online_followers",
  "accounts_engaged", "total_interactions", "likes", "comments", "shares", "saves", "replies",
  "engaged_audience_demographics", "reached_audience_demographics", "follower_demographics",
  "follows_and_unfollows", "profile_links_taps", "views",
];

const MEDIA_METRICS = [
  "reach", "impressions", "plays", "views", "likes", "comments", "shares", "saved",
  "follows", "profile_visits", "profile_activity",
];

const MEDIA_VIDEO_METRICS = [
  "ig_reels_video_view_total_time", "ig_reels_avg_watch_time", "clips_replays_count",
  "ig_reels_aggregated_all_plays_count", "reels_skip_rate", "facebook_views", "crossposted_views",
];

const USER_PROFILE_FIELDS = [
  "name", "username", "profile_pic", "follower_count", "is_verified_user",
  "is_user_follow_business", "is_business_follow_user",
];

function MetricChips({ metrics }: { metrics: string[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {metrics.map((m) => (
        <Chip key={m} style={{ fontSize: 12, padding: "5px 11px" }}>
          {m}
        </Chip>
      ))}
    </div>
  );
}

export function IntroGraphApiSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Badge variant="cadrage">Extension API</Badge>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.01em" }}>Et avec l&apos;API Meta Graph ?</h2>
        <p style={{ margin: 0, fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 760, textWrap: "pretty" }}>
          L&apos;export nous donne de la profondeur. L&apos;API nous donne de la fréquence, du temps réel et des
          métriques supplémentaires.
        </p>
        <span style={{ fontSize: 12, fontStyle: "italic", color: "var(--text-muted)" }}>
          Ce qui suit décrit ce que l&apos;API Meta rend possible — pas une intégration déjà active dans Community
          Intelligence aujourd&apos;hui.
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, alignItems: "stretch" }}>
        <Card variant="claire" interactive={false} style={{ height: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%" }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>A. Collecte régulière</h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55 }}>
              L&apos;API Insights permet de récupérer automatiquement les métriques : quotidien, hebdomadaire,
              automatisé — plus besoin d&apos;attendre un export pour les métriques compatibles, et on construit
              notre propre historique.
            </p>
            <div style={{ marginTop: "auto", background: "var(--pastel-jaune)", borderRadius: 12, padding: "10px 12px", fontSize: 12, color: "var(--encre)", lineHeight: 1.5 }}>
              Les métriques utilisateur de l&apos;API Meta ne sont conservées que pendant une durée limitée
              (documentation Meta actuelle : jusqu&apos;à 90 jours) — d&apos;où l&apos;intérêt de les collecter et
              conserver notre propre historique.
            </div>
          </div>
        </Card>

        <Card variant="claire" interactive={false} style={{ height: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%" }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>B. Account Insights</h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55 }}>
              L&apos;API actuelle expose notamment ces métriques au niveau du compte :
            </p>
            <MetricChips metrics={ACCOUNT_METRICS} />
          </div>
        </Card>
      </div>

      <Card variant="encre" interactive={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>C. Performance média beaucoup plus riche</h3>
          <p style={{ margin: 0, fontSize: 14, color: "rgba(250,248,243,0.8)", lineHeight: 1.6 }}>
            Pour les médias et les Reels, l&apos;API peut notamment apporter :
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[...MEDIA_METRICS, ...MEDIA_VIDEO_METRICS].map((m) => (
              <span key={m} style={{ fontSize: 12, fontWeight: 600, color: "rgba(250,248,243,0.85)", background: "rgba(250,248,243,0.1)", border: "1px solid rgba(250,248,243,0.2)", borderRadius: 999, padding: "5px 11px" }}>
                {m}
              </span>
            ))}
          </div>

          <div style={{ background: "rgba(250,248,243,0.08)", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(250,248,243,0.55)" }}>Exemple fictif — Reel A</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginTop: 4 }}>
              {[
                ["1,2 M", "vues"],
                ["68 %", "non-followers"],
                ["xx s", "temps moyen"],
                ["xx %", "skip rate"],
                ["xx", "replays"],
                ["+ xxx", "follows"],
                ["xxx", "visites profil"],
              ].map(([value, label]) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>{value}</span>
                  <span style={{ fontSize: 12, color: "rgba(250,248,243,0.6)" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--vert-logo)", fontWeight: 600, textWrap: "pretty" }}>
            On ne mesure plus seulement si un Reel a généré des likes. On mesure s&apos;il a retenu l&apos;attention,
            déclenché une visite de profil et contribué à l&apos;acquisition.
          </p>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, alignItems: "stretch" }}>
        <Card variant="claire" interactive={false} style={{ height: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%" }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>D. Temps réel, grâce aux webhooks</h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55 }}>
              Graph API permet de recevoir des événements liés notamment aux nouveaux commentaires, messages,
              réponses à une story, réactions aux messages, événements de lecture/seen, postbacks et interactions
              de messagerie.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: "auto" }}>
              {["Un créateur important vient de commenter", "Un profil vérifié vient d'envoyer un message", "Une conversation importante attend une réponse"].map((ex) => (
                <div key={ex} style={{ fontSize: 13, fontStyle: "italic", color: "var(--bleu)", background: "var(--bleu-bg)", borderRadius: 10, padding: "8px 12px" }}>
                  « {ex} »
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card variant="claire" interactive={false} style={{ height: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%" }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>E. Enrichissement des utilisateurs qui interagissent</h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55 }}>
              Ceci ne concerne pas tous les followers. Pour certains utilisateurs ayant interagi dans le cadre
              autorisé par Meta — notamment via la messagerie et après consentement — la User Profile API peut
              fournir :
            </p>
            <MetricChips metrics={USER_PROFILE_FIELDS} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {["Un compte de 180 000 followers vient d'envoyer un DM", "Ce créateur est vérifié", "Il suit la marque, mais la marque ne le suit pas"].map((ex) => (
                <div key={ex} style={{ fontSize: 13, fontStyle: "italic", color: "var(--bleu)", background: "var(--bleu-bg)", borderRadius: 10, padding: "8px 12px" }}>
                  « {ex} »
                </div>
              ))}
            </div>
            <div style={{ marginTop: "auto", background: "var(--pastel-jaune)", borderRadius: 12, padding: "10px 12px", fontSize: 12, fontWeight: 700, color: "var(--encre)", lineHeight: 1.5 }}>
              L&apos;API ne permet pas d&apos;enrichir arbitrairement les 100 000 followers du compte.
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, alignItems: "stretch" }}>
        <Card variant="claire" interactive={false} style={{ height: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>F. Écosystème</h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55 }}>
              Avec l&apos;API adaptée / Facebook Login, Meta permet aussi certaines fonctionnalités autour des
              mentions, des médias associés à des hashtags, et de données basiques de comptes Business / Creator.
            </p>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
              Limite : pas d&apos;accès général aux données privées des comptes personnels.
            </div>
          </div>
        </Card>

        <Card variant="claire" interactive={false} style={{ height: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>G. Activation</h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55 }}>
              L&apos;API permet aussi, selon permissions, de publier du contenu, de gérer ou répondre aux
              commentaires, de gérer certaines conversations et d&apos;envoyer des réponses dans les règles Meta.
            </p>
            <div style={{ background: "var(--pastel-jaune)", borderRadius: 12, padding: "10px 12px", fontSize: 12, fontWeight: 700, color: "var(--encre)", lineHeight: 1.5 }}>
              Faux : « nous pouvons envoyer des DM à tous les followers ». Une conversation API suppose en général
              que l&apos;utilisateur Instagram ait initié la conversation ou interagi dans un contexte autorisé par
              Meta.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
