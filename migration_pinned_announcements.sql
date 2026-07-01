-- Einmalig im Supabase SQL-Editor ausführen.
-- Fügt eine "pinned"-Spalte hinzu: gepinnte Ankündigungen können von
-- Nutzern nicht mehr weggeklickt/dauerhaft ausgeblendet werden.

alter table announcements add column if not exists pinned boolean not null default false;
