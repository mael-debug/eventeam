import { Card, Badge } from "@/components/ds";
import { resolveBrandContext } from "@/lib/context/brand-context";
import { fr, pct, shortDate } from "@/lib/format";
import { TrendLine } from "@/components/trend-line";
import { MOCK_AUDIENCE_INTELLIGENCE } from "./mock-audience-intelligence";
import { AudienceAISummary } from "./audience-ai-summary";
import { AudiencePersonaCard } from "./audience-persona-card";
import { AudienceAffinityChart } from "./audience-affinity-chart";
import { AudienceBrandFit } from "./audience-brand-fit";
import { AudienceSignals } from "./audience-signals";
import { AudienceRecommendations } from "./audience-recommendations";
import { AudiencePrivacyNotice } from "./audience-privacy-notice";

// Portée minimale pour qu'un post entre dans un classement ou une moyenne
// basé sur follow_conversion_rate/engagement_rate — sous ce seuil, un ratio
// est un artefact d'échantillon quasi nul (ex. 3 comptes touchés, 2
// abonnés gagnés = 66 % de conversion), pas un signal de performance. Ne
// change rien à la donnée stockée (colonne non bornée depuis la migration
// 0040), seulement à ce qui est mis en avant côté rendu.
const MIN_RELIABLE_REACH = 50;

// Showroom IA — page volontairement statique (aucune génération en direct
// ici) : elle illustre ce qu'un module IA pourrait produire à partir des
// données déjà réelles de ce compte. Chaque section sépare strictement ce
// qui est mesuré (carte claire, chiffres réels) de ce qui est un exemple
// de sortie IA (carte en pointillés, étiquetée "exemple illustratif") —
// même doctrine que le reste de l'app : ne jamais laisser un exemple se
// faire passer pour une donnée mesurée.

function MockCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1.5px dashed var(--bleu)", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 10, background: "var(--bleu-bg)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{title}</span>
        <span style={{ fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700, color: "var(--bleu)", background: "#FFFFFF", borderRadius: 999, padding: "3px 9px" }}>
          Exemple illustratif
        </span>
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--encre)" }}>{children}</div>
    </div>
  );
}

function SectionHeader({ n, title, subtitle }: { n: number; title: string; subtitle: string }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div style={{ flex: "0 0 auto", width: 34, height: 34, borderRadius: 999, background: "var(--encre)", color: "var(--surface-creme)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 15 }}>
        {n}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800, letterSpacing: "-0.01em" }}>{title}</h2>
        <span style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>{subtitle}</span>
      </div>
    </div>
  );
}

