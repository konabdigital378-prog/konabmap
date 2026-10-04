-- ===== Migration Abonnement obligatoire + notifications perso/collectives =====

-- 1. Date d'inscription (flux "nouveaux inscrits" admin)
alter table profils add column if not exists created_at timestamptz default now();

-- 2. Notifications personnelles (user_id) ou collectives (ville / tous si null)
alter table notifications add column if not exists user_id uuid;
alter table notifications add column if not exists ville text;

-- 3. Temps réel : nouveaux inscrits + nouveaux paiements pour l'admin
alter publication supabase_realtime add table profils;
alter publication supabase_realtime add table orders;
