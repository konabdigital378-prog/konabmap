-- Migration : niveau d'affluence des bus (places / debout / plein)
alter table bus_positions add column if not exists affluence text default 'places';
