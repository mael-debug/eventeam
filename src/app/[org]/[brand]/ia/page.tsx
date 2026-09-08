import { Badge } from "@/components/ds";
import { resolveBrandContext } from "@/lib/context/brand-context";

// Showroom IA — page volontairement statique (aucune génération en direct
// ici) : elle illustre ce qu'un module IA pourrait produire une fois
// branché. Contrairement au reste de l'app, aucune section ne s'appuie sur
// une requête réelle — le seul rôle de resolveBrandContext ici est de
// vérifier qu'un compte est rattaché (cohérence de navigation) et de
// personnaliser le bandeau d'intro avec le handle. Chaque section reste
// séparée en deux : "Ce qu'on lit" (sources de données réelles, déjà
// disponibles) puis une MockCard (exemple de sortie IA, chiffres fictifs,
// toujours marquée "exemple illustratif") — même doctrine que le reste de
// l'app : ne jamais laisser un exemple se faire passer pour une donnée
// mesurée.
//
// Dépendances réelles de chaque section (non affichées ici — showroom
// commercial, pas document technique — mais à respecter si un jour ces
// sections sont branchées) :
//   §1, §4, §5, §8 — disponibles dès le branchement de l'API (légendes/
//     métriques de publication, démographie + engagement, publications
//     publiques des concurrents suivis, portée quotidienne + contenu déjà
//     importé). Rien à accumuler.
//   §2, §3, §7 — nécessitent un HISTORIQUE de commentaires accumulé par
//     nos soins : l'API Instagram ne fournit aucun rétroactif exploitable
//     sur les commentaires. Compter 4 à 8 semaines après le branchement du
//     webhook avant que ces sections aient de la matière.
//   §6 — dépend de la sortie des sept autres sections (synthèse).

function MockCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1.5px dashed var(--bleu)", borderRadius: 16, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 12, background: "var(--bleu-bg)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{title}</span>
        <span style={{ fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700, color: "var(--bleu)", background: "var(--surface-creme)", borderRadius: 999, padding: "3px 9px" }}>
          Exemple illustratif
        </span>
      </div>
      <div style={{ fontSize: 15, lineHeight: 1.75, color: "var(--encre)", display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
    </div>
  );
}

function SectionHeader({ n, title, subtitle }: { n: number; title: string; subtitle: string }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div style={{ flex: "0 0 auto", width: 34, height: 34, borderRadius: 999, background: "var(--encre)", color: "var(--surface-creme)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 15 }}>
        {n}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <h2 style={{ margin: 0, fontSize: 23, fontWeight: 800, letterSpacing: "-0.01em" }}>{title}</h2>
        <span style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 680 }}>{subtitle}</span>
      </div>
    </div>
  );
}

// Encadré "Ce qu'on lit" — discret par nature (c'est la preuve de crédibilité
// de l'exemple, pas l'élément qu'on veut mettre en avant visuellement).
function WhatWeRead({ items }: { items: string[] }) {
  return (
    <div style={{ border: "1px solid var(--bordure)", borderRadius: 10, padding: "9px 14px", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
      <span style={{ fontWeight: 700 }}>Ce qu&apos;on lit —</span> {items.join(" · ")}
    </div>
  );
}

// Ligne de conclusion, traitement distinct (liseré) pour marquer que c'est
// la décision permise par la section, pas une phrase de plus.
function SectionDecision({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ borderLeft: "3px solid var(--vert-logo)", paddingLeft: 14, fontSize: 14, color: "var(--encre)", lineHeight: 1.5 }}>
      <span style={{ fontWeight: 800 }}>Décision : </span>
      {children}
    </div>
  );
}

// Chiffre mis en avant au sein d'un paragraphe d'exemple.
function Stat({ children }: { children: React.ReactNode }) {
  return <strong style={{ fontSize: "1.1em", fontWeight: 800, color: "var(--bleu)" }}>{children}</strong>;
}

