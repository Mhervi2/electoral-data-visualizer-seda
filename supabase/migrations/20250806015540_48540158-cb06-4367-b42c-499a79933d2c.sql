-- Add idc column to mpca table
ALTER TABLE public.mpca 
ADD COLUMN idc VARCHAR(3);

-- Populate idc column with sequential numbers per province, ordered alphabetically
WITH numbered_municipalities AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY provincia ORDER BY municipio ASC) as row_num
  FROM public.mpca
)
UPDATE public.mpca 
SET idc = LPAD(numbered_municipalities.row_num::text, 3, '0')
FROM numbered_municipalities 
WHERE mpca.id = numbered_municipalities.id;