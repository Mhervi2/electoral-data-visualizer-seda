-- Crear municipios virtuales CERA para cada provincia
-- Usando idc = '999' para identificar estos municipios virtuales

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
  '999' as idc
FROM unique_provinces
WHERE NOT EXISTS (
  SELECT 1 FROM mpca 
  WHERE mpca.provincia = unique_provinces.provincia 
  AND mpca.municipio = 'CERA ' || unique_provinces.provincia
)
ORDER BY provincia;