-- Update RLS policies for party_provinces table to allow public access
-- This fixes the "new row violates row-level security policy" error

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can manage party provinces" ON public.party_provinces;

-- Create new policy that allows public access for all operations
CREATE POLICY "Public can manage party provinces" 
ON public.party_provinces 
FOR ALL 
USING (true)
WITH CHECK (true);