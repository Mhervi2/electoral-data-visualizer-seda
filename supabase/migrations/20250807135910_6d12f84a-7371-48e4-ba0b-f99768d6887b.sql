-- Limpiar todas las tablas relacionadas con actas electorales
-- Orden: primero las tablas que referencian electoral_acts, luego electoral_acts

-- 1. Limpiar votos por correo
DELETE FROM public.mail_votes;

-- 2. Limpiar votos de partidos
DELETE FROM public.party_votes;

-- 3. Limpiar actas electorales
DELETE FROM public.electoral_acts;

-- 4. Limpiar log de auditoría de actas electorales (opcional, para empezar completamente limpio)
DELETE FROM public.electoral_acts_audit_log;