-- Unify Valencian Community records under "Comunidad Valenciana"
UPDATE public.mpca 
SET ca = 'Comunidad Valenciana' 
WHERE ca = 'Comunitat Valenciana';

-- Refresh materialized view to update search optimization
REFRESH MATERIALIZED VIEW public.mpca_search_optimized;

-- Verify the autonomous communities count (should be 19 now)
SELECT ca, COUNT(*) as total_municipios 
FROM public.mpca 
GROUP BY ca 
ORDER BY ca;