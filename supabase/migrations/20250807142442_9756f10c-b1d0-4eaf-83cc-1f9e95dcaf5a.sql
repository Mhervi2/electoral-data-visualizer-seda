-- Crear municipios virtuales CERA para cada provincia
-- Ajustado para usar CER (3 caracteres) en lugar de CERA (4 caracteres)

WITH unique_provinces AS (
  SELECT DISTINCT 
    provincia,
    ca,
    idp,
    idca,
    ROW_NUMBER() OVER (ORDER BY provincia) as rn
  FROM mpca 
  WHERE provincia IS NOT NULL 
    AND provincia != '' 
    AND provincia != 'm'
),
max_idm AS (
  SELECT COALESCE(MAX(idm), 0) as max_id FROM mpca
)
INSERT INTO mpca (idm, municipio, provincia, ca, idp, idca, idc)
SELECT 
  (SELECT max_id FROM max_idm) + rn as idm,
  'CERA ' || provincia as municipio,
  provincia,
  ca,
  idp,
  idca,
  'CER' as idc
FROM unique_provinces
ORDER BY provincia;