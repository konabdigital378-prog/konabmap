-- ===== Migration Chauffeurs vérifiés =====
alter table profils add column if not exists demande_chauffeur boolean default false;
alter table profils add column if not exists chauffeur_verifie boolean default false;
