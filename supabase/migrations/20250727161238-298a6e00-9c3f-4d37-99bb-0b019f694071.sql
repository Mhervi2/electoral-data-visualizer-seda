-- Limpieza usando TRUNCATE para evitar triggers
-- TRUNCATE no dispara triggers y es más eficiente

-- Limpiar todas las tablas de datos de prueba en una sola operación
TRUNCATE TABLE 
    public.mail_votes,
    public.party_votes,
    public.electoral_acts_audit_log,
    public.electoral_acts,
    public.elections,
    public.political_parties
RESTART IDENTITY CASCADE;