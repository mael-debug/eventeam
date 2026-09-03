import { Fragment } from "react";
import { Card, Chip } from "@/components/ds";
import { EDEN_PARK_QUESTIONS, type QStatus } from "./intro-eden-park-data";

// Page Intro — section centrale : répondre UNIQUEMENT aux questions métier
// posées par Eden Park, une par une, sous une forme très visuelle. Pas de
// matrice générique à côté : c'est cette section qui doit porter la preuve
// de valeur du produit.

const STATUS_SYMBOL: Record<QStatus, string> = { yes: "✓", partial: "~", no: "✕" };
const STATUS_BG: Record<QStatus, string> = { yes: "var(--vert-pastel)", partial: "var(--pastel-jaune)", no: "var(--creme-fonce)" };
const STATUS_LABEL: Record<QStatus, string> = { yes: "Oui", partial: "Partiellement", no: "Non" };

function StatusBadge({ status, note }: { status: QStatus; note?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          borderRadius: 999,
          padding: "5px 14px",
          fontSize: 13,
          fontWeight: 800,
          background: STATUS_BG[status],
          color: "var(--encre)",
        }}
      >
        <span aria-hidden>{STATUS_SYMBOL[status]}</span>
        {STATUS_LABEL[status]}
      </span>
      {note && <span style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>{note}</span>}
    </div>
  );
}

function ListBlock({ title, icon, items, tone }: { title: string; icon: string; items: string[]; tone: "positive" | "negative" }) {
  if (items.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.02em", color: tone === "positive" ? "var(--bleu)" : "var(--encre)" }}>
        {icon} {title}
      </span>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((item) => (
          <li key={item} style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, textWrap: "pretty" }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

const CHECKLIST_GROUPS: { title: string; items: string[]; done: boolean }[] = [
  {
    title: "Disponible dès aujourd'hui, par export",
    done: true,
    items: ["Snapshots, dates de follow, contenus publiés", "Audience agrégée : âge, genre, pays, villes, activité"],
  },
  {
    title: "À ajouter avec un suivi plus fréquent",
    done: false,
    items: [
      "Des chiffres mis à jour chaque jour, pas seulement chaque mois",
      "Temps de visionnage des vidéos, et à quelle minute les gens décrochent",
      "Profil enrichi de certains utilisateurs qui interagissent",
    ],
  },
  {
    title: "À ajouter avec les données de campagnes payantes",
    done: false,
    items: ["Dépenses, portée et ciblage de chaque campagne"],
  },
  {
    title: "À ajouter pour l'e-commerce",
    done: false,
    items: ["Des statistiques du site pour relier campagne → conversion → communauté"],
  },
];

function DataChecklistCard() {
  return (
    <Card variant="claire" interactive={false} style={{ padding: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
            Question 6
          </span>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, lineHeight: 1.4 }}>
            Avons-nous déjà toutes les données nécessaires pour cette analyse ?
          </h3>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {CHECKLIST_GROUPS.map((g) => (
            <div key={g.title} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: g.done ? "var(--bleu)" : "var(--text-muted)" }}>{g.title}</span>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                {g.items.map((item) => (
                  <li key={item} style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, display: "flex", gap: 6, textWrap: "pretty" }}>
                    <span aria-hidden style={{ color: g.done ? "var(--bleu)" : "var(--bordure)" }}>{g.done ? "✓" : "○"}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ background: "var(--bleu-bg)", borderRadius: 14, padding: "14px 16px" }}>
          <p style={{ margin: 0, fontSize: 14, color: "var(--encre)", lineHeight: 1.55, textWrap: "pretty" }}>
            Pour répondre sérieusement à « les activations e-commerce dégradent-elles notre communauté ? »,
            l&apos;export Instagram mensuel seul ne suffit pas : il faut y ajouter un suivi plus fréquent, les
            données de campagnes et les statistiques du site.
          </p>
        </div>
      </div>
    </Card>
  );
}

export function IntroEdenParkQuestions() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.01em" }}>
          Les questions concrètes d&apos;Eden Park
        </h2>
        <p style={{ margin: 0, fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 720, textWrap: "pretty" }}>
          Une réponse honnête à chaque question posée, sans survendre la donnée.
        </p>
      </div>

      {EDEN_PARK_QUESTIONS.map((q) => (
        <Fragment key={q.n}>
        <Card variant="claire" interactive={false} style={{ padding: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                Question {q.n}
              </span>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, lineHeight: 1.4, textWrap: "pretty" }}>{q.question}</h3>
              <StatusBadge status={q.status} note={q.statusNote} />
            </div>

            {(q.canMeasure.length > 0 || q.cannotKnow.length > 0) && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
                <ListBlock title="Ce que nous pouvons réellement mesurer" icon="✓" items={q.canMeasure} tone="positive" />
                <ListBlock title="Ce que nous ne pouvons pas savoir" icon="✕" items={q.cannotKnow} tone="negative" />
              </div>
            )}

            {q.dataNeeded.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)" }}>Données nécessaires</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {q.dataNeeded.map((d) => (
                    <Chip key={d} style={{ fontSize: 12 }}>{d}</Chip>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: "var(--bleu-bg)", borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--bleu)", marginBottom: 4 }}>Ce que Community Intelligence peut en tirer</div>
              <p style={{ margin: 0, fontSize: 14, color: "var(--encre)", lineHeight: 1.55, textWrap: "pretty" }}>{q.takeaway}</p>
            </div>
          </div>
        </Card>
        {q.n === 5 && <DataChecklistCard />}
        </Fragment>
      ))}
    </div>
  );
}
