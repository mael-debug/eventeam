-- Community Intelligence — Écosystème, Lot 5 : your_chat_information.json.
--
-- Deux limites vérifiées empiriquement contre un export réel (2967
-- discussions), pas supposées : (1) fbid (identifiant Meta interne à la
-- discussion) n'a aucune correspondance avec le pseudo Instagram utilisé
-- par followers_*.json/following.json — impossible de nommer un compte à
-- partir d'une ligne de ce fichier ; (2) aucun des indicateurs exposés par
-- Meta ne porte de palier d'audience. chat_conversations reste donc une
-- table à la maille "discussion", jamais reliée à ecosystem_profiles ni à
-- follower_states — le seul écran honnête qu'elle permet est un agrégat
-- (v_ecosystem_chat_summary), jamais une liste de comptes nommés.
create table public.chat_conversations (
  account_id    uuid not null references public.instagram_accounts(id) on delete cascade,
  fbid          text not null,
  is_brand      boolean not null default false,
  is_creator    boolean not null default false,
  is_subscriber boolean not null default false,
  is_follower   boolean not null default false,
  is_verified   boolean not null default false,
  got_reply     boolean not null default false,
  last_import_id uuid not null references public.imports(id),
  updated_at    timestamptz not null default now(),
  primary key (account_id, fbid)
);

alter table public.chat_conversations enable row level security;

create policy "chat_conversations_read" on public.chat_conversations
  for select using (account_id in (select public.user_account_ids()));

create view public.v_ecosystem_chat_summary as
select
  account_id,
  count(*) as n,
  count(*) filter (where is_brand) as n_brand,
  count(*) filter (where is_creator) as n_creator,
  count(*) filter (where is_subscriber) as n_subscriber,
  count(*) filter (where is_follower) as n_follower,
  count(*) filter (where is_verified) as n_verified,
  count(*) filter (where got_reply) as n_got_reply
from public.chat_conversations
group by account_id;

alter view public.v_ecosystem_chat_summary set (security_invoker = true);

grant select on public.v_ecosystem_chat_summary to authenticated;
