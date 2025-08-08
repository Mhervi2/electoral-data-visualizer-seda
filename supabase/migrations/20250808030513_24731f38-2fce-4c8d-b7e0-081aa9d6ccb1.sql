-- Limpiar tabla electoral_acts y sus datos relacionados
-- Primero eliminar datos de tablas que referencian electoral_acts

-- Eliminar logs de auditoría de actas electorales
DELETE FROM electoral_acts_audit_log;

-- Eliminar votos por correo
DELETE FROM mail_votes;

-- Eliminar votos de partidos
DELETE FROM party_votes;

-- Finalmente eliminar las actas electorales
DELETE FROM electoral_acts;

-- Reiniciar secuencias de versión si es necesario
-- (No hay secuencias específicas que reiniciar en este caso)