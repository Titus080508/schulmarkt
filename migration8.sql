-- ============================================================
-- LFS Markt: Report-System Ausbau
-- - status (open/resolved/rejected) + admin_note + resolved_by
--   für reports & user_reports statt nur "resolved" boolean
-- - Nachrichten melden (message_reports)
-- Einmalig im Supabase Dashboard -> SQL Editor ausführen.
-- ============================================================

-- 1) reports: status + admin_note + resolved_by -------------------
alter table reports add column if not exists status text not null default 'open'
  check (status in ('open', 'resolved', 'rejected'));
alter table reports add column if not exists admin_note text;
alter table reports add column if not exists resolved_by uuid references profiles(id) on delete set null;

update reports set status = 'resolved' where resolved = true and status = 'open';

-- 2) user_reports: status + admin_note + resolved_by --------------
alter table user_reports add column if not exists status text not null default 'open'
  check (status in ('open', 'resolved', 'rejected'));
alter table user_reports add column if not exists admin_note text;
alter table user_reports add column if not exists resolved_by uuid references profiles(id) on delete set null;

update user_reports set status = 'resolved' where resolved = true and status = 'open';

-- 3) message_reports: Nachrichten melden ---------------------------
create table if not exists message_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  reporter_id uuid not null references profiles(id) on delete cascade,
  reported_id uuid not null references profiles(id) on delete cascade,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'resolved', 'rejected')),
  admin_note text,
  resolved_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved boolean not null default false
);

alter table message_reports enable row level security;

create policy "message_reports_insert_own" on message_reports
  for insert with check (auth.uid() = reporter_id);

create policy "message_reports_select_admin_or_own" on message_reports
  for select using (
    auth.uid() = reporter_id
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
  );

create policy "message_reports_update_admin" on message_reports
  for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
  );

create index if not exists idx_message_reports_reported on message_reports(reported_id);
create index if not exists idx_message_reports_message on message_reports(message_id);

-- Melde-Cooldown: gleicher Reporter darf dieselbe Nachricht nicht
-- innerhalb von 24h erneut melden
create or replace function check_message_report_cooldown() returns trigger as $$
begin
  if exists (
    select 1 from message_reports
    where reporter_id = new.reporter_id
      and message_id = new.message_id
      and created_at > now() - interval '24 hours'
  ) then
    raise exception 'Du hast diese Nachricht bereits kürzlich gemeldet. Bitte warte 24 Stunden.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_check_message_report_cooldown on message_reports;
create trigger trg_check_message_report_cooldown
  before insert on message_reports
  for each row execute function check_message_report_cooldown();

-- Audit-Log Trigger für message_reports (gleiches Muster wie reports/user_reports)
create or replace function log_message_report_resolved() returns trigger as $$
begin
  if new.resolved = true and old.resolved = false then
    insert into audit_log (actor_id, action, target_type, target_id, details)
    values (auth.uid(), 'message_report_resolved', 'message_report', new.id,
      jsonb_build_object('reported_id', new.reported_id, 'reason', new.reason, 'status', new.status));
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_log_message_report_resolved on message_reports;
create trigger trg_log_message_report_resolved
  after update on message_reports
  for each row execute function log_message_report_resolved();

-- 4) admin_note auch im Audit-Log für reports/user_reports mitschreiben --
create or replace function log_report_resolved() returns trigger as $$
begin
  if new.resolved = true and old.resolved = false then
    insert into audit_log (actor_id, action, target_type, target_id, details)
    values (auth.uid(), 'report_resolved', 'report', new.id,
      jsonb_build_object('post_id', new.post_id, 'reason', new.reason, 'status', new.status, 'admin_note', new.admin_note));
  end if;
  return new;
end;
$$ language plpgsql security definer;

create or replace function log_user_report_resolved() returns trigger as $$
begin
  if new.resolved = true and old.resolved = false then
    insert into audit_log (actor_id, action, target_type, target_id, details)
    values (auth.uid(), 'user_report_resolved', 'user_report', new.id,
      jsonb_build_object('reported_id', new.reported_id, 'reason', new.reason, 'status', new.status, 'admin_note', new.admin_note));
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- ============================================================
-- Fertig.
-- ============================================================
