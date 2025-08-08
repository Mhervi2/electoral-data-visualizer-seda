-- Drop the existing policy that's causing issues
DROP POLICY IF EXISTS "Authenticated users can insert municipalities" ON public.mpca;

-- Create a more reliable INSERT policy for mpca table
CREATE POLICY "Authenticated users can insert municipalities" 
ON public.mpca 
FOR INSERT 
TO authenticated
WITH CHECK (auth.role() = 'authenticated');