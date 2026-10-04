-- ===== Migration Abonnement Premium 100 FCFA =====

-- 1. Premium sur profils
alter table profils add column if not exists is_premium boolean default false;
alter table profils add column if not exists premium_until timestamptz;

-- 2. Commandes de paiement (Orange Money manuel + preuve OCR)
create table if not exists orders (
  id bigint generated always as identity primary key,
  ref text unique not null,
  user_id uuid,
  pseudo text,
  amount_fcfa integer not null default 100,
  jours integer not null default 30,
  status text not null default 'pending',
  ocr_text text,
  ocr_confidence integer default 0,
  created_at timestamptz default now(),
  validated_at timestamptz
);
alter table orders enable row level security;
drop policy if exists "lecture authentifiee" on orders;
drop policy if exists "creation authentifiee" on orders;
create policy "lecture authentifiee" on orders for select using (auth.role() = 'authenticated');
create policy "creation authentifiee" on orders for insert with check (auth.role() = 'authenticated');
create policy "maj authentifiee" on orders for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 3. Codes promo / recharge (générés par l'admin, ex: KMAB-XXXXXX)
create table if not exists promo_codes (
  code text primary key,
  jours integer not null default 30,
  used_by uuid,
  used_at timestamptz,
  created_at timestamptz default now()
);
alter table promo_codes enable row level security;
drop policy if exists "lecture authentifiee" on promo_codes;
create policy "lecture authentifiee" on promo_codes for select using (auth.role() = 'authenticated');
