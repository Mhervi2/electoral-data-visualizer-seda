
-- Paso 1: Agregar la nueva columna mesa_identifier
ALTER TABLE electoral_acts 
ADD COLUMN mesa_identifier TEXT;

-- Paso 2: Migrar datos existentes combinando district-section-table_letter
UPDATE electoral_acts 
SET mesa_identifier = TRIM(district) || '-' || TRIM(section) || '-' || TRIM(table_letter)
WHERE mesa_identifier IS NULL;

-- Paso 3: Hacer la columna NOT NULL después de migrar los datos
ALTER TABLE electoral_acts 
ALTER COLUMN mesa_identifier SET NOT NULL;

-- Paso 4: Eliminar las columnas antiguas usando CASCADE para eliminar dependencias
ALTER TABLE electoral_acts 
DROP COLUMN district CASCADE,
DROP COLUMN section CASCADE,
DROP COLUMN table_letter CASCADE;

-- Paso 5: Recrear la vista electoral_acts_with_municipalities con el nuevo campo
CREATE VIEW electoral_acts_with_municipalities AS
SELECT 
  ea.*,
  m.municipio,
  m.provincia,
  m.ca as comunidad_autonoma
FROM electoral_acts ea
LEFT JOIN mpca m ON ea.municipality_idm = m.idm;

-- Paso 6: Agregar índice para mejor rendimiento en consultas
CREATE INDEX idx_electoral_acts_mesa_identifier ON electoral_acts(mesa_identifier);
CREATE INDEX idx_electoral_acts_election_municipality_mesa ON electoral_acts(election_id, municipality_idm, mesa_identifier);
