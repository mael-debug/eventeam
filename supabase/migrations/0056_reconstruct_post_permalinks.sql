-- Suite de 0055 : les 314 permalinks mis à null (chemins d'export locaux,
-- jamais des URLs) sont reconstruits ici à partir du media_key numérique
-- réel, via l'encodage shortcode Instagram (base64, alphabet propre à
-- Instagram, chiffres de poids fort en premier) — même algorithme que
-- mediaKeyToShortcode ajouté côté Edge Function (_shared/parsing.ts) pour
-- les imports à venir. Fonction locale, supprimée en fin de migration :
-- ce n'est qu'un backfill ponctuel, pas un utilitaire à garder en base.
--
-- Limité à media_type = 'post' et media_key purement numérique : c'est le
-- seul cas où content.permalink a jamais été renseigné (upsert_activity_
-- content_batch, pour reels/stories, pose toujours permalink = null),
-- et le repli `ts-<timestamp>` (0 média sans vignette dans string_map_data)
-- n'encode aucun identifiant Instagram réel — exclu par le filtre ~ '^\d+$'.
create or replace function pg_temp.media_key_to_shortcode(media_key text)
returns text
language plpgsql
immutable
as $$
declare
  alphabet text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  id bigint;
  shortcode text := '';
begin
  if media_key !~ '^\d+$' then
    return null;
  end if;
  id := media_key::bigint;
  if id <= 0 then
    return null;
  end if;
  while id > 0 loop
    shortcode := substr(alphabet, ((id % 64) + 1)::int, 1) || shortcode;
    id := id / 64;
  end loop;
  return shortcode;
end;
$$;

update public.content
set permalink = 'https://www.instagram.com/p/' || pg_temp.media_key_to_shortcode(media_key) || '/'
where permalink is null
  and media_type = 'post'
  and media_key ~ '^\d+$';
