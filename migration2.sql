-- ============================================================
-- LFS Markt: Migration für mehrstufige Admin-Rollen, Audit-Log,
-- Nutzersperrung, Blockierten-Übersicht
-- Einmalig im Supabase Dashboard -> SQL Editor ausführen.
-- ============================================================

-- 1) Rollen + Sperrung auf profiles -------------------------------
alter table profiles add column if not exists role text not null default 'user'
  check (role in ('user', 'moderator', 'owner'));

alter table profiles add column if not exists suspended boolean not null default false;
alter table profiles add column if not exists suspended_at timestamptz;
alter table profiles add column if not exists suspended_reason text;

-- Bestehende Admins werden zu Moderatoren (dürfen weiterhin alles wie bisher)
update profiles set role = 'moderator' where is_admin = true and role = 'user';

-- Titus bekommt die Owner-Rolle (verwaltet Admins, sieht alle Nachrichten + Audit-Log)
update profiles set role = 'owner', is_admin = true where username = 'titus.kullmann';


-- 2) Audit-Log -------------------------------------------------------
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table audit_log enable row level security;

create policy "audit_log_select_owner" on audit_log
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
  );

create index if not exists idx_audit_log_created on audit_log(created_at desc);


-- 3) Schutz vor Rechte-Eskalation -------------------------------------
-- Nur Owner darf role / is_admin / suspended ändern (gilt für JEDEN
-- Update-Pfad, auch falls eine RLS-Policy das Update sonst erlauben würde)
create or replace function prevent_role_escalation() returns trigger as $$
begin
  if (new.role is distinct from old.role)
     or (new.is_admin is distinct from old.is_admin)
     or (new.suspended is distinct from old.suspended) then
    if not exists (select 1 from profiles where id = auth.uid() and role = 'owner') then
      raise exception 'Nur der Owner darf Rolle oder Sperrstatus ändern';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_prevent_role_escalation on profiles;
create trigger trg_prevent_role_escalation
  before update on profiles
  for each row execute function prevent_role_escalation();

-- Owner darf jedes Profil aktualisieren (z.B. um Rollen zu vergeben oder zu sperren)
create policy "profiles_update_owner" on profiles
  for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
  );


-- 4) Audit-Log Trigger: Profilnamensänderungen + Rollen/Sperr-Änderungen ----
create or replace function log_profile_changes() returns trigger as $$
begin
  if new.display_name is distinct from old.display_name then
    insert into audit_log (actor_id, action, target_type, target_id, details)
    values (auth.uid(), 'display_name_changed', 'profile', new.id,
      jsonb_build_object('old', old.display_name, 'new', new.display_name));
  end if;

  if new.role is distinct from old.role then
    insert into audit_log (actor_id, action, target_type, target_id, details)
    values (auth.uid(), 'role_changed', 'profile', new.id,
      jsonb_build_object('old', old.role, 'new', new.role, 'username', new.username));
  end if;

  if new.suspended is distinct from old.suspended then
    insert into audit_log (actor_id, action, target_type, target_id, details)
    values (auth.uid(), case when new.suspended then 'user_suspended' else 'user_unsuspended' end,
      'profile', new.id,
      jsonb_build_object('username', new.username, 'reason', new.suspended_reason));
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_log_profile_changes on profiles;
create trigger trg_log_profile_changes
  after update on profiles
  for each row execute function log_profile_changes();


-- 5) Audit-Log Trigger: Admin-Aktionen (Posts löschen, Meldungen erledigen) ----
create or replace function log_post_delete() returns trigger as $$
begin
  insert into audit_log (actor_id, action, target_type, target_id, details)
  values (auth.uid(), 'post_deleted', 'post', old.id,
    jsonb_build_object('title', old.title, 'seller_id', old.seller_id));
  return old;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_log_post_delete on posts;
create trigger trg_log_post_delete
  before delete on posts
  for each row execute function log_post_delete();

create or replace function log_report_resolved() returns trigger as $$
begin
  if new.resolved = true and old.resolved = false then
    insert into audit_log (actor_id, action, target_type, target_id, details)
    values (auth.uid(), 'report_resolved', 'report', new.id,
      jsonb_build_object('post_id', new.post_id, 'reason', new.reason));
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_log_report_resolved on reports;
create trigger trg_log_report_resolved
  after update on reports
  for each row execute function log_report_resolved();

create or replace function log_user_report_resolved() returns trigger as $$
begin
  if new.resolved = true and old.resolved = false then
    insert into audit_log (actor_id, action, target_type, target_id, details)
    values (auth.uid(), 'user_report_resolved', 'user_report', new.id,
      jsonb_build_object('reported_id', new.reported_id, 'reason', new.reason));
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_log_user_report_resolved on user_reports;
create trigger trg_log_user_report_resolved
  after update on user_reports
  for each row execute function log_user_report_resolved();


-- 6) Owner sieht alle Nachrichten ------------------------------------
create policy "messages_select_owner" on messages
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
  );


-- 7) Admins sehen alle Blockierungen ------------------------------------
create policy "blocks_select_admin" on blocks
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- ============================================================
-- Fertig. Danach: bestehende Admins sind jetzt "Moderator",
-- Titus ist "Owner". Frontend-Features baue ich im Anschluss.
-- ============================================================
