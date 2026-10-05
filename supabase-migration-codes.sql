-- ===== Migration Codes : distinguer émis vs consommé =====
alter table promo_codes add column if not exists consomme_le timestamptz;
