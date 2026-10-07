-- ===== Migration Rappels de départs personnalisés =====
create table if not exists rappels (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  ville text not null default 'Ouagadougou',
  ligne text not null,
  terminus text not null,
  heure text not null,
  avance_min integer not null default 10,
  actif boolean default true,
  dernier_envoi timestamptz,
  created_at timestamptz default now()
);
alter table rappels enable row level security;
drop policy if exists "perso" on rappels;
create policy "perso" on rappels for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
