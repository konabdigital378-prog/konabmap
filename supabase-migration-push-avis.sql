-- ===== Migration Push ciblé + avis lignes =====
alter table push_subscriptions add column if not exists user_id uuid;
alter table push_subscriptions add column if not exists ville text;

create table if not exists avis (
  ligne text not null,
  user_id uuid not null,
  note integer not null check (note >= 1 and note <= 5),
  created_at timestamptz default now(),
  primary key (ligne, user_id)
);
alter table avis enable row level security;
drop policy if exists "lecture publique" on avis;
drop policy if exists "ecriture connectes" on avis;
create policy "lecture publique" on avis for select using (true);
create policy "ecriture connectes" on avis for insert with check (auth.role() = 'authenticated');
create policy "maj connectes" on avis for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
