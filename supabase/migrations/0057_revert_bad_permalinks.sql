-- Annule 0056 : le lien reconstruit ("https://www.instagram.com/p/" ||
-- shortcode) était faux — vérifié en production par l'utilisateur, ex.
-- .../p/_k2550sfa/ ne correspond à aucune publication réelle. Rien ne
-- garantit que le media_key extrait du nom de fichier de l'export (premier
-- nombre à 6+ chiffres, cf. extractMediaKey) soit le vrai media PK
-- Instagram attendu par l'encodage shortcode. parse-posts.ts ne tente plus
-- cette reconstruction (permalink: null, définitif) ; ce backfill retire
-- les 314 liens déjà écrits en base par l'essai précédent — mieux vaut
-- aucun lien qu'un lien faux.
update public.content
set permalink = null
where permalink is not null;
