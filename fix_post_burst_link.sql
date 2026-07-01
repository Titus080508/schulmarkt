-- Einmalig im Supabase SQL-Editor ausführen, nach migration10.sql:
-- Korrigiert bereits vorhandene Benachrichtigungen, die noch auf die
-- nicht existierende Seite /admin/users verlinken.

update notifications
set link = '/admin'
where type = 'warning' and link = '/admin/users';
