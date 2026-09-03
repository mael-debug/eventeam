// PRD §5.4 — liste blanche fermée des fichiers ingérés. Principe absolu :
// on n'ingère que ce qui figure ici. Tout le reste est ignoré, jamais
// uploadé, jamais stocké (§9.1).

export type IngestCategory = "followers" | "following" | "insights" | "content" | "chat" | "media";

export interface WhitelistEntry {
  pattern: string;
  category: IngestCategory;
  label: string;
}

export const WHITELIST: WhitelistEntry[] = [
  { pattern: "connections/followers_and_following/followers_*.json", category: "followers", label: "Base nominative des abonnés" },
  { pattern: "connections/followers_and_following/following.json", category: "following", label: "Comptes suivis par la marque" },
  { pattern: "logged_information/past_instagram_insights/audience_insights.json", category: "insights", label: "Démographie, géographie, croissance" },
  { pattern: "logged_information/past_instagram_insights/profiles_reached.json", category: "insights", label: "Portée, impressions, visites, clics" },
  { pattern: "logged_information/past_instagram_insights/content_interactions.json", category: "insights", label: "Interactions par format" },
  { pattern: "logged_information/past_instagram_insights/posts.json", category: "insights", label: "Performance par publication (Lot 5)" },
  { pattern: "logged_information/past_instagram_insights/live_videos.json", category: "insights", label: "Performance des lives (Lot 5)" },
  // Élargi de "posts_*.json" à "posts*.json" : certains exports récents
  // livrent aussi un posts.json (sans underscore, ~21 Mo) à côté de
  // posts_1.json — l'ancien motif l'ignorait silencieusement alors que
  // c'est du contenu réel à ingérer (§5.4 point 5).
  { pattern: "your_instagram_activity/media/posts*.json", category: "content", label: "Légendes, dates, URI des médias (Lot 5)" },
  { pattern: "your_instagram_activity/media/reels.json", category: "content", label: "Légendes, dates, URI des médias (Lot 5)" },
  { pattern: "your_instagram_activity/media/stories.json", category: "content", label: "Légendes, dates, URI des médias (Lot 5)" },
  { pattern: "your_instagram_activity/messages/your_chat_information.json", category: "chat", label: "Métadonnées de conversations (Lot 5)" },
  { pattern: "media/**/*.jpg", category: "media", label: "Vignette" },
  { pattern: "media/**/*.png", category: "media", label: "Vignette" },
  // Reels/stories vidéo (Lot 5) : sans cette entrée, aucune vignette n'était
  // jamais générée pour ces formats — le .mp4 n'atteignait jamais le
  // navigateur, indépendamment de la génération de vignette elle-même.
  { pattern: "media/**/*.mp4", category: "media", label: "Vignette (image extraite de la vidéo)" },
];

function globToRegex(glob: string): RegExp {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        re += ".*";
        i++;
        if (glob[i + 1] === "/") i++;
      } else {
        re += "[^/]*";
      }
    } else if (".+^${}()|[]\\".includes(c)) {
      re += "\\" + c;
    } else {
      re += c;
    }
  }
  return new RegExp(`(^|/)${re}$`, "i");
}

const COMPILED = WHITELIST.map((entry) => ({ entry, regex: globToRegex(entry.pattern) }));

/** Classe un chemin d'entrée de ZIP selon la liste blanche, ou `null` s'il
 * n'y figure pas. Le chemin peut être préfixé par un dossier racine
 * arbitraire (l'export Instagram n'a pas toujours le même nom de dossier). */
export function classifyPath(path: string): WhitelistEntry | null {
  for (const { entry, regex } of COMPILED) {
    if (regex.test(path)) return entry;
  }
  return null;
}
