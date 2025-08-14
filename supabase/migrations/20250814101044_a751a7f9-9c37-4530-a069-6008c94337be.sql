-- Temporarily simplify RLS policies for system_settings to debug the issue
DROP POLICY IF EXISTS "Admins can update system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can insert system settings" ON public.system_settings;

-- Create more permissive policies for debugging
CREATE POLICY "Authenticated users can update system settings (debug)" 
ON public.system_settings 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert system settings (debug)" 
ON public.system_settings 
FOR INSERT 
TO authenticated 
WITH CHECK (true);