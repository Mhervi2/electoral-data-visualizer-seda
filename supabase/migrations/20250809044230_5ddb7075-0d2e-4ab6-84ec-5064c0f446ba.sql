-- Fix RLS policy for political_party_provincial_order to work with custom authentication
-- Drop the restrictive policy
DROP POLICY IF EXISTS "Authenticated users can manage party orders" ON public.political_party_provincial_order;

-- Create a new policy that allows all operations without requiring auth.uid()
CREATE POLICY "Allow all operations on party orders" 
ON public.political_party_provincial_order 
FOR ALL 
USING (true)
WITH CHECK (true);