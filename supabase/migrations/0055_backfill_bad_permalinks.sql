-- Les redirections "Voir sur Instagram" ne fonctionnaient pas : content.permalink
-- a toujours été rempli, pour les posts, avec media.uri du fichier posts.json —
-- un chemin d'export local ("media/posts/xxxx.jpg"), jamais une vraie URL
-- Instagram (confirmé : 314/314 lignes non nulles ne commencent pas par
-- "http"). parse-posts.ts vient d'être corrigé pour ne plus jamais écrire
-- cette valeur (permalink: null, même traitement que thumbPath en 0052) —
-- mais content étant désormais immuable au réimport (0054, DO NOTHING sur
-- media_key déjà connu), les 314 lignes déjà en base resteraient fausses
-- indéfiniment sans ce backfill ponctuel.
update public.content
set permalink = null
where permalink is not null
  and permalink not like 'http%';
