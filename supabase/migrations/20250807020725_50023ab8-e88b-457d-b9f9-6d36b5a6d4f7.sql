-- Drop the restrictive admin-only UPDATE policy
DROP POLICY IF EXISTS "Allow admins to update territorial codes" ON public.mpca;

-- Create a new permissive UPDATE policy that allows all updates
CREATE POLICY "Allow all updates to mpca" 
ON public.mpca 
FOR UPDATE 
USING (true);