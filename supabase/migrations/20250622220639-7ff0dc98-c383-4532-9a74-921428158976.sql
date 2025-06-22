
-- Eliminar la vista actual que tiene SECURITY DEFINER
DROP VIEW IF EXISTS public.electoral_acts_with_municipalities;

-- Recrear la vista con SECURITY INVOKER para hacerla completamente pública
CREATE VIEW public.electoral_acts_with_municipalities 
WITH (security_invoker=true) AS
SELECT 
  ea.*,
  m.municipio,
  m.provincia,
  m.ca as comunidad_autonoma
FROM public.electoral_acts ea
LEFT JOIN public.mpca m ON ea.municipality_idm = m.idm;
