-- ===== Migration Départs exacts (feuilles de marche SOTRACO) =====
create table if not exists departs (
  id bigint generated always as identity primary key,
  ligne text not null,
  ville text not null default 'Bobo-Dioulasso',
  terminus text not null,
  jours text not null default 'sem',
  heure text not null,
  created_at timestamptz default now()
);
alter table departs enable row level security;
drop policy if exists "lecture publique" on departs;
drop policy if exists "ecriture admin" on departs;
drop policy if exists "maj admin" on departs;
drop policy if exists "suppression admin" on departs;
create policy "lecture publique" on departs for select using (true);
create policy "ecriture admin" on departs for insert with check (exists (select 1 from admins where user_id = auth.uid()));
create policy "maj admin" on departs for update using (exists (select 1 from admins where user_id = auth.uid())) with check (exists (select 1 from admins where user_id = auth.uid()));
create policy "suppression admin" on departs for delete using (exists (select 1 from admins where user_id = auth.uid()));

-- ===== LIGNE 11 BOBO (feuille de marche officielle, période scolaire) =====
-- Service 341+343 : lundi à samedi
insert into departs (ligne, ville, terminus, jours, heure) values
-- INSSA (Belle Ville) : 05:30 06:10 07:00 07:50 08:40 09:30 10:20 11:10 12:00 12:50
('B11','Bobo-Dioulasso','INSSA (Belle Ville)','sem','05:30'),
('B11','Bobo-Dioulasso','INSSA (Belle Ville)','sem','06:10'),
('B11','Bobo-Dioulasso','INSSA (Belle Ville)','sem','07:00'),
('B11','Bobo-Dioulasso','INSSA (Belle Ville)','sem','07:50'),
('B11','Bobo-Dioulasso','INSSA (Belle Ville)','sem','08:40'),
('B11','Bobo-Dioulasso','INSSA (Belle Ville)','sem','09:30'),
('B11','Bobo-Dioulasso','INSSA (Belle Ville)','sem','10:20'),
('B11','Bobo-Dioulasso','INSSA (Belle Ville)','sem','11:10'),
('B11','Bobo-Dioulasso','INSSA (Belle Ville)','sem','12:00'),
('B11','Bobo-Dioulasso','INSSA (Belle Ville)','sem','12:50'),
-- UCAO : 05:30 06:10 07:00 07:50 08:40 09:30 10:20 11:10 12:00 12:50
('B11','Bobo-Dioulasso','UCAO','sem','05:30'),
('B11','Bobo-Dioulasso','UCAO','sem','06:10'),
('B11','Bobo-Dioulasso','UCAO','sem','07:00'),
('B11','Bobo-Dioulasso','UCAO','sem','07:50'),
('B11','Bobo-Dioulasso','UCAO','sem','08:40'),
('B11','Bobo-Dioulasso','UCAO','sem','09:30'),
('B11','Bobo-Dioulasso','UCAO','sem','10:20'),
('B11','Bobo-Dioulasso','UCAO','sem','11:10'),
('B11','Bobo-Dioulasso','UCAO','sem','12:00'),
('B11','Bobo-Dioulasso','UCAO','sem','12:50'),
-- Après-midi service 342+344 : INSSA 13:40 14:30 15:10 15:50 16:50 17:50 18:50 19:30
('B11','Bobo-Dioulasso','INSSA (Belle Ville)','sem','13:40'),
('B11','Bobo-Dioulasso','INSSA (Belle Ville)','sem','14:30'),
('B11','Bobo-Dioulasso','INSSA (Belle Ville)','sem','15:10'),
('B11','Bobo-Dioulasso','INSSA (Belle Ville)','sem','15:50'),
('B11','Bobo-Dioulasso','INSSA (Belle Ville)','sem','16:50'),
('B11','Bobo-Dioulasso','INSSA (Belle Ville)','sem','17:50'),
('B11','Bobo-Dioulasso','INSSA (Belle Ville)','sem','18:50'),
('B11','Bobo-Dioulasso','INSSA (Belle Ville)','sem','19:30'),
-- UCAO : 13:40 14:30 15:10 15:50 16:50 17:50 18:50 19:30
('B11','Bobo-Dioulasso','UCAO','sem','13:40'),
('B11','Bobo-Dioulasso','UCAO','sem','14:30'),
('B11','Bobo-Dioulasso','UCAO','sem','15:10'),
('B11','Bobo-Dioulasso','UCAO','sem','15:50'),
('B11','Bobo-Dioulasso','UCAO','sem','16:50'),
('B11','Bobo-Dioulasso','UCAO','sem','17:50'),
('B11','Bobo-Dioulasso','UCAO','sem','18:50'),
('B11','Bobo-Dioulasso','UCAO','sem','19:30'),
-- Dimanche & jours fériés : Marché du 22 : 07:00 09:00 11:00 13:00 15:00 17:00
('B11','Bobo-Dioulasso','Marché du 22','dim','07:00'),
('B11','Bobo-Dioulasso','Marché du 22','dim','09:00'),
('B11','Bobo-Dioulasso','Marché du 22','dim','11:00'),
('B11','Bobo-Dioulasso','Marché du 22','dim','13:00'),
('B11','Bobo-Dioulasso','Marché du 22','dim','15:00'),
('B11','Bobo-Dioulasso','Marché du 22','dim','17:00'),
-- Maison de la culture : 08:00 10:00 12:00 14:00 16:00 18:00
('B11','Bobo-Dioulasso','Maison de la culture','dim','08:00'),
('B11','Bobo-Dioulasso','Maison de la culture','dim','10:00'),
('B11','Bobo-Dioulasso','Maison de la culture','dim','12:00'),
('B11','Bobo-Dioulasso','Maison de la culture','dim','14:00'),
('B11','Bobo-Dioulasso','Maison de la culture','dim','16:00'),
('B11','Bobo-Dioulasso','Maison de la culture','dim','18:00');
