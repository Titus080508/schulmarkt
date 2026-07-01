-- ============================================================
-- LFS Markt: Owner-Benachrichtigung bei Post-Burst
-- - Warnt den Owner, wenn ein Nutzer innerhalb von 10 Minuten
--   mehr als 10 Inserate erstellt (einfacher Spam-/Missbrauchs-Indikator).
-- Einmalig im Supabase Dashboard -> SQL Editor ausführen.
-- ============================================================

create or replace function notify_owner_on_post_burst() returns trigger as $$
declare
  recent_count integer;
  owner_id uuid;
  seller_name text;
begin
  select count(*) into recent_count from posts
    where seller_id = new.seller_id
      and id <> new.id
      and deleted_at is null
      and created_at > now() - interval '10 minutes';

  -- feuert genau einmal pro "Burst": beim 11. Post innerhalb von 10 Minuten
  if recent_count = 10 then
    select coalesce(display_name, username) into seller_name from profiles where id = new.seller_id;
    select id into owner_id from profiles where role = 'owner' limit 1;

    if owner_id is not null then
      insert into notifications (user_id, type, message, link, read)
      values (
        owner_id,
        'warning',
        'Nutzer ' || coalesce(seller_name, 'Unbekannt') || ' hat innerhalb von 10 Minuten mehr als 10 Inserate erstellt.',
        '/admin',
        false
      );
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_owner_on_post_burst on posts;
create trigger trg_notify_owner_on_post_burst
  after insert on posts
  for each row execute function notify_owner_on_post_burst();

-- ============================================================
-- Fertig. Der Owner erhält ab sofort eine Warn-Benachrichtigung,
-- sobald ein Nutzer mehr als 10 Inserate in 10 Minuten anlegt.
-- ============================================================
