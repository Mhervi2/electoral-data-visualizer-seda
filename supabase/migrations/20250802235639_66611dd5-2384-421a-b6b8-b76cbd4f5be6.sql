-- Data cleanup and normalization for territorial codes

-- First, let's normalize the names by removing extra spaces
UPDATE public.mpca 
SET 
  municipio = TRIM(REGEXP_REPLACE(municipio, '\s+', ' ', 'g')),
  provincia = TRIM(REGEXP_REPLACE(provincia, '\s+', ' ', 'g')),
  ca = TRIM(REGEXP_REPLACE(ca, '\s+', ' ', 'g'));

-- Create a temporary table to track the minimum IDs for each CA
CREATE TEMP TABLE ca_min_ids AS
SELECT ca, MIN(idca) as min_idca
FROM public.mpca
GROUP BY ca;

-- Update all records to use the minimum IDCA for each CA
UPDATE public.mpca 
SET idca = ca_min_ids.min_idca
FROM ca_min_ids
WHERE public.mpca.ca = ca_min_ids.ca;

-- Create a temporary table to track the minimum IDs for each Province
CREATE TEMP TABLE province_min_ids AS
SELECT provincia, MIN(idp) as min_idp
FROM public.mpca
GROUP BY provincia;

-- Update all records to use the minimum IDP for each Province
UPDATE public.mpca 
SET idp = province_min_ids.min_idp
FROM province_min_ids
WHERE public.mpca.provincia = province_min_ids.provincia;

-- Add indexes for better performance on large dataset
CREATE INDEX IF NOT EXISTS idx_mpca_ca ON public.mpca(ca);
CREATE INDEX IF NOT EXISTS idx_mpca_provincia ON public.mpca(provincia);
CREATE INDEX IF NOT EXISTS idx_mpca_municipio ON public.mpca(municipio);
CREATE INDEX IF NOT EXISTS idx_mpca_idca ON public.mpca(idca);
CREATE INDEX IF NOT EXISTS idx_mpca_idp ON public.mpca(idp);

-- Clean up temporary tables
DROP TABLE ca_min_ids;
DROP TABLE province_min_ids;