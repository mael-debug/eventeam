// PRD §7.2 — Edge Function process-import.
// Ordre : followers -> following -> insights -> posts -> reels/stories ->
// chat, puis recompute_account (§4.10) une fois l'import lui-même 'completed'.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { parseFollowersFile, parseFollowingFile, type ParsedFollower } from "../_shared/parse-followers.ts";
import {
  parseAudienceInsights,
  parseReachInsights,
  parseInteractionInsights,
  firstStringMap,
} from "../_shared/parse-insights.ts";
import { parsePostsFile, collectPostKeys } from "../_shared/parse-posts.ts";
import { parsePostLabelsFile } from "../_shared/parse-post-labels.ts";
import { parseReelsFile, parseStoriesFile, parseActivityPostCaptions, type ParsedActivityMedia } from "../_shared/parse-activity-media.ts";
import { parseChatFile } from "../_shared/parse-chat.ts";
import { extractMediaKey, normalizedKeysOf } from "../_shared/parsing.ts";

const PARSER_VERSION = "2026-lot5.3";

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

// Un .select() sans .range() s'arrête silencieusement à la limite par
// défaut de PostgREST (souvent 1000 lignes) — un import réel dépasse
// largement ce seuil rien qu'avec ses vignettes média (plusieurs milliers
// de fichiers). Toute lecture de import_files pour un import entier doit
// donc paginer explicitement plutôt que supposer qu'un seul select suffit.
async function selectAllPages<T>(
  run: (rangeStart: number, rangeEnd: number) => Promise<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const PAGE_SIZE = 1000;
  const out: T[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await run(offset, offset + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }
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
  status: string;
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

// Reprise (§ci-dessous, Deno.serve) : chaque phase saute les fichiers déjà
// 'parsed' par une invocation précédente — un budget CPU par invocation est
// fixe, et sur un gros compte (ex. Eden Park All : ~95k followers, des
// milliers de reels/stories/labels) une seule invocation peut ne pas
// suffire pour tout traiter, même en écrivant par lots (migrations 0040,
// 0041). Sans cette reprise, une invocation tuée en cours de route (« CPU
// Time exceeded », le processus s'arrête AVANT son propre catch — status
// reste à 'parsing', error_message reste null) forçait à tout recommencer
// depuis zéro à chaque tentative.
async function processImport(admin: SupabaseClient, importRow: ImportRow) {
  const { id: importId, account_id: accountId } = importRow;

  await admin
    .from("imports")
    .update({ status: "parsing", started_at: new Date().toISOString() })
    .eq("id", importId);

  const fileRows = await selectAllPages<ImportFileRow>((start, end) =>
    admin
      .from("import_files")
      .select("id, source_path, category, status, storage_path")
      .eq("import_id", importId)
      .range(start, end),
  );

  let filesParsed = 0;

  // Vignettes uploadées (media/**/*.jpg|png, cf. whitelist.ts) — utilisé par
  // posts.json ET stories.json (certaines stories sont des photos). Les
  // reels et les stories vidéo (.mp4) ne sont jamais uploadés (hors liste
  // blanche media), donc jamais retrouvés ici : thumbByMediaKey.get() renvoie
  // simplement undefined pour eux, pas une erreur.
  const thumbByMediaKey = new Map<string, string>();
  for (const f of fileRows) {
    if (f.category !== "media" || f.status !== "uploaded" || !f.storage_path) continue;
    const mediaKey = extractMediaKey(f.source_path);
    if (mediaKey) thumbByMediaKey.set(mediaKey, f.storage_path);
  }

  // ---- followers_*.json (§7.5 : agrège tous les fragments, sans borne N) ----
  const followerFiles = fileRows.filter((f) => /^followers(_\d+)?\.json$/.test(basename(f.source_path)));
  const allFollowers: ParsedFollower[] = [];
  for (const f of followerFiles) {
    if (f.status !== "parsed") {
      await withFileTracking(admin, f, async () => {
        const parsed = parseFollowersFile(await downloadJson(admin, f.storage_path));
        allFollowers.push(...parsed);
        return parsed.length;
      });
    }
    filesParsed++;
  }

  // ---- following.json ----
  const followingFile = fileRows.find((f) => basename(f.source_path) === "following.json");
  let allFollowing: ParsedFollower[] = [];
  if (followingFile) {
    if (followingFile.status !== "parsed") {
      await withFileTracking(admin, followingFile, async () => {
        allFollowing = parseFollowingFile(await downloadJson(admin, followingFile.storage_path));
        return allFollowing.length;
      });
    }
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

  // Écrit seulement s'il y a des observations CETTE invocation — sur une
  // reprise où les fichiers followers_*.json sont déjà 'parsed' (donc
  // sautés ci-dessus), timestamps est vide alors que la fenêtre a déjà été
  // correctement posée par l'invocation précédente ; l'écraser à null ici
  // la perdrait pour rien.
  if (timestamps.length > 0) {
    await admin
      .from("imports")
      .update({
        window_start: windowStart!.toISOString(),
        window_end: windowEnd!.toISOString(),
      })
      .eq("id", importId);
  }

  // ---- insights (§7.4, best-effort — voir avertissement en tête de
  // supabase/functions/_shared/parse-insights.ts) ----
  // Filtré par catégorie, pas seulement par nom de fichier : posts.json
  // existe en DEUX exemplaires dans un export réel, à des chemins et des
  // catégories différentes (logged_information/.../posts.json, category
  // "insights", métriques ; your_instagram_activity/media/posts.json,
  // category "content", label_values) — un basename() seul les confondrait
  // selon l'ordre de retour de la requête, non garanti.
  const findFile = (name: string, category: string) =>
    fileRows.find((f) => basename(f.source_path) === name && f.category === category);

  const audienceFile = findFile("audience_insights.json", "insights");
  if (audienceFile) {
   if (audienceFile.status !== "parsed") {
    await withFileTracking(admin, audienceFile, async () => {
      const audienceJson = await downloadJson(admin, audienceFile.storage_path);
      const parsed = parseAudienceInsights(audienceJson, exportedAt, fallbackPeriod);
      // §14 (proposé) : empreinte de schéma, pour détecter un libellé Meta
      // qui aurait changé avant que la métrique correspondante ne
      // disparaisse silencieusement (findByPrefix/findExact renvoient null).
      await admin.rpc("record_schema_fingerprint", {
        p_import_id: importId,
        p_account_id: accountId,
        p_file_kind: "audience_insights",
        p_observed_keys: normalizedKeysOf(firstStringMap(audienceJson)),
      });
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
   }
    filesParsed++;
  }

  const reachFile = findFile("profiles_reached.json", "insights");
  if (reachFile) {
   if (reachFile.status !== "parsed") {
    await withFileTracking(admin, reachFile, async () => {
      const reachJson = await downloadJson(admin, reachFile.storage_path);
      const parsed = parseReachInsights(reachJson, exportedAt, fallbackPeriod);
      await admin.rpc("record_schema_fingerprint", {
        p_import_id: importId,
        p_account_id: accountId,
        p_file_kind: "reach_insights",
        p_observed_keys: normalizedKeysOf(firstStringMap(reachJson)),
      });
      const { error } = await admin.from("reach_insights").upsert({
        import_id: importId,
        account_id: accountId,
        period_start: toDateOnly(parsed.periodStart),
        period_end: toDateOnly(parsed.periodEnd),
        accounts_reached: parsed.accountsReached,
        reach_delta_pct: parsed.reachDeltaPct,
        follower_reach_pct: parsed.followerReachPct,
        non_follower_reach_pct: parsed.nonFollowerReachPct,
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
   }
    filesParsed++;
  }

  const interactionsFile = findFile("content_interactions.json", "insights");
  if (interactionsFile) {
   if (interactionsFile.status !== "parsed") {
    await withFileTracking(admin, interactionsFile, async () => {
      const interactionsJson = await downloadJson(admin, interactionsFile.storage_path);
      const parsed = parseInteractionInsights(interactionsJson);
      await admin.rpc("record_schema_fingerprint", {
        p_import_id: importId,
        p_account_id: accountId,
        p_file_kind: "content_interactions",
        p_observed_keys: normalizedKeysOf(firstStringMap(interactionsJson)),
      });
      const { error } = await admin.from("interaction_insights").upsert(
        parsed.map((f) => ({
          import_id: importId,
          account_id: accountId,
          format: f.format,
          interactions: f.interactions,
          delta_pct: f.deltaPct,
          likes: f.likes,
          comments: f.comments,
          shares: f.shares,
          saves: f.saves,
          replies: f.replies,
          accounts_interacted: f.accountsInteracted,
          accounts_interacted_delta_pct: f.accountsInteractedDeltaPct,
          accounts_interacted_follower_pct: f.accountsInteractedFollowerPct,
          accounts_interacted_non_follower_pct: f.accountsInteractedNonFollowerPct,
        })),
        { onConflict: "import_id,format" },
      );
      if (error) throw new Error(error.message);
      return parsed.length;
    });
   }
    filesParsed++;
  }

  const postsFile = findFile("posts.json", "insights");
  if (postsFile) {
   if (postsFile.status !== "parsed") {
    await withFileTracking(admin, postsFile, async () => {
      const postsJson = await downloadJson(admin, postsFile.storage_path);
      const parsed = parsePostsFile(postsJson);
      await admin.rpc("record_schema_fingerprint", {
        p_import_id: importId,
        p_account_id: accountId,
        p_file_kind: "posts",
        p_observed_keys: collectPostKeys(postsJson),
      });

      // p.thumbPath (parsePostsFile) est le chemin brut tel qu'écrit dans
      // posts.json ("media/posts/18117474704481294.jpg"), relatif à la
      // racine de l'export — jamais le chemin réel dans le bucket
      // media-thumbs (accountId/<chemin complet dans le zip>.jpg, cf.
      // uploadOneMediaFile dans upload-import.ts). Les deux ne coïncident
      // jamais littéralement : on retrouve la vraie vignette par le seul
      // identifiant fiable partagé, le media_key numérique Instagram
      // (présent dans les deux chemins), via thumbByMediaKey (hoisté plus
      // haut, réutilisé aussi par stories.json plus bas).
      //
      // Un aller-retour SELECT puis INSERT/UPDATE par publication (ancienne
      // version) coûtait assez de temps CPU, sur un compte à plusieurs
      // centaines de posts, pour dépasser la limite d'exécution de l'Edge
      // Function — tuée par la plateforme avant même d'atteindre son propre
      // catch (imports.status restait bloqué à 'parsing'). upsert_post_
      // content_batch (migration 0040) fait tout ça en un aller-retour par
      // lot, côté Postgres.
      const rows = parsed.map((p) => {
        const followConversionRate = p.followsGained !== null && p.reach ? p.followsGained / p.reach : null;
        const engagementRate =
          p.reach && (p.likes !== null || p.comments !== null || p.shares !== null || p.saves !== null)
            ? ((p.likes ?? 0) + (p.comments ?? 0) + (p.shares ?? 0) + (p.saves ?? 0)) / p.reach
            : null;
        return {
          media_key: p.mediaKey,
          permalink: p.permalink,
          published_at: p.publishedAt.toISOString(),
          caption: p.caption,
          thumb_path: thumbByMediaKey.get(p.mediaKey) ?? null,
          reach: p.reach,
          impressions: p.impressions,
          likes: p.likes,
          comments: p.comments,
          shares: p.shares,
          saves: p.saves,
          profile_visits: p.profileVisits,
          follows_gained: p.followsGained,
          external_taps: p.externalTaps,
          follow_conversion_rate: followConversionRate,
          engagement_rate: engagementRate,
        };
      });

      for (const batch of chunk(rows, 500)) {
        const { error } = await admin.rpc("upsert_post_content_batch", {
          p_account_id: accountId,
          p_import_id: importId,
          p_rows: batch,
        });
        if (error) throw new Error(`content/content_metrics (lot) : ${error.message}`);
      }
      return rows.length;
    });
   }
    filesParsed++;
  }

  // ---- reels.json / stories.json (your_instagram_activity/media/, Lot 5)
  // — cf. en-tête de _shared/parse-activity-media.ts : aucune métrique
  // n'existe pour ces formats dans l'export (vérifié : les media_key des
  // reels n'apparaissent nulle part dans organic_insights_posts). content
  // reçoit donc une ligne (légende, date, vignette si photo) mais jamais de
  // content_metrics — Contenu ne les mélange jamais à la grille classée par
  // conversion, qui exige une métrique.
  // Même correctif que posts.json ci-dessus (migration 0040) : un lot par
  // aller-retour plutôt qu'un SELECT+INSERT/UPDATE par entrée — sur un
  // compte à plusieurs centaines de reels/stories, la boucle ligne à ligne
  // dépassait la limite de temps CPU de l'Edge Function.
  async function upsertActivityContent(mediaType: "reel" | "story", entries: ParsedActivityMedia[]): Promise<number> {
    const rows = entries.map((e) => ({
      media_key: e.mediaKey,
      published_at: e.publishedAt.toISOString(),
      caption: e.caption,
      thumb_path: thumbByMediaKey.get(e.mediaKey) ?? null,
    }));
    for (const batch of chunk(rows, 500)) {
      const { error } = await admin.rpc("upsert_activity_content_batch", {
        p_account_id: accountId,
        p_import_id: importId,
        p_media_type: mediaType,
        p_rows: batch,
      });
      if (error) throw new Error(`content (${mediaType}, lot) : ${error.message}`);
    }
    return rows.length;
  }

  const reelsFile = fileRows.find((f) => basename(f.source_path) === "reels.json");
  if (reelsFile) {
    if (reelsFile.status !== "parsed") {
      await withFileTracking(admin, reelsFile, async () => {
        const parsed = parseReelsFile(await downloadJson(admin, reelsFile.storage_path));
        return await upsertActivityContent("reel", parsed);
      });
    }
    filesParsed++;
  }

  const storiesFile = fileRows.find((f) => basename(f.source_path) === "stories.json");
  if (storiesFile) {
    if (storiesFile.status !== "parsed") {
      await withFileTracking(admin, storiesFile, async () => {
        const parsed = parseStoriesFile(await downloadJson(admin, storiesFile.storage_path));
        return await upsertActivityContent("story", parsed);
      });
    }
    filesParsed++;
  }

  // ---- posts_N.json (your_instagram_activity/media/, Lot 5) — jamais une
  // source de nouvelles publications (seul posts.json à métriques fait foi
  // sur QUELLES publications existent, cf. parsePostsFile) : sert
  // uniquement à compléter une légende vide, avec les vraies images du
  // carrousel le cas échéant (le fichier à métriques n'en garde qu'une).
  // posts.json SANS suffixe (même dossier) a une structure sans rapport
  // (label_values, pas media[]/title) — jamais routé ici, cf. bloc dédié
  // plus bas (parsePostLabelsFile).
  const activityPostFiles = fileRows.filter((f) => /^posts_\d+\.json$/.test(basename(f.source_path)) && f.category === "content");
  if (activityPostFiles.length > 0) {
    for (const f of activityPostFiles) {
      if (f.status !== "parsed") {
        await withFileTracking(admin, f, async () => {
          const captions = parseActivityPostCaptions(await downloadJson(admin, f.storage_path));
          const { data: existingPosts, error: postsError } = await admin
            .from("content")
            .select("id, media_key, caption")
            .eq("account_id", accountId)
            .eq("media_type", "post");
          if (postsError) throw new Error(`content (lecture légendes) : ${postsError.message}`);

          let updated = 0;
          for (const row of existingPosts ?? []) {
            if (row.caption) continue;
            const caption = captions.get(row.media_key);
            if (!caption) continue;
            const { error: updateError } = await admin.from("content").update({ caption }).eq("id", row.id);
            if (updateError) throw new Error(`content (complément légende) : ${updateError.message}`);
            updated++;
          }
          return updated;
        });
      }
      filesParsed++;
    }
  }

  // ---- posts.json SANS suffixe (your_instagram_activity/media/, label_values,
  // Lot 5) — cf. en-tête de _shared/parse-post-labels.ts. Enrichit une ligne
  // content déjà là (jointure fbid = media_key), ne crée jamais de nouvelle
  // publication : upsert_post_labels_batch fait un UPDATE par lot, jamais un
  // INSERT — même motif CPU que posts_N.json/reels/stories ci-dessus.
  const postLabelsFile = findFile("posts.json", "content");
  if (postLabelsFile) {
   if (postLabelsFile.status !== "parsed") {
    await withFileTracking(admin, postLabelsFile, async () => {
      const parsed = parsePostLabelsFile(await downloadJson(admin, postLabelsFile.storage_path));
      const rows = parsed.map((p) => ({
        media_key: p.mediaKey,
        caption: p.caption,
        is_ai_generated: p.isAiGenerated,
        is_ad: p.isAd,
        is_branded_content: p.isBrandedContent,
        is_published: p.isPublished,
        story_type: p.storyType,
        publish_mode: p.publishMode,
        hashtags: p.hashtags,
        location: p.location,
        brand_partner: p.brandPartner,
        extra_labels: p.extraLabels,
      }));
      for (const batch of chunk(rows, 500)) {
        const { error } = await admin.rpc("upsert_post_labels_batch", {
          p_account_id: accountId,
          p_rows: batch,
        });
        if (error) throw new Error(`content (labels, lot) : ${error.message}`);
      }
      return rows.length;
    });
   }
    filesParsed++;
  }

  // ---- your_chat_information.json (§7.4, Lot 5) — agrégat uniquement,
  // cf. en-tête de _shared/parse-chat.ts : fbid n'a aucune correspondance
  // avec un pseudo Instagram, jamais de jointure vers ecosystem_profiles.
  const chatFile = findFile("your_chat_information.json", "chat");
  if (chatFile) {
   if (chatFile.status !== "parsed") {
    await withFileTracking(admin, chatFile, async () => {
      const chatJson = await downloadJson(admin, chatFile.storage_path);
      const parsed = parseChatFile(chatJson);
      for (const batch of chunk(parsed, 2000)) {
        const { error } = await admin.from("chat_conversations").upsert(
          batch.map((c) => ({
            account_id: accountId,
            fbid: c.fbid,
            is_brand: c.isBrand,
            is_creator: c.isCreator,
            is_subscriber: c.isSubscriber,
            is_follower: c.isFollower,
            is_verified: c.isVerified,
            got_reply: c.gotReply,
            last_import_id: importId,
            updated_at: new Date().toISOString(),
          })),
          { onConflict: "account_id,fbid" },
        );
        if (error) throw new Error(`chat_conversations : ${error.message}`);
      }
      return parsed.length;
    });
   }
    filesParsed++;
  }

  // recompute_account (§4.10) ne considère que les imports au statut
  // 'completed' : celui-ci doit donc l'atteindre AVANT le recalcul, sans
  // quoi ses propres observations seraient ignorées.
  await admin
    .from("imports")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      files_parsed: filesParsed,
      parser_version: PARSER_VERSION,
    })
    .eq("id", importId);

  const { error: recomputeError } = await admin.rpc("recompute_account", { p_account_id: accountId });
  if (recomputeError) throw new Error(`Recalcul (§4.10) : ${recomputeError.message}`);

  // Compté en base plutôt qu'avec allFollowers/allFollowing.length : sur
  // une reprise où les fichiers followers_*.json étaient déjà 'parsed' et
  // donc sautés (cf. plus haut), ces tableaux en mémoire sont vides pour
  // CETTE invocation alors que les lignes existent bien, depuis la
  // précédente — le compte rendu à l'écran doit refléter l'état réel, pas
  // seulement ce que cette invocation a traité.
  const [{ count: followersCount }, { count: followingCount }] = await Promise.all([
    admin.from("follower_observations").select("*", { count: "exact", head: true }).eq("import_id", importId),
    admin.from("following_observations").select("*", { count: "exact", head: true }).eq("import_id", importId),
  ]);

  return {
    followers: followersCount ?? 0,
    following: followingCount ?? 0,
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

  // Rejeté seulement pour 'uploading' (upload navigateur pas encore
  // terminé, rien à traiter). Tout le reste peut être (re)traité en
  // sécurité, chaque phase de processImport sautant ce qui est déjà
  // 'parsed' : 'uploaded' (premier passage), 'parsing' (reprise après une
  // invocation tuée en cours de route — cf. en-tête de processImport),
  // 'completed'/'failed' (nouvel appel après correction de fichiers en
  // échec, cf. retryFailedImportFiles côté navigateur).
  if (importRow.status === "uploading") {
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
