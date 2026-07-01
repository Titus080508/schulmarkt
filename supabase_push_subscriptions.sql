-- Führe dieses SQL einmalig im Supabase SQL-Editor aus, um Web-Push-Benachrichtigungen zu aktivieren.

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

create policy "Nutzer verwalten eigene Push-Subscriptions"
  on push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Damit ein Absender die Subscription des Empfängers lesen kann, um die Push-Benachrichtigung zuzustellen:
create policy "Angemeldete Nutzer duerfen Subscriptions zum Senden lesen"
  on push_subscriptions for select
  using (auth.role() = 'authenticated');
