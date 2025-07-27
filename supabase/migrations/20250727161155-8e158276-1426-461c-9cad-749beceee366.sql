-- Limpieza de datos de prueba
-- Orden: respetando dependencias foreign key

-- 1. Limpiar mail_votes (depende de electoral_acts)
DELETE FROM public.mail_votes;

-- 2. Limpiar party_votes (depende de electoral_acts)
DELETE FROM public.party_votes;

-- 3. Limpiar electoral_acts_audit_log (depende de electoral_acts)
DELETE FROM public.electoral_acts_audit_log;

-- 4. Limpiar electoral_acts (tabla principal)
DELETE FROM public.electoral_acts;

-- 5. Limpiar elections
DELETE FROM public.elections;

-- 6. Limpiar political_parties
DELETE FROM public.political_parties;