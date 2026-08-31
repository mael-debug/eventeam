// Test de non-régression Lot 3 — rejoue l'algorithme de recompute_account()
// (follower_states/cohorts/cohort_survival) contre la fixture réelle
// pseudonymisée (deux exports Eden Park) et vérifie chaque valeur de
// EXPECTED.md au chiffre près.
//
// Ce script réimplémente en JS la même logique que le SQL de
// recompute_account() (0018_engine_real_fixture_fixes.sql), en s'appuyant
// sur les VRAIS parseurs de production (parse-followers.ts) pour la partie
// lecture des fichiers — c'est la voie la moins coûteuse pour valider
// l'algorithme contre des données réelles sans recharger ~22 000 lignes
// dans Postgres à chaque exécution. Toute divergence trouvée ici doit être
// reproduite dans une transaction Postgres annulée avant d'être considérée
// comme un bug confirmé du SQL (cf. la session qui a produit ce fichier :
// trois bugs trouvés ainsi, tous vérifiés et corrigés côté SQL).
//
// Usage : node --experimental-strip-types run.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseFollowersFile } from "../../../functions/_shared/parse-followers.ts";
import { parseReachInsights, parseInteractionInsights } from "../../../functions/_shared/parse-insights.ts";

const DIR = path.dirname(fileURLToPath(import.meta.url));
let failures = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  console.log(`${ok ? "OK  " : "FAIL"} ${label}` + (ok ? "" : `  actual=${actual} expected=${expected}`));
  if (!ok) failures++;
}

const july = JSON.parse(fs.readFileSync(path.join(DIR, "import_2026-07-22/followers_1.json"), "utf-8"));
const aug1 = JSON.parse(fs.readFileSync(path.join(DIR, "import_2026-08-27/followers_1.json"), "utf-8"));
const aug2 = JSON.parse(fs.readFileSync(path.join(DIR, "import_2026-08-27/followers_2.json"), "utf-8"));

const julyParsed = parseFollowersFile(july);
const augParsed = [...parseFollowersFile(aug1), ...parseFollowersFile(aug2)];

check("july file count", julyParsed.length, 9867);
check("aug file count (10000 + 2431 split)", augParsed.length, 12431);

const julyUsernames = new Set(julyParsed.map((p) => p.username));
const augUsernames = new Set(augParsed.map((p) => p.username));
const common = [...julyUsernames].filter((u) => augUsernames.has(u));
check("présents dans les deux imports", common.length, 5810);

// Import windows = min/max des followed_at réellement observés dans chaque
// fichier (process-import/index.ts:163-164), pas des bornes calendaires.
const julyTimes = julyParsed.map((p) => p.followedAt.getTime());
const augTimes = augParsed.map((p) => p.followedAt.getTime());
const july_i = { key: "july", exportedAt: Math.max(...julyTimes), windowStart: Math.min(...julyTimes), windowEnd: Math.max(...julyTimes) };
const aug_i = { key: "aug", exportedAt: Math.max(...augTimes), windowStart: Math.min(...augTimes), windowEnd: Math.max(...augTimes) };

const byUsername = new Map();
for (const p of julyParsed) byUsername.set(p.username, { july: p.followedAt.getTime() });
for (const p of augParsed) {
  const existing = byUsername.get(p.username) ?? {};
  existing.aug = p.followedAt.getTime();
  byUsername.set(p.username, existing);
}

const episodes = [];
for (const [username, obs] of byUsername) {
  const ordered = [];
  if (obs.july !== undefined) ordered.push({ import: july_i, followedAt: obs.july });
  if (obs.aug !== undefined) ordered.push({ import: aug_i, followedAt: obs.aug });
  let episode = 1, prevFollowedAt = null, current = null;
  for (const o of ordered) {
    if (prevFollowedAt === null || prevFollowedAt !== o.followedAt) {
      if (current) episodes.push(current);
      episode = prevFollowedAt === null ? 1 : episode + 1;
      current = { username, episode, followedAt: o.followedAt, firstImport: o.import, lastPresentImport: o.import };
    } else {
      current.lastPresentImport = o.import;
    }
    prevFollowedAt = o.followedAt;
  }
  if (current) episodes.push(current);
}
check("réabonnements (episode > 1)", episodes.filter((e) => e.episode > 1).length, 2);

