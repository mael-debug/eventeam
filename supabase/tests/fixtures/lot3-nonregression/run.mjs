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

console.log(failures === 0 ? "\nTOUT PASSE" : `\n${failures} ÉCHEC(S)`);
process.exit(failures === 0 ? 0 : 1);
