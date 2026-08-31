// PRD §7.2 — Edge Function process-import.
// Ordre : followers -> following -> insights (content/chat : Lot 5), puis
// recompute_account (§4.10) une fois l'import lui-même 'completed'.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { parseFollowersFile, parseFollowingFile, type ParsedFollower } from "../_shared/parse-followers.ts";
import {
  parseAudienceInsights,
  parseReachInsights,
  parseInteractionInsights,
} from "../_shared/parse-insights.ts";

const PARSER_VERSION = "2026-lot3.1";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function basename(path: string): string {
  return path.split("/").pop() ?? path;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function downloadJson(admin: SupabaseClient, storagePath: string | null): Promise<unknown> {
  if (!storagePath) throw new Error("Chemin de stockage manquant");
  const [bucket, ...rest] = storagePath.split("/");
  const { data, error } = await admin.storage.from(bucket).download(rest.join("/"));
  if (error || !data) throw new Error(`Téléchargement ${storagePath} : ${error?.message ?? "introuvable"}`);
  const text = await data.text();
  return JSON.parse(text);
}

interface ImportFileRow {
  id: string;
  source_path: string;
  category: string;
  storage_path: string | null;
}

async function withFileTracking(
  admin: SupabaseClient,
  file: ImportFileRow,
  fn: () => Promise<number | string>,
) {
  try {
    const result = await fn();
    await admin
      .from("import_files")
      .update({
        status: "parsed",
        rows_ingested: typeof result === "number" ? result : null,
        error_message: typeof result === "string" ? result : null,
      })
      .eq("id", file.id);
  } catch (err) {
    // §7.2 étape 3 : une erreur sur un fichier n'interrompt pas les autres.
    await admin
      .from("import_files")
      .update({ status: "error", error_message: String(err instanceof Error ? err.message : err) })
      .eq("id", file.id);
  }
}

interface ImportRow {
  id: string;
  account_id: string;
  storage_prefix: string;
  exported_at: string | null;
}

async function processImport(admin: SupabaseClient, importRow: ImportRow) {
  const { id: importId, account_id: accountId } = importRow;

  await admin
    .from("imports")
    .update({ status: "parsing", started_at: new Date().toISOString() })
    .eq("id", importId);

  const { data: files, error: filesError } = await admin
    .from("import_files")
    .select("id, source_path, category, storage_path")
    .eq("import_id", importId);
  if (filesError) throw new Error(`Lecture import_files : ${filesError.message}`);
  const fileRows = (files ?? []) as ImportFileRow[];

  let filesParsed = 0;

  // ---- followers_*.json (§7.5 : agrège tous les fragments, sans borne N) ----
  const followerFiles = fileRows.filter((f) => /^followers(_\d+)?\.json$/.test(basename(f.source_path)));
  const allFollowers: ParsedFollower[] = [];
  for (const f of followerFiles) {
    await withFileTracking(admin, f, async () => {
      const parsed = parseFollowersFile(await downloadJson(admin, f.storage_path));
      allFollowers.push(...parsed);
      return parsed.length;
    });
    filesParsed++;
  }

  // ---- following.json ----
  const followingFile = fileRows.find((f) => basename(f.source_path) === "following.json");
  let allFollowing: ParsedFollower[] = [];
  if (followingFile) {
    await withFileTracking(admin, followingFile, async () => {
      allFollowing = parseFollowingFile(await downloadJson(admin, followingFile.storage_path));
      return allFollowing.length;
    });
    filesParsed++;
  }

  // ---- résolution des pseudos en masse (private_identity, §6.3) ----
  const uniqueUsernames = Array.from(new Set([...allFollowers, ...allFollowing].map((p) => p.username)));
  const usernameToProfileId = new Map<string, number>();
  for (const batch of chunk(uniqueUsernames, 1000)) {
    if (batch.length === 0) continue;
    const { data, error } = await admin.rpc("ingest_resolve_usernames", { p_usernames: batch });
    if (error) throw new Error(`Résolution d'identité : ${error.message}`);
    for (const row of (data ?? []) as { username: string; profile_id: number }[]) {
      usernameToProfileId.set(row.username, row.profile_id);
    }
  }

  async function insertObservations(table: string, entries: ParsedFollower[]) {
    if (entries.length === 0) return;
    const rows = entries
      .map((f) => ({
        import_id: importId,
        account_id: accountId,
        profile_id: usernameToProfileId.get(f.username),
        followed_at: f.followedAt.toISOString(),
      }))
      .filter((r) => r.profile_id !== undefined);

    for (const batch of chunk(rows, 2000)) {
      const { error } = await admin.from(table).upsert(batch, { onConflict: "import_id,profile_id" });
      if (error) throw new Error(`Insertion ${table} : ${error.message}`);
    }
  }

  await insertObservations("follower_observations", allFollowers);
  await insertObservations("following_observations", allFollowing);

  // ---- fenêtre de l'import : min/max des followed_at observés (§4.1) ----
  const timestamps = allFollowers.map((f) => f.followedAt.getTime());
  const windowStart = timestamps.length ? new Date(Math.min(...timestamps)) : null;
  const windowEnd = timestamps.length ? new Date(Math.max(...timestamps)) : null;

  const exportedAt = importRow.exported_at ? new Date(importRow.exported_at) : new Date();
  const fallbackPeriod = { start: windowStart ?? exportedAt, end: windowEnd ?? exportedAt };

  await admin
    .from("imports")
    .update({
      window_start: windowStart?.toISOString() ?? null,
      window_end: windowEnd?.toISOString() ?? null,
    })
    .eq("id", importId);

  // ---- insights (§7.4, best-effort — voir avertissement en tête de
  // supabase/functions/_shared/parse-insights.ts) ----
  const insightFile = (name: string) => fileRows.find((f) => basename(f.source_path) === name);

  const audienceFile = insightFile("audience_insights.json");
  if (audienceFile) {
    await withFileTracking(admin, audienceFile, async () => {
      const parsed = parseAudienceInsights(await downloadJson(admin, audienceFile.storage_path), exportedAt, fallbackPeriod);
      const { error } = await admin.from("audience_insights").upsert({
        import_id: importId,
        account_id: accountId,
        period_start: toDateOnly(parsed.periodStart),
        period_end: toDateOnly(parsed.periodEnd),
        followers_total: parsed.followersTotal,
        followers_gained: parsed.followersGained,
        followers_lost: parsed.followersLost,
        followers_net: parsed.followersNet,
        growth_pct: parsed.growthPct,
        male_pct: parsed.malePct,
        female_pct: parsed.femalePct,
      });
      if (error) throw new Error(error.message);

      if (parsed.geo.length > 0) {
        const { error: geoError } = await admin.from("audience_geo").upsert(
          parsed.geo.map((g) => ({
            import_id: importId,
            account_id: accountId,
            kind: g.kind,
            name: g.name,
            pct: g.pct,
          })),
          { onConflict: "import_id,kind,name" },
        );
        if (geoError) throw new Error(`audience_geo : ${geoError.message}`);
      }

      if (parsed.age.length > 0) {
        const { error: ageError } = await admin.from("audience_age").upsert(
          parsed.age.map((a) => ({
            import_id: importId,
            account_id: accountId,
            gender: a.gender,
            age_bucket: a.ageBucket,
            pct: a.pct,
          })),
          { onConflict: "import_id,gender,age_bucket" },
        );
        if (ageError) throw new Error(`audience_age : ${ageError.message}`);
      }

      if (parsed.activity.length > 0) {
        const { error: activityError } = await admin.from("audience_activity").upsert(
          parsed.activity.map((a) => ({
            import_id: importId,
            account_id: accountId,
            weekday: a.weekday,
            active_count: a.activeCount,
          })),
          { onConflict: "import_id,weekday" },
        );
        if (activityError) throw new Error(`audience_activity : ${activityError.message}`);
      }

      return parsed.usedFallbackPeriod ? "période non trouvée : repli sur la fenêtre de l'import" : 1;
    });
    filesParsed++;
  }

  const reachFile = insightFile("profiles_reached.json");
  if (reachFile) {
    await withFileTracking(admin, reachFile, async () => {
      const parsed = parseReachInsights(await downloadJson(admin, reachFile.storage_path), exportedAt, fallbackPeriod);
      const { error } = await admin.from("reach_insights").upsert({
        import_id: importId,
        account_id: accountId,
        period_start: toDateOnly(parsed.periodStart),
        period_end: toDateOnly(parsed.periodEnd),
        accounts_reached: parsed.accountsReached,
        reach_delta_pct: parsed.reachDeltaPct,
        impressions: parsed.impressions,
        impressions_delta_pct: parsed.impressionsDeltaPct,
        profile_visits: parsed.profileVisits,
        profile_visits_delta_pct: parsed.profileVisitsDeltaPct,
        external_taps: parsed.externalTaps,
        external_taps_delta_pct: parsed.externalTapsDeltaPct,
      });
      if (error) throw new Error(error.message);
      return parsed.usedFallbackPeriod ? "période non trouvée : repli sur la fenêtre de l'import" : 1;
    });
    filesParsed++;
  }

  const interactionsFile = insightFile("content_interactions.json");
  if (interactionsFile) {
    await withFileTracking(admin, interactionsFile, async () => {
      const parsed = parseInteractionInsights(await downloadJson(admin, interactionsFile.storage_path));
      const { error } = await admin.from("interaction_insights").upsert(
        {
          import_id: importId,
          account_id: accountId,
          format: "all",
          interactions: parsed.interactions,
          delta_pct: parsed.deltaPct,
          likes: parsed.likes,
          comments: parsed.comments,
          shares: parsed.shares,
          saves: parsed.saves,
        },
        { onConflict: "import_id,format" },
      );
      if (error) throw new Error(error.message);
      return 1;
    });
    filesParsed++;
  }

  // recompute_account (§4.10) ne considère que les imports au statut
  // 'completed' : celui-ci doit donc l'atteindre AVANT le recalcul, sans
  // quoi ses propres observations seraient ignorées.
  await admin
    .from("imports")
    .update({ status: "completed", completed_at: new Date().toISOString(), files_parsed: filesParsed })
    .eq("id", importId);

  const { error: recomputeError } = await admin.rpc("recompute_account", { p_account_id: accountId });
  if (recomputeError) throw new Error(`Recalcul (§4.10) : ${recomputeError.message}`);

  return {
    followers: allFollowers.length,
    following: allFollowing.length,
    windowStart: windowStart?.toISOString() ?? null,
    windowEnd: windowEnd?.toISOString() ?? null,
    filesParsed,
    parserVersion: PARSER_VERSION,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  let importId: string;
  try {
    const body = await req.json();
    importId = body.import_id;
    if (!importId) throw new Error("import_id manquant");
  } catch {
    return json({ error: "Requête invalide : import_id requis" }, 400);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Authentification requise" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Au nom de l'appelant : sert uniquement à vérifier ses droits via RLS.
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  // service_role : contourne RLS pour écrire les tables dérivées (§7.2).
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: importRow, error: importError } = await userClient
    .from("imports")
    .select("id, account_id, status, storage_prefix, exported_at")
    .eq("id", importId)
    .single();
  if (importError || !importRow) {
    return json({ error: "Import introuvable ou accès refusé" }, 404);
  }

  const { data: canWrite } = await userClient.rpc("can_write_account", { p_account: importRow.account_id });
  if (!canWrite) {
    return json({ error: "Accès en écriture refusé sur ce compte" }, 403);
  }

  if (importRow.status !== "uploaded") {
    return json({ error: `Statut inattendu : ${importRow.status}` }, 409);
  }

  try {
    const result = await processImport(admin, importRow as ImportRow);
    return json({ ok: true, ...result });
  } catch (err) {
    await admin
      .from("imports")
      .update({ status: "failed", error_message: String(err instanceof Error ? err.message : err) })
      .eq("id", importId);
    return json({ error: "Échec du traitement", detail: String(err) }, 500);
  }
});
