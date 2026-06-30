-- Einmalig im Supabase Dashboard -> SQL Editor ausführen,
-- um alte Test-Meldungen zu löschen (z.B. wenn der 24h-Cooldown
-- beim Testen im Weg ist). Löscht ALLE Reports, auch erledigte.

delete from message_reports;
delete from user_reports;
delete from reports;
