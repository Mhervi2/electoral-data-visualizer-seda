
-- Inserta usuario administrador robusto o ignora si ya existe
insert into auth.users (id, email, encrypted_password) 
select gen_random_uuid(), 'superadmin@seda.es', crypt('AdminFuerte#2024', gen_salt('bf'))
where not exists (select 1 from auth.users where email = 'superadmin@seda.es');

-- Settea perfil de admin en profiles
insert into public.profiles (id, email, is_admin)
select u.id, u.email, true
from auth.users u
where u.email = 'superadmin@seda.es'
on conflict do nothing;

-- Insertar ejemplo en tabla elections
insert into public.elections (name, status) 
values ('Elección de prueba', 'active')
on conflict do nothing;

-- Insertar ejemplo en tabla political_parties
insert into public.political_parties (id, name, siglas, color)
values ('PTEST', 'Partido Demo', 'PD', '#2196F3')
on conflict do nothing;

-- Insertar ejemplo en municipalities
insert into public.municipalities (name)
values ('Municipio Demo')
on conflict do nothing;

-- Insertar ejemplo en provinces
insert into public.provinces (name)
values ('Provincia Demo')
on conflict do nothing;

-- Insertar ejemplo en autonomous_communities
insert into public.autonomous_communities (name)
values ('Comunidad Demo')
on conflict do nothing;

-- Insertar ejemplo en electoral_acts si existen datos requeridos
do $$
declare
  el_id uuid;
  mun_id uuid;
begin
  select id into el_id from public.elections limit 1;
  select id into mun_id from public.municipalities limit 1;
  if el_id is not null and mun_id is not null then
    insert into public.electoral_acts (election_id, municipality_id, census_total, total_voters, blank_votes, null_votes, submitted_by, source_type, table_letter, section, district)
    values (el_id, mun_id, 2000, 1500, 20, 10, null, 'prueba', 'A', '1', '1')
    on conflict do nothing;
  end if;
end $$;

-- Insertar ejemplo en party_votes si existen datos requeridos
do $$
declare
  act_id uuid;
begin
  select id into act_id from public.electoral_acts limit 1;
  if act_id is not null then
    insert into public.party_votes (electoral_act_id, party_id, votes)
    values (act_id, 'PTEST', 999)
    on conflict do nothing;
  end if;
end $$;

-- Insertar ejemplo en party_suggestions
insert into public.party_suggestions (name, siglas, status)
values ('Partido Sugerente', 'PSG', 'pending')
on conflict do nothing;

-- Insertar ejemplo en audit_logs (esto requiere admin activo)
insert into public.audit_logs (action, table_name)
values ('insert_test', 'elections')
on conflict do nothing;
