-- Add INSERT policy for mpca table to allow authenticated users to create municipalities
CREATE POLICY "Authenticated users can insert municipalities" 
ON public.mpca 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);