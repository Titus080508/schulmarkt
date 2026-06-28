-- ============================================================
-- LFS Markt: Migration für Favoriten, Blockieren, Nutzer-Meldungen,
-- Preisangebote im Chat
-- Einmalig im Supabase Dashboard -> SQL Editor ausführen.
-- ============================================================

-- 1) Favoriten ---------------------------------------------------
create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

alter table favorites enable row level security;

create policy "favorites_select_own" on favorites
  for select using (auth.uid() = user_id);

create policy "favorites_insert_own" on favorites
  for insert with check (auth.uid() = user_id);

create policy "favorites_delete_own" on favorites
  for delete using (auth.uid() = user_id);

create index if not exists idx_favorites_user on favorites(user_id);
create index if not exists idx_favorites_post on favorites(post_id);


-- 2) Nutzer blockieren --------------------------------------------
create table if not exists blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id)
);

alter table blocks enable row level security;

-- beide Seiten dürfen sehen, ob eine Blockade zwischen ihnen besteht
create policy "blocks_select_involved" on blocks
  for select using (auth.uid() = blocker_id or auth.uid() = blocked_id);

create policy "blocks_insert_own" on blocks
  for insert with check (auth.uid() = blocker_id);

create policy "blocks_delete_own" on blocks
  for delete using (auth.uid() = blocker_id);

create index if not exists idx_blocks_blocker on blocks(blocker_id);
create index if not exists idx_blocks_blocked on blocks(blocked_id);


-- 3) Nutzer melden -------------------------------------------------
create table if not exists user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  reported_id uuid not null references profiles(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  resolved boolean not null default false,
  resolved_at timestamptz
);

alter table user_reports enable row level security;

create policy "user_reports_insert_own" on user_reports
  for insert with check (auth.uid() = reporter_id);

create policy "user_reports_select_admin_or_own" on user_reports
  for select using (
    auth.uid() = reporter_id
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
  );

create policy "user_reports_update_admin" on user_reports
  for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
  );

create index if not exists idx_user_reports_reported on user_reports(reported_id);


-- 4) Preisangebote im Chat ------------------------------------------
alter table messages add column if not exists offer_amount numeric;
alter table messages add column if not exists offer_status text check (offer_status in ('pending', 'accepted', 'declined'));

-- ============================================================
-- Fertig. Danach kann das Frontend Favoriten, Blockieren,
-- Nutzer-Meldungen und Preisangebote nutzen.
-- ============================================================
