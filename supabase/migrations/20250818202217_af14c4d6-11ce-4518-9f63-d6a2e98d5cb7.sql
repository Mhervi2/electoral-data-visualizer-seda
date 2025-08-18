-- Fix security issues for the new views by adding RLS policies

-- Enable RLS on the materialized view
ALTER MATERIALIZED VIEW mpca_search_optimized ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for mpca_search_optimized (same as mpca table)
CREATE POLICY "Public can view mpca_search_optimized data" 
ON mpca_search_optimized 
FOR SELECT 
USING (true);

-- Note: Views inherit RLS from underlying tables automatically, but we'll be explicit
-- Create RLS policy for comunidades_autonomas view
CREATE POLICY "Public can view comunidades_autonomas" 
ON comunidades_autonomas 
FOR SELECT 
USING (true);

-- Create RLS policy for provincias_by_ca view
CREATE POLICY "Public can view provincias_by_ca" 
ON provincias_by_ca 
FOR SELECT 
USING (true);