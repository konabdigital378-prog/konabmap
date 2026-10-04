-- ===== KonabMap × Supabase : schéma à exécuter dans l'éditeur SQL =====
-- https://supabase.com/dashboard/project/_/sql

-- 1. Profils étudiants (pseudo + ville + université)
create table if not exists profils (
  pseudo text primary key,
  ville text not null default 'Ouagadougou',
  universite text,
  mon_arret text,
  updated_at timestamptz default now()
);

-- 2. Positions bus collaboratives (1 ligne par étudiant-partageur)
create table if not exists bus_positions (
  pseudo text primary key,
  ville text not null default 'Ouagadougou',
  ligne text not null default 'L1',
  lat double precision not null,
  lng double precision not null,
  vitesse double precision default 0,
  updated_at timestamptz default now()
);
create index if not exists idx_bus_positions_ville on bus_positions (ville);

-- 3. Notifications (historique + futures push serveur)
create table if not exists notifications (
  id bigint generated always as identity primary key,
  titre text,
  message text,
  ville text,
  created_at timestamptz default now()
);

-- 4. Abonnements push Web (pour envois serveur via VAPID / Edge Function)
create table if not exists push_subscriptions (
  endpoint text primary key,
  subscription jsonb,
  pseudo text,
  created_at timestamptz default now()
);

-- 5. Accès public lecture/écriture (MVP étudiant, à durcir ensuite avec Auth)
alter table profils enable row level security;
alter table bus_positions enable row level security;
alter table notifications enable row level security;
alter table push_subscriptions enable row level security;

drop policy if exists "public all" on profils;
drop policy if exists "public all" on bus_positions;
drop policy if exists "public all" on notifications;
drop policy if exists "public all" on push_subscriptions;

create policy "public all" on profils for all using (true) with check (true);
create policy "public all" on bus_positions for all using (true) with check (true);
create policy "public all" on notifications for all using (true) with check (true);
create policy "public all" on push_subscriptions for all using (true) with check (true);

-- 6. Temps réel : activer la réplication sur bus_positions
-- (Dashboard > Database > Replication > activer bus_positions)
