-- Imports incrémentaux (§4.10) : un post publié est immuable. Les RPC
-- upsert_post_content_batch et upsert_activity_content_batch faisaient
-- ON CONFLICT (account_id, media_key) DO UPDATE SET caption=excluded...
-- sur la table content — donc réécrivaient caption/permalink/thumb_path
-- d'un post déjà connu à chaque réimport (~95% des posts identiques
-- d'un mois sur l'autre). Si le lot importé cette fois-ci porte une
-- caption vide (ex. troncature amont), cela écrase silencieusement une
-- caption déjà correcte en base.
--
-- Seuls les posts au media_key inconnu doivent être insérés ; les
-- posts déjà connus ne changent jamais par cette voie — le complément
-- de légende (posts_N.json, coalesce(caption, ...)) et les labels
-- (upsert_post_labels_batch, déjà un UPDATE pur) restent les seuls
-- chemins de mise à jour légitimes, tous deux déjà "ne jamais écraser
-- une valeur existante".
--
-- content_metrics n'est pas touché ici : PRIMARY KEY (content_id,
-- import_id) garantit déjà une ligne neuve par import réel (import_id
-- change à chaque fois) ; son ON CONFLICT DO UPDATE ne sert qu'à la
-- reprise idempotente d'un import interrompu sur le MÊME import_id.
create or replace function public.upsert_post_content_batch(p_account_id uuid, p_import_id uuid, p_rows jsonb)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
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
  on conflict (account_id, media_key) do nothing;

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
$function$;

create or replace function public.upsert_activity_content_batch(p_account_id uuid, p_import_id uuid, p_media_type text, p_rows jsonb)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
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
  on conflict (account_id, media_key) do nothing;
end;
$function$;