const latestImport = aug_i;
const overlapStart = Math.max(july_i.windowStart, aug_i.windowStart);
const overlapEnd = Math.min(july_i.windowEnd, aug_i.windowEnd);
function statusOf(ep) {
  if (ep.lastPresentImport === latestImport) return "present";
  const inOverlap = ep.followedAt >= overlapStart && ep.followedAt <= overlapEnd;
  return inOverlap ? "gone" : "out_of_window";
}

const maxEpisodeByUsername = new Map();
for (const ep of episodes) maxEpisodeByUsername.set(ep.username, Math.max(ep.episode, maxEpisodeByUsername.get(ep.username) ?? 0));
function isCurrentlyGone(ep) {
  return ep.episode === maxEpisodeByUsername.get(ep.username) && statusOf(ep) === "gone";
}

const julyUsernameSet = new Set(julyParsed.map((p) => p.username));
let julyGone = 0, julyOutOfWindow = 0, julyPresent = 0;
for (const username of julyUsernameSet) {
  for (const ep of episodes.filter((e) => e.username === username && e.firstImport === july_i)) {
    const s = statusOf(ep);
    if (s === "gone") julyGone++;
    else if (s === "out_of_window") julyOutOfWindow++;
    else julyPresent++;
  }
}
check("hors fenêtre de recouvrement (juillet)", julyOutOfWindow, 2919);
void julyGone;
void julyPresent;

