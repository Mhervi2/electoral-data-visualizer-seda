-- Eliminar todos los datos de INDRA

-- Primero eliminar los votos de partidos relacionados con actas de INDRA
DELETE FROM party_votes 
WHERE electoral_act_id IN (
  SELECT id FROM electoral_acts WHERE source_type = 'indra'
);

-- Eliminar los votos por correo relacionados con actas de INDRA
DELETE FROM mail_votes 
WHERE electoral_act_id IN (
  SELECT id FROM electoral_acts WHERE source_type = 'indra'
);

-- Finalmente eliminar las actas electorales de INDRA
DELETE FROM electoral_acts WHERE source_type = 'indra';

-- Verificar cuántos registros quedan de cada tipo
SELECT 
  'electoral_acts' as tabla,
  count(*) as total_registros,
  count(CASE WHEN source_type = 'indra' THEN 1 END) as registros_indra
FROM electoral_acts
UNION ALL
SELECT 
  'party_votes' as tabla,
  count(*) as total_registros,
  count(CASE WHEN ea.source_type = 'indra' THEN 1 END) as registros_indra
FROM party_votes pv
LEFT JOIN electoral_acts ea ON pv.electoral_act_id = ea.id
UNION ALL
SELECT 
  'mail_votes' as tabla,
  count(*) as total_registros,
  count(CASE WHEN ea.source_type = 'indra' THEN 1 END) as registros_indra
FROM mail_votes mv
LEFT JOIN electoral_acts ea ON mv.electoral_act_id = ea.id;