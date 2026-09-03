-- Community Intelligence — your_instagram_activity/media/posts.json (sans
-- suffixe, label_values) : enrichissement de content, jamais une source de
-- nouvelles publications (cf. en-tête de
-- supabase/functions/_shared/parse-post-labels.ts). Jointure sur
-- content.media_key = fbid, upsert_post_labels_batch fait un UPDATE (jamais
-- un INSERT) par lot plutôt qu'un aller-retour par publication — même motif
-- que la migration 0040 (CPU Time exceeded sur les gros comptes).

alter table public.content
  add column is_ai_generated   boolean,
  add column is_ad             boolean,
  add column is_branded_content boolean,
  add column is_published      boolean,
  add column story_type        text,
  add column publish_mode      text,
  add column hashtags          text[],
  add column location          text,
  add column brand_partner     text,
  -- Libellés observés dans label_values mais non mappés sur une colonne
  -- typée ci-dessus (cf. en-tête du parseur : seuls 5 libellés sur ~11 sont
  -- confirmés contre le JSON brut) — conservés tels quels plutôt que perdus.
  add column extra_labels      jsonb;

create or replace function public.upsert_post_labels_batch(
  p_account_id uuid,
  p_rows       jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.content c set
    caption            = coalesce(c.caption, r->>'caption'),
    is_ai_generated    = (r->>'is_ai_generated')::boolean,
    is_ad              = (r->>'is_ad')::boolean,
    is_branded_content = (r->>'is_branded_content')::boolean,
    is_published       = (r->>'is_published')::boolean,
    story_type         = r->>'story_type',
    publish_mode       = r->>'publish_mode',
    hashtags           = case when jsonb_typeof(r->'hashtags') = 'array'
                            then (select array_agg(x) from jsonb_array_elements_text(r->'hashtags') x)
                            else null end,
    location           = r->>'location',
    brand_partner      = r->>'brand_partner',
    extra_labels       = case when jsonb_typeof(r->'extra_labels') = 'object' then r->'extra_labels' else null end
  from jsonb_array_elements(p_rows) as r
  where c.account_id = p_account_id and c.media_key = r->>'media_key';
end;
$$;

revoke execute on function public.upsert_post_labels_batch(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.upsert_post_labels_batch(uuid, jsonb) to service_role;
