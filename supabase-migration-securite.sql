-- ===== Migration Sécurité (emails privés, anti-spam) =====
-- 1. Profils : lecture réservée aux connectés (les emails ne sont plus publics)
drop policy if exists "lecture publique" on profils;
drop policy if exists "public all" on profils;
create policy "lecture connectes" on profils for select using (auth.role() = 'authenticated');

-- 2. Notifications : seul l'admin peut en créer (le serveur utilise service_role, non concerné)
drop policy if exists "public all" on notifications;
create policy "lecture publique" on notifications for select using (true);
create policy "creation admin" on notifications for insert with check (exists (select 1 from admins where user_id = auth.uid()));

-- 3. Positions bus : lecture publique, écriture connectés
drop policy if exists "public all" on bus_positions;
create policy "lecture publique" on bus_positions for select using (true);
create policy "ecriture connectes" on bus_positions for insert with check (auth.role() = 'authenticated');
create policy "maj connectes" on bus_positions for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "suppression connectes" on bus_positions for delete using (auth.role() = 'authenticated');
