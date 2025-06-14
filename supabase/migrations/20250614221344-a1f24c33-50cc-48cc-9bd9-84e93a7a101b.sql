
-- Crear una tabla temporal con valores únicos
CREATE TEMPORARY TABLE temp_mpca AS
SELECT DISTINCT ON (idm) 
    ROW_NUMBER() OVER (ORDER BY municipio, provincia) as new_idm,
    municipio, 
    provincia, 
    ca, 
    idp, 
    idca
FROM public.mpca
WHERE idm IS NOT NULL
ORDER BY idm, municipio;

-- Limpiar la tabla original
DELETE FROM public.mpca;

-- Insertar los datos con nuevos IDs únicos
INSERT INTO public.mpca (idm, municipio, provincia, ca, idp, idca)
SELECT new_idm, municipio, provincia, ca, idp, idca
FROM temp_mpca;

-- Asegurar que idm sea NOT NULL
ALTER TABLE public.mpca ALTER COLUMN idm SET NOT NULL;

-- Crear la constraint única en idm
ALTER TABLE public.mpca ADD CONSTRAINT unique_idm UNIQUE(idm);

-- Añadir la clave primaria UUID si no existe
ALTER TABLE public.mpca ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- Actualizar la tabla electoral_acts para que use directamente el idm de mpca
ALTER TABLE public.electoral_acts DROP COLUMN IF EXISTS municipality_id;
ALTER TABLE public.electoral_acts ADD COLUMN municipality_idm INTEGER;

-- Crear la referencia de clave foránea
ALTER TABLE public.electoral_acts ADD CONSTRAINT fk_electoral_acts_municipality 
    FOREIGN KEY (municipality_idm) REFERENCES public.mpca(idm);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_mpca_idm ON public.mpca(idm);
CREATE INDEX IF NOT EXISTS idx_mpca_municipio ON public.mpca(municipio);
CREATE INDEX IF NOT EXISTS idx_electoral_acts_municipality_idm ON public.electoral_acts(municipality_idm);

-- Asegurar que los tipos en electoral_acts sean texto
ALTER TABLE public.electoral_acts ALTER COLUMN district TYPE TEXT;
ALTER TABLE public.electoral_acts ALTER COLUMN section TYPE TEXT;
ALTER TABLE public.electoral_acts ALTER COLUMN table_letter TYPE TEXT;

-- Crear una vista para facilitar las consultas que unen electoral_acts con municipios
CREATE OR REPLACE VIEW public.electoral_acts_with_municipalities AS
SELECT 
    ea.*,
    m.municipio,
    m.provincia,
    m.ca as comunidad_autonoma
FROM public.electoral_acts ea
LEFT JOIN public.mpca m ON ea.municipality_idm = m.idm;
