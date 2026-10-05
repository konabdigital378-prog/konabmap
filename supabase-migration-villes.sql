-- ===== Migration Demandes de villes (extension nationale) =====
create table if not exists ville_demandes (
  id bigint generated always as identity primary key,
  ville text not null,
  user_id uuid,
  pseudo text,
  created_at timestamptz default now()
);
alter table ville_demandes enable row level security;
drop policy if exists "lecture publique" on ville_demandes;
drop policy if exists "creation connectes" on ville_demandes;
create policy "lecture publique" on ville_demandes for select using (true);
create policy "creation connectes" on ville_demandes for insert with check (auth.role() = 'authenticated');
