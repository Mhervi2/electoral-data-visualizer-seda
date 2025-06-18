
-- Limpiar espacios en blanco de los campos de texto en electoral_acts
UPDATE electoral_acts 
SET 
  district = TRIM(district),
  section = TRIM(section),
  table_letter = TRIM(table_letter)
WHERE 
  district != TRIM(district) OR 
  section != TRIM(section) OR 
  table_letter != TRIM(table_letter);

-- Limpiar espacios en blanco de los campos de texto en mpca
UPDATE mpca 
SET 
  municipio = TRIM(municipio),
  provincia = TRIM(provincia),
  ca = TRIM(ca)
WHERE 
  municipio != TRIM(municipio) OR 
  provincia != TRIM(provincia) OR 
  ca != TRIM(ca);
