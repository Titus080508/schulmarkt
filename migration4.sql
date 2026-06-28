-- ============================================================
-- LFS Markt: Migration für Melde-Transparenz, Melde-Cooldown
-- und Owner-Announcements
-- Einmalig im Supabase Dashboard -> SQL Editor ausführen.
-- ============================================================

-- 1) Melde-Cooldown: gleicher Reporter darf denselben Post/Nutzer
--    nicht innerhalb von 24h erneut melden ------------------------
create or replace function check_report_cooldown() returns trigger as $$
begin
  if exists (
    select 1 from reports
    where reporter_id = new.reporter_id
      and post_id = new.post_id
      and created_at > now() - interval '24 hours'
  ) then
    raise exception 'Du hast diesen Artikel bereits kürzlich gemeldet. Bitte warte 24 Stunden.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_check_report_cooldown on reports;
create trigger trg_check_report_cooldown
  before insert on reports
  for each row execute function check_report_cooldown();

create or replace function check_user_report_cooldown() returns trigger as $$
begin
  if exists (
    select 1 from user_reports
    where reporter_id = new.reporter_id
      and reported_id = new.reported_id
      and created_at > now() - interval '24 hours'
  ) then
    raise exception 'Du hast diesen Nutzer bereits kürzlich gemeldet. Bitte warte 24 Stunden.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_check_user_report_cooldown on user_reports;
create trigger trg_check_user_report_cooldown
  before insert on user_reports
  for each row execute function check_user_report_cooldown();


-- 2) "Warum gemeldet": Verkäufer bekommt eine Benachrichtigung,
--    wenn sein Post gelöscht wird (mit Grund, falls eine offene
--    Meldung vorliegt) -------------------------------------------
create or replace function notify_seller_on_post_delete() returns trigger as $$
declare
  report_reason text;
begin
  if new.deleted_at is not null and old.deleted_at is null then
    if auth.uid() is distinct from new.seller_id then
      select reason into report_reason from reports
        where post_id = new.id
        order by created_at desc limit 1;

      insert into notifications (user_id, message, link, read)
      values (
        new.seller_id,
        case when report_reason is not null
          then 'Dein Inserat "' || new.title || '" wurde entfernt. Grund: ' || report_reason
          else 'Dein Inserat "' || new.title || '" wurde von einem Admin entfernt.'
        end,
        '/my-posts',
        false
      );
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_seller_on_post_delete on posts;
create trigger trg_notify_seller_on_post_delete
  after update on posts
  for each row execute function notify_seller_on_post_delete();


-- 3) Announcements (Owner-Ankündigungen) -----------------------------
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  active boolean not null default true
);

alter table announcements enable row level security;

create policy "announcements_select_all" on announcements
  for select using (true);

create policy "announcements_owner_all" on announcements
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
  );

create index if not exists idx_announcements_active on announcements(active, created_at desc);

-- ============================================================
-- Fertig.
-- ============================================================
