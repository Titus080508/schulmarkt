-- ============================================================
-- LFS Markt: Fix - notify_seller_on_post_delete() hat die
-- Pflichtspalte "type" der notifications-Tabelle nicht gesetzt.
-- ============================================================

create or replace function notify_seller_on_post_delete() returns trigger as $$
declare
  report_reason text;
begin
  if new.deleted_at is not null and old.deleted_at is null then
    if auth.uid() is distinct from new.seller_id then
      select reason into report_reason from reports
        where post_id = new.id
        order by created_at desc limit 1;

      insert into notifications (user_id, type, message, link, read)
      values (
        new.seller_id,
        'post_deleted',
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
