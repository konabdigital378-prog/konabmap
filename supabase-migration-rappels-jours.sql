-- ===== Migration Rappels : jours d'application =====
alter table rappels add column if not exists jours text default 'tous';