function Section({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>{children}</div>;
}

export default async function IaShowroomPage({
  params,
}: {
  params: Promise<{ org: string; brand: string }>;
}) {
  const { org: orgSlug, brand: brandSlug } = await params;
  const { accounts } = await resolveBrandContext(orgSlug, brandSlug);

  if (accounts.length === 0) {
    return <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Aucun compte Instagram rattaché.</p>;
  }
  const account = accounts[0];

  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 52, maxWidth: 1100, minWidth: 0, paddingBottom: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Badge variant="cadrage">Showroom</Badge>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: "-0.01em" }}>Ce que l&apos;IA pourrait faire avec vos données</h1>
        <div style={{ background: "var(--panneau)", border: "1px solid var(--bordure)", borderRadius: 18, padding: "18px 22px", display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Une promesse, pas un outil branché</span>
          <span style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.65, maxWidth: 780 }}>
            Chaque exemple ci-dessous est illustratif — les chiffres sont fictifs. Les données sources, elles, sont
            réelles et déjà disponibles pour @{account.handle} ; c&apos;est le module IA qui les transformerait en ces
            sorties qui n&apos;est pas encore branché.
          </span>
        </div>
      </div>

      {/* Disponible dès le branchement de l'API : légendes/format de chaque
          média, portée/vues/enregistrements/partages, taux de skip des
          reels, heure et jour de publication — aucun historique à
          accumuler, tout vient dans la même réponse dès la connexion. */}
      <Section>
        <SectionHeader
          n={1}
          title="Pourquoi ce post a marché, et pas l'autre"
          subtitle="Vos publications ont toutes des chiffres. Aucune n'a d'explication. L'IA lit les légendes, le format, l'heure et le sujet de vos 200 dernières publications, et cherche ce que les meilleures ont en commun. Pas une corrélation statistique : une lecture éditoriale, à l'échelle."
        />
        <WhatWeRead items={["légende et format de chaque média", "portée, vues, enregistrements, partages", "taux de skip des reels", "heure et jour de publication"]} />
        <MockCard title="Motif éditorial identifié">
          <p style={{ margin: 0 }}>Sur vos 40 dernières publications, un motif net ressort.</p>
          <p style={{ margin: 0 }}>
            Les reels montrant un vêtement <strong>porté en mouvement</strong> font <Stat>3,1×</Stat> la portée des
            packshots studio. L&apos;écart est stable sur les 6 derniers mois.
          </p>
          <p style={{ margin: 0 }}>
            Vos légendes qui racontent la fabrication (matière, atelier, geste) génèrent <Stat>4×</Stat> plus
            d&apos;enregistrements que les légendes produit classiques — 27 enregistrements en moyenne contre 6.
          </p>
          <p style={{ margin: 0 }}>
            À l&apos;inverse, les publications produit sans contexte plafonnent à <Stat>40 %</Stat> de votre portée
            moyenne, quel que soit le produit mis en avant. Six publications de ce type ce trimestre.
          </p>
        </MockCard>
        <SectionDecision>arbitrer le plan de production du mois suivant.</SectionDecision>
      </Section>

      {/* Nécessite un HISTORIQUE de commentaires accumulé par nos soins —
          l'API ne fournit pas de rétroactif exploitable. Compter 4 à 8
          semaines après le branchement du webhook `comments` avant que
          cette section ait de la matière. */}
      <Section>
        <SectionHeader
          n={2}
          title="Ce que vos abonnés disent, et que personne ne lit"
          subtitle="Vos commentaires contiennent des questions produit, des réclamations, des demandes de taille et des mentions de concurrents. Aujourd'hui ils se noient dans le flux. L'IA les classe en continu et remonte ce qui mérite une action."
        />
        <WhatWeRead items={["texte, auteur et date de chaque commentaire", "publication concernée", "historique accumulé depuis le branchement"]} />
        <MockCard title="Commentaires classés — semaine du 2 au 8 septembre">
          <p style={{ margin: 0 }}>Semaine du 2 au 8 septembre — <Stat>187</Stat> commentaires analysés.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, background: "var(--surface-creme)", borderRadius: 10, padding: "10px 14px" }}>
            {[
              ["Disponibilité produit", "23 commentaires"],
              ["Question de taille", "9 commentaires"],
              ["Signalement qualité", "4 commentaires"],
              ["Mention d'un concurrent", "6 commentaires"],
              ["Demande boutique / point de vente", "11 commentaires"],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 14 }}>
                <strong>{label}</strong>
                <span style={{ color: "var(--text-muted)" }}>{value}</span>
              </div>
            ))}
          </div>
          <p style={{ margin: 0 }}>
            <strong>À traiter en priorité :</strong> 4 commentaires évoquent un décousu au col sur le polo Ruck, dont 3
            sur la même publication du 28 août. Aucun n&apos;a reçu de réponse.
          </p>
        </MockCard>
        <SectionDecision>router vers le SAV, le merch ou le community manager selon la catégorie.</SectionDecision>
      </Section>

      {/* Nécessite un HISTORIQUE de commentaires accumulé par nos soins,
          même contrainte qu'en §2 — 4 à 8 semaines de matière avant que ce
          signal de demande soit exploitable. */}
      <Section>
        <SectionHeader
          n={3}
          title="La demande que votre e-commerce ne voit pas"
          subtitle="Quand un produit est en rupture, les gens ne vont pas sur la fiche produit — ils commentent. Cette demande n'apparaît nulle part dans vos analytics e-commerce. L'IA la capte et la chiffre."
        />
        <WhatWeRead items={["commentaires mentionnant une disponibilité, une taille, une couleur", "publication et produit associés", "évolution dans le temps"]} />
        <MockCard title="Demande captée — polo marine col contrasté">
          <p style={{ margin: 0 }}>
            <strong>Polo marine col contrasté</strong> — <Stat>31</Stat> signaux de demande en 10 jours.
          </p>
          <p style={{ margin: 0 }}>
            18 mentionnent explicitement une taille : 11× M, 7× L.
            <br />9 demandent une date de réassort.
            <br />4 signalent l&apos;avoir cherché en boutique sans le trouver.
          </p>
          <p style={{ margin: 0 }}>
            Aucun de ces 31 comptes n&apos;a visité la fiche produit : la rupture était déjà affichée. Cette demande
            est invisible dans vos statistiques de vente.
          </p>
          <p style={{ margin: 0 }}>
            Deuxième signal en formation : le nœud papillon rose édition limitée, <Stat>7</Stat> mentions en 4 jours.
          </p>
        </MockCard>
        <SectionDecision>alimenter les arbitrages de réassort avec un signal amont.</SectionDecision>
      </Section>

      {/* Disponible dès le branchement de l'API : démographie (âge, genre,
          ville, pays), engaged_audience_demographics, et les métriques de
          publication déjà couvertes en §1 — rien à accumuler. */}
      <Section>
        <SectionHeader
          n={4}
          title="L'audience que vous avez n'est pas celle que vous visez"
          subtitle="Vous connaissez l'âge, le genre et la géographie de vos abonnés. Vous ne savez pas lesquels engagent réellement. L'IA croise les deux et mesure l'écart entre l'audience que vous ciblez et celle qui répond."
        />
        <WhatWeRead items={["répartition par âge, genre, ville et pays", "comptes ayant interagi", "performance par publication", "ton et références des légendes"]} />
        <MockCard title="Écart audience ciblée / audience engagée">
          <p style={{ margin: 0 }}>
            Vos 45-54 ans représentent <Stat>19 %</Stat> de vos abonnés mais <Stat>34 %</Stat> de vos interactions.
            Ils commentent 2,4× plus que la moyenne et enregistrent davantage.
          </p>
          <p style={{ margin: 0 }}>
            Vos 25-34 ans pèsent <Stat>28 %</Stat> des abonnés et <Stat>17 %</Stat> des interactions.
          </p>
          <p style={{ margin: 0 }}>
            Or votre ligne éditoriale — formats verticaux rapides, références musicales contemporaines, langage
            familier — s&apos;adresse aux 25-34.
          </p>
          <p style={{ margin: 0 }}>
            Géographie : Paris concentre <Stat>22 %</Stat> de vos abonnés, mais Lyon, Bordeaux et Toulouse cumulent
            19 % avec un engagement <Stat>40 %</Stat> supérieur. Ces villes n&apos;ont jamais été adressées
            spécifiquement.
          </p>
        </MockCard>
        <SectionDecision>recalibrer le ton, ou assumer le décalage en connaissance de cause.</SectionDecision>
      </Section>

      {/* Disponible dès le branchement de l'API : business_discovery sur
          les concurrents suivis (données publiques uniquement) — rien à
          accumuler, un appel par concurrent. */}
      <Section>
        <SectionHeader
          n={5}
          title="Les territoires que vos concurrents occupent"
          subtitle="L'API donne accès aux publications publiques de Lacoste, Serge Blanco et Ralph Lauren France. L'IA les lit, identifie les angles qu'ils travaillent, et repère ce que personne n'occupe."
        />
        <WhatWeRead items={["publications récentes des concurrents suivis", "légendes, likes, commentaires", "évolution de leurs compteurs d'abonnés"]} />
        <MockCard title="Territoires concurrents">
          <p style={{ margin: 0 }}>Trimestre écoulé — 3 concurrents, <Stat>217</Stat> publications analysées.</p>
          <p style={{ margin: 0 }}>
            <strong>Lacoste</strong> a publié <Stat>14</Stat> contenus sur le tennis féminin. Vous : zéro. Territoire
            verrouillé, pas d&apos;angle d&apos;entrée évident.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Serge Blanco</strong> occupe la transmission père-fils, avec un engagement <Stat>2,3×</Stat>{" "}
            supérieur à sa propre moyenne. Territoire proche du vôtre, disputable.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Ralph Lauren France</strong> est sur le nautisme et la côte. Aucun recoupement avec votre univers.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Territoire libre : le rugby amateur, les clubs de village.</strong> Personne ne l&apos;occupe. Et
            3 de vos 5 meilleures publications de l&apos;année y touchent sans que ce soit une intention éditoriale.
          </p>
        </MockCard>
        <SectionDecision>choisir un angle différenciant plutôt que suivre.</SectionDecision>
      </Section>

      {/* Dépend de la sortie des sept autres sections — c'est une synthèse,
          pas une source de données propre. Ne peut exister avant qu'au
          moins §1/§4/§5/§8 (immédiates) et, idéalement, §2/§3/§7 (après
          accumulation) produisent quelque chose. */}
      <Section>
        <SectionHeader
          n={6}
          title="Votre brief créa du mois, déjà écrit"
          subtitle="Toutes les analyses précédentes convergent vers un seul document : ce qu'il faut produire le mois prochain. L'IA le rédige, l'équipe le corrige."
        />
        <WhatWeRead items={["la synthèse de toutes les sections précédentes"]} />
        <MockCard title="Brief éditorial — octobre">
          <div>
            <strong>Formats à privilégier</strong>
            <p style={{ margin: "2px 0 0" }}>
              Reel produit porté en mouvement (3,1× la portée). Objectif : 6 sur le mois.
              <br />Format atelier / matière en carrousel (record d&apos;enregistrements). 2 sur le mois.
            </p>
          </div>
          <div>
            <strong>Angles à travailler</strong>
            <p style={{ margin: "2px 0 0" }}>
              Le club amateur — territoire libre, cohérent avec vos meilleurs scores.
              <br />La transmission — Serge Blanco y performe, vous avez la légitimité.
            </p>
          </div>
          <div>
            <strong>Sujets à traiter en contenu</strong>
            <p style={{ margin: "2px 0 0" }}>
              Le réassort du polo marine (31 demandes en attente).
              <br />Le guide des tailles — 9 questions cette semaine, sujet récurrent.
            </p>
          </div>
          <div>
            <strong>À éviter</strong>
            <p style={{ margin: "2px 0 0" }}>
              Le packshot studio sans contexte : 6 publications ce trimestre, toutes sous 40 % de votre portée
              moyenne.
            </p>
          </div>
          <div>
            <strong>Fenêtre de publication</strong>
            <p style={{ margin: "2px 0 0" }}>Mardi et jeudi 18h-20h : portée moyenne supérieure de 35 %.</p>
          </div>
        </MockCard>
        <SectionDecision>c&apos;est le document que le community manager ouvre le 1er du mois.</SectionDecision>
      </Section>

      {/* Nécessite un HISTORIQUE de commentaires accumulé par nos soins,
          même contrainte qu'en §2/§3 — 4 à 8 semaines avant que le
          classement ait assez de matière pour distinguer une régularité
          d'un pic isolé. */}
      <Section>
        <SectionHeader
          n={7}
          title="Vos 50 ambassadeurs, nommément"
          subtitle="Certains comptes commentent chaque publication, depuis des années. Vous ne savez pas qui ils sont. L'IA reconstitue ce classement à partir de l'historique des commentaires et qualifie chaque profil."
        />
        <WhatWeRead items={["auteur, date et contenu de chaque commentaire", "publications concernées", "ancienneté et régularité"]} />
        <MockCard title="Top ambassadeurs identifiés">
          <div>
            <span style={{ fontWeight: 800, color: "var(--bleu)" }}>@clement.rugbylife</span> — <Stat>47</Stat> commentaires depuis janvier
            <p style={{ margin: "2px 0 0" }}>
              Présent sur 8 de vos 10 lancements. Commente en moyenne 20 minutes après publication. Répond aux autres
              commentateurs.
              <br />→ Profil : <strong>prescripteur</strong>
            </p>
          </div>
          <div>
            <span style={{ fontWeight: 800, color: "var(--bleu)" }}>@marieaparis</span> — <Stat>31</Stat> commentaires
            <p style={{ margin: "2px 0 0" }}>
              Ne commente que les publications produit. Pose des questions de taille et de disponibilité. Mentionne
              régulièrement ses achats.
              <br />→ Profil : <strong>cliente fidèle</strong>
            </p>
          </div>
          <div>
            <span style={{ fontWeight: 800, color: "var(--bleu)" }}>@lesgaillards.paris</span> — 12 commentaires, 3
            mentions en story
            <p style={{ margin: "2px 0 0" }}>
              Compte club. Vous a mentionné 3 fois sans jamais être sollicité.
              <br />→ Profil : <strong>relais communautaire</strong>
            </p>
          </div>
          <p style={{ margin: 0 }}><Stat>12</Stat> comptes de ce type identifiés sur les 6 derniers mois.</p>
        </MockCard>
        <SectionDecision>constituer une liste d&apos;activation pour un lancement, sans jamais toucher aux messages privés.</SectionDecision>
      </Section>

      {/* Disponible dès le branchement de l'API : reach quotidien (30 j),
          contenu et mentions déjà couverts en §1/§5/§9 d'Import/API — rien
          à accumuler. */}
      <Section>
        <SectionHeader
          n={8}
          title="Pourquoi cette courbe fait ça"
          subtitle="Votre courbe de portée a des pics et des creux. Aujourd'hui personne ne sait pourquoi. L'IA croise chaque anomalie avec ce qui a été publié ce jour-là et l'explique en une phrase."
        />
        <WhatWeRead items={["portée quotidienne sur 30 jours", "publications et leur contenu", "mentions reçues", "jours sans publication"]} />
        <MockCard title="Anomalies de portée expliquées">
          <div>
            <strong>18 août — pic à <Stat>1 026</Stat> comptes touchés</strong> (×14 vs la veille)
            <p style={{ margin: "2px 0 0" }}>
              Reel « atelier maille » publié le 17 à 18h. Meilleure performance du trimestre. Format et sujet
              cohérents avec le motif identifié en section 1.
            </p>
          </div>
          <div>
            <strong>10 août — pic à <Stat>689</Stat></strong>
            <p style={{ margin: "2px 0 0" }}>
              Ne vient d&apos;aucune publication. Mention par @lesgaillards.paris le 9 au soir. Votre portée organique
              dépend plus des mentions que vous ne le pensez.
            </p>
          </div>
          <div>
            <strong>25 au 31 août — portée divisée par <Stat>8</Stat></strong>
            <p style={{ margin: "2px 0 0" }}>
              6 jours consécutifs sans publication. La chute commence 48 h après le dernier post, pas le jour même.
            </p>
          </div>
          <p style={{ margin: 0 }}>
            <strong>Constat de fond :</strong> votre portée retombe systématiquement sous 5 comptes après 3 jours de
            silence. Le rythme compte plus que le volume.
          </p>
        </MockCard>
        <SectionDecision>comprendre le graphique au lieu de le contempler.</SectionDecision>
      </Section>
    </main>
  );
}
