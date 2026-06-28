-- ============================================================
-- LFS Markt: Migration für Soft-Delete von Posts mit 48h
-- Wiederherstellungsfrist (nur Owner)
-- Einmalig im Supabase Dashboard -> SQL Editor ausführen.
-- ============================================================

-- 1) Soft-Delete Spalte ------------------------------------------------
alter table posts add column if not exists deleted_at timestamptz;
create index if not exists idx_posts_deleted_at on posts(deleted_at);


-- 2) Owner darf jeden Post aktualisieren (nötig für Wiederherstellen) ----
create policy "posts_update_owner" on posts
  for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
  );


-- 3) Audit-Log: Löschen (soft) + Wiederherstellen ------------------------
create or replace function log_post_soft_delete_restore() returns trigger as $$
begin
  if new.deleted_at is distinct from old.deleted_at then
    if new.deleted_at is not null then
      insert into audit_log (actor_id, action, target_type, target_id, details)
      values (auth.uid(), 'post_soft_deleted', 'post', new.id,
        jsonb_build_object('title', new.title, 'seller_id', new.seller_id));
    else
      insert into audit_log (actor_id, action, target_type, target_id, details)
      values (auth.uid(), 'post_restored', 'post', new.id,
        jsonb_build_object('title', new.title, 'seller_id', new.seller_id));
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_log_post_soft_delete_restore on posts;
create trigger trg_log_post_soft_delete_restore
  after update on posts
  for each row execute function log_post_soft_delete_restore();


-- 4) Automatisches endgültiges Löschen nach 48h -----------------------
-- Benötigt die "pg_cron"-Extension. Falls der nächste Befehl fehlschlägt,
-- aktiviere "pg_cron" zuerst im Dashboard unter Database -> Extensions
-- und führe diesen Block danach erneut aus.
create extension if not exists pg_cron;

select cron.schedule(
  'purge-deleted-posts',
  '0 * * * *', -- jede volle Stunde
  $$ delete from posts where deleted_at is not null and deleted_at < now() - interval '48 hours'; $$
);

-- ============================================================
-- Fertig. Gelöschte Posts bleiben 48h erhalten und können vom
-- Owner im Admin-Bereich wiederhergestellt werden. Danach
-- löscht ein stündlicher Cron-Job sie endgültig.
-- ============================================================
