-- Drop existing policy
DROP POLICY "Only admins can manage system settings" ON public.system_settings;

-- Create separate policies for read and write operations
CREATE POLICY "Authenticated users can view system settings" 
ON public.system_settings 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert system settings" 
ON public.system_settings 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Admins can update system settings" 
ON public.system_settings 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Admins can delete system settings" 
ON public.system_settings 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);