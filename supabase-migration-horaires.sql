-- ===== Migration Horaires des lignes (gérés par l'admin) =====
create table if not exists horaires (
  ligne text primary key,
  ville text not null default 'Ouagadougou',
  premier text not null default '06:00',
  dernier text not null default '20:00',
  frequence_min integer not null default 20,
  actif boolean default true,
  updated_at timestamptz default now()
);
alter table horaires enable row level security;
drop policy if exists "lecture publique" on horaires;
drop policy if exists "ecriture admin" on horaires;
drop policy if exists "maj admin" on horaires;
drop policy if exists "suppression admin" on horaires;
create policy "lecture publique" on horaires for select using (true);
create policy "ecriture admin" on horaires for insert with check (exists (select 1 from admins where user_id = auth.uid()));
create policy "maj admin" on horaires for update using (exists (select 1 from admins where user_id = auth.uid())) with check (exists (select 1 from admins where user_id = auth.uid()));
create policy "suppression admin" on horaires for delete using (exists (select 1 from admins where user_id = auth.uid()));
