-- ===== Migration Auth + Admin (à exécuter dans l'éditeur SQL Supabase) =====

-- 1. Profils liés au compte Auth
alter table profils add column if not exists user_id uuid unique;
alter table profils add column if not exists email text;

-- 2. Table admins (écriture réservée service_role : aucune policy d'écriture)
create table if not exists admins (
  user_id uuid primary key,
  created_at timestamptz default now()
);
alter table admins enable row level security;
drop policy if exists "lecture authentifiee" on admins;
create policy "lecture authentifiee" on admins for select using (auth.role() = 'authenticated');

-- 3. Profils : lecture publique, écriture réservée aux connectés
alter table profils enable row level security;
drop policy if exists "public all" on profils;
drop policy if exists "lecture publique" on profils;
drop policy if exists "ecriture connectes" on profils;
create policy "lecture publique" on profils for select using (true);
create policy "ecriture connectes" on profils for insert with check (auth.role() = 'authenticated');
create policy "maj connectes" on profils for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "suppression connectes" on profils for delete using (auth.role() = 'authenticated');

-- 4. Temps réel sur notifications (bannières broadcast) + bus_positions
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table bus_positions;
