-- ============================================================
-- LFS Markt: Zustimmung zu Nutzungsbedingungen & Datenschutzerklärung
-- Einmalig im Supabase Dashboard -> SQL Editor ausführen.
-- ============================================================

alter table profiles add column if not exists terms_accepted_at timestamptz;
