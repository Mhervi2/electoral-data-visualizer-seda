-- Create optimized views and indexes for geographical data performance

-- First, create a materialized view for fast municipality search
CREATE MATERIALIZED VIEW mpca_search_optimized AS
SELECT DISTINCT
  idm,
  municipio,
  provincia, 
  ca,
  idp,
  idca,
  idc,
  municipio || ' (' || provincia || ')' as display_name,
  to_tsvector('spanish', municipio || ' ' || provincia || ' ' || ca) as search_vector
FROM mpca
ORDER BY ca, provincia, municipio;

-- Create indexes for optimized search
CREATE INDEX idx_mpca_search_vector ON mpca_search_optimized USING GIN(search_vector);
CREATE INDEX idx_mpca_search_ca ON mpca_search_optimized(ca);
CREATE INDEX idx_mpca_search_provincia ON mpca_search_optimized(provincia, ca);
CREATE INDEX idx_mpca_search_municipio ON mpca_search_optimized(municipio);
CREATE INDEX idx_mpca_search_idm ON mpca_search_optimized(idm);

-- Create view for autonomous communities
CREATE VIEW comunidades_autonomas AS
SELECT DISTINCT
  idca,
  ca,
  COUNT(*) as total_municipios
FROM mpca
WHERE ca IS NOT NULL AND ca != ''
GROUP BY idca, ca
ORDER BY ca;

-- Create view for provinces by autonomous community
CREATE VIEW provincias_by_ca AS
SELECT DISTINCT
  idp,
  provincia,
  idca,
  ca,
  COUNT(*) as total_municipios
FROM mpca
WHERE provincia IS NOT NULL AND provincia != ''
AND ca IS NOT NULL AND ca != ''
GROUP BY idp, provincia, idca, ca
ORDER BY ca, provincia;

-- Add indexes to original mpca table for better performance
CREATE INDEX IF NOT EXISTS idx_mpca_ca ON mpca(ca);
CREATE INDEX IF NOT EXISTS idx_mpca_provincia ON mpca(provincia);
CREATE INDEX IF NOT EXISTS idx_mpca_municipio ON mpca(municipio);
CREATE INDEX IF NOT EXISTS idx_mpca_municipio_text ON mpca USING GIN(to_tsvector('spanish', municipio));

-- Refresh the materialized view (this should be done periodically)
REFRESH MATERIALIZED VIEW mpca_search_optimized;