export default async function IaShowroomPage({
  params,
}: {
  params: Promise<{ org: string; brand: string }>;
}) {
  const { org: orgSlug, brand: brandSlug } = await params;
  const { supabase, accounts } = await resolveBrandContext(orgSlug, brandSlug);

  if (accounts.length === 0) {
    return <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Aucun compte Instagram rattaché.</p>;
  }
  const account = accounts[0];

  const { data: latestImport } = await supabase
    .from("latest_completed_import")
    .select("import_id, window_start, window_end")
    .eq("account_id", account.id)
    .maybeSingle();

  if (!latestImport) {
    return (
      <Card variant="claire" interactive={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 19, fontWeight: 800 }}>Aucun import traité</div>
          <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Le showroom s&apos;appuie sur les données du premier import.</div>
        </div>
      </Card>
    );
  }

  const [
    { data: postsContent },
    { data: postsMetrics },
    { data: formatRetention },
    { data: interactions },
    { data: qualityRows },
    { data: ecoSummary },
    { data: geo },
    { data: captionStats },
  ] = await Promise.all([
    supabase.from("content").select("id, media_type, published_at, caption").eq("account_id", account.id).eq("media_type", "post"),
    supabase.from("content_metrics").select("content_id, reach, impressions, profile_visits, likes, comments, saves, shares, follows_gained, follow_conversion_rate").eq("account_id", account.id).eq("import_id", latestImport.import_id!),
    supabase.from("cross_analyses").select("dimension, payload").eq("account_id", account.id).eq("import_id", latestImport.import_id!).eq("code", "format_retention").order("dimension"),
    supabase.from("interaction_insights").select("*").eq("account_id", account.id).eq("import_id", latestImport.import_id!).in("format", ["reels", "posts", "stories"]),
    supabase.from("cross_analyses").select("dimension, payload").eq("account_id", account.id).eq("code", "cohort_quality_score").order("dimension"),
    supabase.from("v_ecosystem_chat_summary").select("*").eq("account_id", account.id).maybeSingle(),
    supabase.from("audience_geo").select("name, pct").eq("account_id", account.id).eq("import_id", latestImport.import_id!).eq("kind", "country").order("pct", { ascending: false }).limit(3),
    supabase.from("content").select("id, caption").eq("account_id", account.id).not("caption", "is", null),
  ]);

  const metricsByContent = new Map((postsMetrics ?? []).map((m) => [m.content_id, m]));
  const withMetrics = (postsContent ?? [])
    .map((c) => ({ ...c, m: metricsByContent.get(c.id) ?? null }))
    .filter((c) => c.m && c.m.follow_conversion_rate != null && (c.m.reach ?? 0) >= MIN_RELIABLE_REACH)
    .sort((a, b) => (b.m!.follow_conversion_rate ?? 0) - (a.m!.follow_conversion_rate ?? 0))
    .slice(0, 3);

  const withHashtag = (captionStats ?? []).filter((c) => c.caption?.includes("#")).length;
  const totalCaptioned = (captionStats ?? []).length;

  const qualitySeries = (qualityRows ?? [])
    .map((q) => ({ week: q.dimension, score: (q.payload as { score?: number })?.score }))
    .filter((q): q is { week: string; score: number } => q.score != null)
    .sort((a, b) => a.week.localeCompare(b.week));
  const recentQuality = qualitySeries.slice(-3);
  const recentQualityAvg = recentQuality.length ? Math.round(recentQuality.reduce((s, q) => s + q.score, 0) / recentQuality.length) : null;

  const reels = (interactions ?? []).find((i) => i.format === "reels");
  const postsAgg = (interactions ?? []).find((i) => i.format === "posts");
  const storiesAgg = (interactions ?? []).find((i) => i.format === "stories");

  const replyRate = ecoSummary?.n ? (ecoSummary.n_got_reply ?? 0) / ecoSummary.n : null;

  const retentionByFormat = new Map(
    (formatRetention ?? []).map((f) => [f.dimension, (f.payload as { retention_moyenne?: number })?.retention_moyenne ?? null]),
  );
  const bestFormat = [...retentionByFormat.entries()].sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0];
  const FORMAT_LABEL: Record<string, string> = { post: "les posts", reel: "les reels", story: "les stories" };

  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 40, maxWidth: 1100, minWidth: 0 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Badge variant="cadrage">Showroom</Badge>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: "-0.01em" }}>Ce que l&apos;IA pourrait faire avec vos données</h1>
        <p style={{ margin: 0, fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 760, textWrap: "pretty" }}>
          Page statique de démonstration, pas un outil branché : rien ici n&apos;est généré en direct. Chaque section montre
          d&apos;abord une donnée réelle de @{account.handle} (carte claire), puis un exemple du type de résultat qu&apos;un
          module IA pourrait produire à partir d&apos;elle (carte en pointillés bleus, toujours marquée « exemple
          illustratif »). Objectif : décider quoi construire en premier, pas livrer un produit fini.
        </p>
      </div>

      {/* 1 — Idées de post inspirées de ce qui fonctionne */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionHeader
          n={1}
          title="Idées de post inspirées de ce qui fonctionne"
          subtitle="L'IA analyserait vos publications les plus converties pour en dégager le ton, le format et le sujet — puis proposer des variations dans le même registre."
        />

        {withMetrics.length > 0 && (
          // Pas de vignette (media/ n'est plus jamais fourni) : légende, date
          // et métriques de posts.json portent seules l'identification —
          // état nominal, pas un repli dégradé.
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            {withMetrics.map((c) => (
              <Card key={c.id} variant="claire" interactive={false}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, fontSize: 12, color: "var(--text-muted)" }}>
                    <span style={{ fontWeight: 600, color: "var(--encre)" }}>{shortDate(c.published_at)}</span>
                    <span style={{ fontWeight: 700, color: "var(--bleu)" }}>{pct((c.m?.follow_conversion_rate ?? 0) * 100)} conversion</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: c.caption ? "var(--encre)" : "var(--text-muted)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", fontStyle: c.caption ? "normal" : "italic" }}>
                    {c.caption ?? "Légende non renseignée dans l'export"}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, background: "var(--panneau)", borderRadius: 10, padding: "8px 10px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 800 }}>{fr(c.m?.reach ?? null)}</span>
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Portée</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 800 }}>{fr(c.m?.impressions ?? null)}</span>
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Impressions</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 800 }}>{fr(c.m?.follows_gained ?? null)}</span>
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Abonnés +</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <MockCard title="Exemples de posts que l'IA pourrait suggérer, dans le même registre">
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
            <li>« Le détail qui change tout : zoom sur [pièce du produit], celle que peu remarquent au premier regard 🎀 »</li>
            <li>« D&apos;un rendez-vous pro à un week-end improvisé : un seul sac, deux vies. »</li>
            <li>« Cuir, précision, esprit sportif — la formule Eden Park sur [nouveau produit]. »</li>
          </ul>
          <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
            Générées ici à la main dans le ton des légendes réelles ci-dessus — un module branché s&apos;appuierait sur
            l&apos;historique complet, pas 3 exemples.
          </p>
        </MockCard>
      </div>

      {/* 2 — Idées de post pour maintenir une cohorte */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionHeader
          n={2}
          title="Idées de contenu pour retenir une cohorte fragile"
          subtitle="Croisé avec le score de qualité de cohorte (déjà calculé, écran Croissance) : quand une cohorte récente décroche, l'IA proposerait un contenu de réengagement ciblé plutôt qu'un post générique."
        />

        {qualitySeries.length > 1 && (
          <Card variant="claire" interactive={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Score de qualité par cohorte hebdomadaire (survie, ancienneté au départ, signaux suspects, horaires) — donnée
                réelle, déjà utilisée sur Croissance.
                {recentQualityAvg != null && ` Moyenne des 3 dernières semaines : ${recentQualityAvg}/100.`}
              </span>
              <TrendLine
                labels={qualitySeries.map((q) => shortDate(q.week))}
                series={[{ key: "score", label: "Score qualité", color: "var(--bleu)", values: qualitySeries.map((q) => q.score) }]}
              />
            </div>
          </Card>
        )}

        <MockCard title="Séquence de contenu de réengagement, si l'IA détecte une cohorte à risque">
          <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
            <li><strong>J+2 :</strong> story sondage léger (« Plutôt cuir ou toile ? ») pour réactiver l&apos;interaction.</li>
            <li><strong>J+5 :</strong> post « coulisses » (fabrication, équipe) — renforce le lien avant qu&apos;il ne se distende.</li>
            <li><strong>J+9 :</strong> reel témoignage client réel — la preuve sociale retient mieux qu&apos;une promotion.</li>
          </ol>
        </MockCard>
      </div>

      {/* 3 — Générateur de description & hashtags */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionHeader
          n={3}
          title="Générateur de légendes et de hashtags"
          subtitle="Meta n'expose la performance d'aucun hashtag précis — impossible de dire lesquels « fonctionnent ». L'IA peut en revanche générer des suggestions pertinentes par sujet, à valider ensuite sur quelques posts avant d'en tirer une vraie mesure."
        />

        <Card variant="claire" interactive={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Constat réel sur l&apos;export</span>
            <span style={{ fontSize: 26, fontWeight: 800 }}>
              {fr(withHashtag)} / {fr(totalCaptioned)} légendes contiennent un hashtag
            </span>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Aucun hashtag utilisé à ce jour sur les publications captées par l&apos;export — un générateur n&apos;aurait
              donc aucun historique de performance à imiter, seulement des suggestions génériques au départ.
            </span>
          </div>
        </Card>

        <MockCard title="Avant / après, sur une légende réelle du compte">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>Légende actuelle</span>
              <p style={{ margin: "2px 0 0" }}>« Le bandana imprimé, le petit détail qui change tout 💚 »</p>
            </div>
            <div>
              <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>Suggestion IA</span>
              <p style={{ margin: "2px 0 0" }}>
                « Le bandana imprimé, le petit détail qui change tout 💚 — celui qu&apos;on glisse partout, du bureau au
                week-end. »
                <br />
                <span style={{ color: "var(--bleu)" }}>#EdenPark #DetailQuiCompte #StyleIntemporel #AccessoireMode</span>
              </p>
            </div>
          </div>
        </MockCard>
      </div>

      {/* 4 — Idées de contenu engageant par format */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionHeader
          n={4}
          title="Contenu engageant, par format"
          subtitle="Les trois formats ne retiennent pas pareil (écran Contenu) : l'IA adapterait le brief selon le format plutôt que de recycler la même idée en post, reel et story."
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
          {[
            { key: "reel", label: "Reels", interactions: reels?.interactions },
            { key: "post", label: "Posts", interactions: postsAgg?.interactions },
            { key: "story", label: "Stories", interactions: storiesAgg?.interactions },
          ].map((f) => (
            <Card key={f.key} variant="claire" interactive={false}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>{f.label}</span>
                <span style={{ fontSize: 22, fontWeight: 800 }}>{retentionByFormat.has(f.key) ? pct((retentionByFormat.get(f.key) ?? 0) * 100) : "—"}</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>rétention 48 h attribuée</span>
                {f.interactions != null && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{fr(f.interactions)} interactions sur la période</span>}
              </div>
            </Card>
          ))}
        </div>

        <MockCard title={bestFormat ? `Le format le mieux placé aujourd'hui : ${FORMAT_LABEL[bestFormat[0]] ?? bestFormat[0]}` : "Idées par format"}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ margin: 0 }}><strong>Reel :</strong> montage rapide « avant/après » d&apos;un produit en situation (voyage, sport, bureau).</p>
            <p style={{ margin: 0 }}><strong>Story :</strong> sondage ou quiz sur une gamme, avec sticker réponse — format le plus léger à produire, souvent le mieux retenu.</p>
            <p style={{ margin: 0 }}><strong>Post :</strong> mise en scène produit soignée, légende courte (les meilleures conversions du compte ont des légendes de moins de 15 mots).</p>
          </div>
        </MockCard>
      </div>

      {/* 5 — Flows ManyChat + stratégies marketing */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionHeader
          n={5}
          title="Flows ManyChat et stratégies pour faire croître les abonnés"
          subtitle="Deux données réelles orientent la priorité : le taux de réponse en messagerie (Écosystème) et la géographie de l'audience (Audience)."
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {replyRate != null && (
            <Card variant="claire" interactive={false}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Taux de réponse actuel</span>
                <span style={{ fontSize: 26, fontWeight: 800, color: replyRate < 0.3 ? "#C0392B" : "var(--encre)" }}>{pct(replyRate * 100)}</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>sur {fr(ecoSummary?.n ?? 0)} discussions — cf. Écosystème</span>
              </div>
            </Card>
          )}
          {(geo ?? []).length > 0 && (
            <Card variant="claire" interactive={false}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Audience concentrée</span>
                <span style={{ fontSize: 26, fontWeight: 800 }}>{pct(geo![0].pct)}</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {geo!.map((g) => g.name).join(", ")}
                </span>
              </div>
            </Card>
          )}
        </div>

        <MockCard title="Flow ManyChat — répondre à un taux de réponse aujourd'hui trop bas">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div>1. Commentaire contenant un mot-clé (« prix », « dispo », un emoji produit) → déclenche le flow.</div>
            <div>2. Message privé automatique sous 1 minute : réponse à la question + lien produit.</div>
            <div>3. Si pas d&apos;interaction sous 24 h → relance légère avec une offre de découverte.</div>
            <div>4. Sortie de flow → passage en file de modération humaine pour toute question hors script.</div>
          </div>
        </MockCard>

        <MockCard title="Autres pistes marketing, ancrées sur les données réelles ci-dessus">
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
            <li>Créatives publicitaires priorisées {geo && geo.length > 0 ? `pour ${geo[0].name}` : "sur le premier pays"} plutôt qu&apos;une campagne générique multi-pays.</li>
            <li>Programme de parrainage avec code de réduction — mesurable directement via les pics d&apos;acquisition déjà détectés (écran Acquisition).</li>
            <li>Réponse automatique aux stories partagées par des abonnés (UGC) pour faire remonter le taux de réponse sans charge de modération supplémentaire.</li>
          </ul>
        </MockCard>
      </div>

      {/* Audience Intelligence — section 100 % démo (mock-audience-intelligence.ts),
          aucune donnée réelle ni appel réseau : cf. en-tête du fichier de données. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Badge variant="cadrage">{fr(MOCK_AUDIENCE_INTELLIGENCE.sampleSize)} profils actifs analysés</Badge>
            <Badge variant="forfait">Données anonymisées</Badge>
          </div>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.01em" }}>Découvrez qui compose réellement votre audience</h2>
          <p style={{ margin: 0, fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 760, textWrap: "pretty" }}>
            L&apos;IA transforme les signaux agrégés de votre communauté en personas, affinités et opportunités marketing.
          </p>
          <span style={{ fontSize: 12, fontStyle: "italic", color: "var(--text-muted)" }}>Données fictives à des fins de démonstration.</span>
        </div>

        <AudienceAISummary data={MOCK_AUDIENCE_INTELLIGENCE} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {MOCK_AUDIENCE_INTELLIGENCE.personas.map((persona) => (
            <AudiencePersonaCard key={persona.name} persona={persona} />
          ))}
        </div>

        <AudienceAffinityChart interests={MOCK_AUDIENCE_INTELLIGENCE.interests} brandAffinities={MOCK_AUDIENCE_INTELLIGENCE.brandAffinities} />

        <AudienceBrandFit
          score={MOCK_AUDIENCE_INTELLIGENCE.brandFit}
          dimensions={MOCK_AUDIENCE_INTELLIGENCE.brandFitDimensions}
          insight="L'audience reste très cohérente avec le territoire historique de la marque. Le principal signal d'évolution concerne la progression d'un univers lifestyle plus contemporain."
        />

        <AudienceSignals signals={MOCK_AUDIENCE_INTELLIGENCE.signals} />

        <AudienceRecommendations recommendations={MOCK_AUDIENCE_INTELLIGENCE.recommendations} />

        <AudiencePrivacyNotice />
      </div>
    </main>
  );
}
