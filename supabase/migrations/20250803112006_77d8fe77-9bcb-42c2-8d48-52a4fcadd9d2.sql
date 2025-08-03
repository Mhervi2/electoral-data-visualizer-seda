-- Phase 1: Data Cleanup and Normalization for MPCA table

-- First, let's normalize the names by trimming whitespace and standardizing formats
UPDATE public.mpca 
SET 
  ca = TRIM(ca),
  provincia = TRIM(provincia),
  municipio = TRIM(municipio)
WHERE 
  ca != TRIM(ca) OR 
  provincia != TRIM(provincia) OR 
  municipio != TRIM(municipio);

-- Normalize specific known variants for Autonomous Communities
UPDATE public.mpca 
SET ca = 'Cataluña'
WHERE ca IN ('Catalunya', 'Cataluña', 'Cataluna');

UPDATE public.mpca 
SET ca = 'Comunidad Valenciana'
WHERE ca IN ('Comunitat Valenciana', 'Valencia', 'C. Valenciana');

UPDATE public.mpca 
SET ca = 'País Vasco'
WHERE ca IN ('Euskadi', 'Pais Vasco', 'País Vasco');

UPDATE public.mpca 
SET ca = 'Castilla y León'
WHERE ca IN ('Castilla-León', 'Castilla y Leon');

UPDATE public.mpca 
SET ca = 'Castilla-La Mancha'
WHERE ca IN ('Castilla La Mancha', 'Castilla la Mancha');

-- Resolve duplicate IDCA codes by using the minimum ID for each unique CA name
WITH ca_min_ids AS (
  SELECT ca, MIN(idca) as min_idca
  FROM public.mpca 
  WHERE ca IS NOT NULL AND ca != ''
  GROUP BY ca
)
UPDATE public.mpca 
SET idca = ca_min_ids.min_idca
FROM ca_min_ids
WHERE public.mpca.ca = ca_min_ids.ca;

-- Resolve duplicate IDP codes by using the minimum ID for each unique province name
WITH provincia_min_ids AS (
  SELECT provincia, MIN(idp) as min_idp
  FROM public.mpca 
  WHERE provincia IS NOT NULL AND provincia != ''
  GROUP BY provincia
)
UPDATE public.mpca 
SET idp = provincia_min_ids.min_idp
FROM provincia_min_ids
WHERE public.mpca.provincia = provincia_min_ids.provincia;

-- Create indexes for better performance on large dataset queries
CREATE INDEX IF NOT EXISTS idx_mpca_ca ON public.mpca(ca);
CREATE INDEX IF NOT EXISTS idx_mpca_provincia ON public.mpca(provincia);
CREATE INDEX IF NOT EXISTS idx_mpca_municipio ON public.mpca(municipio);
CREATE INDEX IF NOT EXISTS idx_mpca_idca ON public.mpca(idca);
CREATE INDEX IF NOT EXISTS idx_mpca_idp ON public.mpca(idp);
CREATE INDEX IF NOT EXISTS idx_mpca_idm ON public.mpca(idm);

-- Create a composite index for common filtering patterns
CREATE INDEX IF NOT EXISTS idx_mpca_composite ON public.mpca(ca, provincia, municipio);