function isoWeekStart(ms) {
  const d = new Date(ms);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

const cohortEpisode1 = episodes.filter((e) => e.episode === 1);
const julyMeasurable = cohortEpisode1.filter((e) => e.firstImport === july_i && statusOf(e) !== "out_of_window");
const cohortMap = new Map();
for (const ep of julyMeasurable) {
  const wk = isoWeekStart(ep.followedAt);
  if (!cohortMap.has(wk)) cohortMap.set(wk, []);
  cohortMap.get(wk).push(ep);
}

const EXPECTED_COHORTS = [
  ["2026-05-25", 190, 7, 3.7, 94],
  ["2026-06-01", 246, 10, 4.1, 87],
  ["2026-06-08", 257, 6, 2.3, 80],
  ["2026-06-15", 1004, 84, 8.4, 73],
  ["2026-06-22", 804, 171, 21.3, 66],
  ["2026-06-29", 1274, 217, 17.0, 59],
  ["2026-07-06", 1779, 345, 19.4, 52],
  ["2026-07-13", 1275, 284, 22.3, 45],
  ["2026-07-20", 119, 14, 11.8, 38],
];
const sortedWeeks = [...cohortMap.keys()].sort((a, b) => a - b);
check("nombre de cohortes mesurables", sortedWeeks.length, EXPECTED_COHORTS.length);
sortedWeeks.forEach((wk, i) => {
  const [expWeek, expEff, expDep, expTaux, expExp] = EXPECTED_COHORTS[i] ?? [];
  const members = cohortMap.get(wk);
  const size = members.length;
  const departed = members.filter(isCurrentlyGone).length;
  const exposureDays = Math.floor((aug_i.exportedAt - wk) / 86400000);
  const weekLabel = new Date(wk).toISOString().slice(0, 10);
  check(`cohorte ${weekLabel} — semaine`, weekLabel, expWeek);
  check(`cohorte ${weekLabel} — effectif`, size, expEff);
  check(`cohorte ${weekLabel} — partis`, departed, expDep);
  check(`cohorte ${weekLabel} — taux`, Math.round((departed / size) * 1000) / 10, expTaux);
  check(`cohorte ${weekLabel} — exposition`, exposureDays, expExp);
});

const totalEff = sortedWeeks.reduce((s, wk) => s + cohortMap.get(wk).length, 0);
const totalDep = sortedWeeks.reduce((s, wk) => s + cohortMap.get(wk).filter(isCurrentlyGone).length, 0);
check("profils dans le recouvrement (mesurable)", totalEff, 6948);
check("partis", totalDep, 1138);
check("taux de départ brut", Math.round((totalDep / totalEff) * 1000) / 10, 16.4);

// profiles_reached.json / content_interactions.json — pièges 7 à 12
// (nombre sans séparateur de milliers, delta sans suffixe « vs … »,
// « Followers » à deux sens selon le fichier, littéral « delta » non
// substitué, métriques à 0 légitimes, pluriel variable).
const reachJson = JSON.parse(fs.readFileSync(path.join(DIR, "import_2026-08-27/profiles_reached.json"), "utf-8"));
const interactionsJson = JSON.parse(fs.readFileSync(path.join(DIR, "import_2026-08-27/content_interactions.json"), "utf-8"));

const exportedAt = new Date("2026-08-27T00:00:00Z");
const fallbackPeriod = { start: new Date("2026-05-27T00:00:00Z"), end: new Date("2026-08-27T00:00:00Z") };
const reach = parseReachInsights(reachJson, exportedAt, fallbackPeriod);

check("reach — comptes touchés (sans séparateur)", reach.accountsReached, 3359140);
check("reach — delta comptes touchés", reach.reachDeltaPct, 59.4);
check("reach — followers (part de portée, pas effectif)", reach.followerReachPct, 1);
check("reach — non-followers", reach.nonFollowerReachPct, 99);
check("reach — impressions (avec séparateur)", reach.impressions, 15570962);
check("reach — delta impressions (sans « vs … »)", reach.impressionsDeltaPct, 93.4);
check("reach — visites du profil", reach.profileVisits, 103643);
check("reach — delta visites du profil", reach.profileVisitsDeltaPct, -6.3);
check("reach — appuis sur liens externes", reach.externalTaps, 3427);
check("reach — delta appuis sur liens externes", reach.externalTapsDeltaPct, -20.7);

const interactions = parseInteractionInsights(interactionsJson);
const byFormat = Object.fromEntries(interactions.map((f) => [f.format, f]));

check("interactions[all] — total", byFormat.all.interactions, 122212);
check("interactions[all] — delta", byFormat.all.deltaPct, 31);
check("interactions[all] — comptes ayant interagi", byFormat.all.accountsInteracted, 87045);
check("interactions[all] — delta comptes ayant interagi", byFormat.all.accountsInteractedDeltaPct, 38.8);
check("interactions[all] — part followers", byFormat.all.accountsInteractedFollowerPct, 5.6);
check("interactions[all] — part non-followers", byFormat.all.accountsInteractedNonFollowerPct, 94.4);

check("interactions[posts] — total", byFormat.posts.interactions, 26024);
check("interactions[posts] — delta", byFormat.posts.deltaPct, -40.4);
check("interactions[posts] — likes", byFormat.posts.likes, 22373);
check("interactions[posts] — commentaires", byFormat.posts.comments, 834);
check("interactions[posts] — partages (« de »)", byFormat.posts.shares, 958);
check("interactions[posts] — enregistrements", byFormat.posts.saves, 643);

check("interactions[stories] — total", byFormat.stories.interactions, 2041);
check("interactions[stories] — delta", byFormat.stories.deltaPct, 3.7);
check("interactions[stories] — réponses", byFormat.stories.replies, 85);
check("interactions[stories] — partages", byFormat.stories.shares, 173);

check("interactions[videos] — total (légitimement 0)", byFormat.videos.interactions, 0);
check("interactions[videos] — delta (légitimement 0)", byFormat.videos.deltaPct, 0);

check("interactions[reels] — total", byFormat.reels.interactions, 81079);
check("interactions[reels] — delta", byFormat.reels.deltaPct, 160);
check("interactions[reels] — likes", byFormat.reels.likes, 72361);
check("interactions[reels] — commentaires", byFormat.reels.comments, 322);
check("interactions[reels] — partages (« des »)", byFormat.reels.shares, 2572);
check("interactions[reels] — enregistrements", byFormat.reels.saves, 3176);

check("interactions[lives] — total (légitimement 0)", byFormat.lives.interactions, 0);
check("interactions[lives] — delta (légitimement 0)", byFormat.lives.deltaPct, 0);

console.log(failures === 0 ? "\nTOUT PASSE" : `\n${failures} ÉCHEC(S)`);
process.exit(failures === 0 ? 0 : 1);
