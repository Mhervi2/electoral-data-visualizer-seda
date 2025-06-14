
-- Asegura que el perfil del usuario superadmin@seda.es existe y es administrador
insert into public.profiles (id, email, is_admin)
select id, email, true
from auth.users
where email = 'superadmin@seda.es'
on conflict (id) do update set is_admin = true, email = excluded.email;

-- Opcional: también puedes asegurarte de que el email esté correcto si el id ya existe
update public.profiles
set is_admin = true
where email = 'superadmin@seda.es';
