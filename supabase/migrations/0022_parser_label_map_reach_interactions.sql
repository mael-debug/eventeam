-- Community Intelligence — §14 : parser_label_map pour reach_insights et
-- content_interactions, remplacées par les vraies clés (les patterns
-- précédents, seedés verified=false en 0020, reprenaient l'ancienne
-- implémentation jamais vérifiée — ils sont maintenant faux dans le détail :
-- l'ancien parseur confondait la clé du compteur et celle de sa variation).

delete from public.parser_label_map where file_kind in ('reach_insights', 'content_interactions');

insert into public.parser_label_map (file_kind, field_name, label_pattern, match_type, is_required, verified) values
  ('reach_insights', 'period',                  'periode',                              'prefix', false, true),
  ('reach_insights', 'accounts_reached',        'comptes touches',                      'exact',  true,  true),
  ('reach_insights', 'reach_delta_pct',         'nombre de comptes touches',            'prefix', true,  true),
  ('reach_insights', 'follower_reach_pct',      'followers',                            'exact',  true,  true),
  ('reach_insights', 'non_follower_reach_pct',  'non-followers',                        'exact',  true,  true),
  ('reach_insights', 'impressions',             'impressions',                          'exact',  true,  true),
  ('reach_insights', 'impressions_delta_pct',   'nombre dimpressions',                  'prefix', true,  true),
  ('reach_insights', 'profile_visits',          'visites du profil',                    'exact',  true,  true),
  ('reach_insights', 'profile_visits_delta_pct','nombre de visites sur le profil',      'prefix', true,  true),
  ('reach_insights', 'external_taps',           'appuis sur les liens externes',        'exact',  true,  true),
  ('reach_insights', 'external_taps_delta_pct', 'nombre dappuis',                       'prefix', true,  true),

  ('content_interactions', 'interactions_all',           'interactions avec le contenu',                  'exact', true,  true),
  ('content_interactions', 'interactions_all_delta',     'nombre dinteractions avec le contenu',          'exact', true,  true),
  ('content_interactions', 'accounts_interacted',        'comptes ayant interagi',                        'exact', true,  true),
  ('content_interactions', 'accounts_interacted_delta',  'nombre de comptes ayant interagi',               'exact', true,  true),
  ('content_interactions', 'accounts_interacted_split',  'comptes ayant interagi par type de followers',   'exact', true,  true),
  ('content_interactions', 'interactions_posts',         'interactions avec les publications',            'exact', true,  true),
  ('content_interactions', 'interactions_posts_delta',   'nombre dinteractions avec les publications',    'exact', true,  true),
  ('content_interactions', 'likes_posts',                'mentions jaime des publications',               'exact', true,  true),
  ('content_interactions', 'comments_posts',             'commentaires sur les publications',             'exact', true,  true),
  ('content_interactions', 'shares_posts',               'partages de publications',                      'exact', true,  true),
  ('content_interactions', 'saves_posts',                'enregistrements de publications',                'exact', true,  true),
  ('content_interactions', 'interactions_stories',       'interactions avec la story',                    'exact', true,  true),
  ('content_interactions', 'interactions_stories_delta', 'nombre dinteractions avec la story',            'exact', true,  true),
  ('content_interactions', 'replies_stories',            'reponses aux stories',                          'exact', true,  true),
  ('content_interactions', 'shares_stories',             'partages de stories',                           'exact', true,  true),
  ('content_interactions', 'interactions_videos',        'interactions avec les videos',                  'exact', true,  true),
  ('content_interactions', 'interactions_videos_delta',  'nombre dinteractions avec les videos',          'exact', true,  true),
  ('content_interactions', 'interactions_reels',         'interactions avec les reels',                   'exact', true,  true),
  ('content_interactions', 'interactions_reels_delta',   'nombre dinteractions avec les reels',           'exact', true,  true),
  ('content_interactions', 'likes_reels',                'mentions jaime sur les reels',                  'exact', true,  true),
  ('content_interactions', 'comments_reels',             'commentaires sur les reels',                    'exact', true,  true),
  ('content_interactions', 'shares_reels',               'partages des reels',                            'exact', true,  true),
  ('content_interactions', 'saves_reels',                'enregistrements de reels',                       'exact', true,  true),
  ('content_interactions', 'interactions_lives',         'interactions avec les videos en direct',        'exact', true,  true),
  ('content_interactions', 'interactions_lives_delta',   'nombre dinteractions avec les videos en direct','exact', true,  true);
