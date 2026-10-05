-- ===== Migration Preuves images =====
alter table orders add column if not exists image_data text;
