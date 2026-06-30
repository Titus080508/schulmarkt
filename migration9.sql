-- ============================================================
-- LFS Markt: Preisanfrage Erweiterung
-- - offer_expires_at: Angebote laufen nach 24h automatisch ab
-- Einmalig im Supabase Dashboard -> SQL Editor ausführen.
-- ============================================================

alter table messages add column if not exists offer_expires_at timestamptz;
