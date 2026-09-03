-- Community Intelligence — corrige le crash "CPU Time exceeded" de
-- process-import sur les comptes à volumétrie réelle (ex. Eden Park All :
-- des centaines de posts/reels/stories).
--
-- Cause : upsertActivityContent() et la boucle posts.json faisaient, pour
-- CHAQUE publication, un aller-retour SELECT (existe ?) puis INSERT ou
-- UPDATE — deux requêtes HTTP/Postgres séquentielles par ligne. Sur un
-- compte à plusieurs centaines de posts/reels/stories, cela cumule assez
-- de temps CPU pour dépasser la limite d'exécution de l'Edge Function, qui
-- est alors tuée par la plateforme AVANT d'atteindre son propre try/catch
-- (imports.status reste bloqué à 'parsing', error_message reste null —
-- différent d'un échec normal, qui passerait par le catch et poserait
-- status='failed').
--
-- Fix : un aller-retour unique par lot (INSERT ... ON CONFLICT DO UPDATE),
-- exécuté côté Postgres plutôt qu'en boucle depuis l'Edge Function.

-- Lot de publications à métriques (posts.json, logged_information/past_instagram_insights).
-- first_import_id n'est jamais dans la clause SET : un post réapparaît
-- dans chaque export ultérieur (posts.json liste l'historique, pas
-- seulement les nouveautés) et ce champ ne doit être posé qu'à la toute
-- première apparition, jamais réécrit par un import plus récent.
create or replace function public.upsert_post_content_batch(
  p_account_id uuid,
  p_import_id  uuid,
  p_rows       jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.content (account_id, media_key, permalink, media_type, published_at, caption, thumb_path, first_import_id)
  select
    p_account_id,
    r->>'media_key',
    r->>'permalink',
    'post',
    (r->>'published_at')::timestamptz,
    r->>'caption',
    r->>'thumb_path',
    p_import_id
  from jsonb_array_elements(p_rows) as r
  on conflict (account_id, media_key) do update set
    permalink  = excluded.permalink,
    caption    = excluded.caption,
    thumb_path = excluded.thumb_path;

  insert into public.content_metrics (
    content_id, import_id, account_id, reach, impressions, likes, comments, shares, saves,
    profile_visits, follows_gained, external_taps, follow_conversion_rate, engagement_rate
  )
  select
    c.id, p_import_id, p_account_id,
    (r->>'reach')::bigint,
    (r->>'impressions')::bigint,
    (r->>'likes')::int,
    (r->>'comments')::int,
    (r->>'shares')::int,
    (r->>'saves')::int,
    (r->>'profile_visits')::int,
    (r->>'follows_gained')::int,
    (r->>'external_taps')::int,
    (r->>'follow_conversion_rate')::numeric,
    (r->>'engagement_rate')::numeric
  from jsonb_array_elements(p_rows) as r
  join public.content c on c.account_id = p_account_id and c.media_key = r->>'media_key'
  on conflict (content_id, import_id) do update set
    reach                   = excluded.reach,
    impressions              = excluded.impressions,
    likes                    = excluded.likes,
    comments                 = excluded.comments,
    shares                   = excluded.shares,
    saves                    = excluded.saves,
    profile_visits           = excluded.profile_visits,
    follows_gained           = excluded.follows_gained,
    external_taps            = excluded.external_taps,
    follow_conversion_rate   = excluded.follow_conversion_rate,
    engagement_rate          = excluded.engagement_rate;
end;
$$;

revoke execute on function public.upsert_post_content_batch(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.upsert_post_content_batch(uuid, uuid, jsonb) to service_role;

-- Lot de reels/stories (your_instagram_activity/media/) : jamais de
-- métriques ni de permalink pour ces formats (cf. en-tête de
-- _shared/parse-activity-media.ts), donc rien à faire hors content.
create or replace function public.upsert_activity_content_batch(
  p_account_id uuid,
  p_import_id  uuid,
  p_media_type text,
  p_rows       jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.content (account_id, media_key, permalink, media_type, published_at, caption, thumb_path, first_import_id)
  select
    p_account_id,
    r->>'media_key',
    null,
    p_media_type,
    (r->>'published_at')::timestamptz,
    r->>'caption',
    r->>'thumb_path',
    p_import_id
  from jsonb_array_elements(p_rows) as r
  on conflict (account_id, media_key) do update set
    caption    = excluded.caption,
    thumb_path = excluded.thumb_path;
end;
$$;

revoke execute on function public.upsert_activity_content_batch(uuid, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.upsert_activity_content_batch(uuid, uuid, text, jsonb) to service_role;

-- Ratios réels observés sur un export volumineux (Eden Park All) dépassant
-- numeric(8,6) (borné à ±99.999999) : une publication à portée très faible
-- peut afficher un ratio brut élevé (ex. quelques comptes touchés, un
-- nombre de nouveaux abonnés associé bien plus grand). C'est une donnée
-- Meta telle quelle, pas une erreur de calcul — la colonne doit pouvoir la
-- stocker plutôt que de faire échouer tout l'import dessus.
alter table public.content_metrics
  alter column follow_conversion_rate type numeric,
  alter column engagement_rate type numeric;
