-- Make the current user an admin if they exist in profiles
UPDATE public.profiles 
SET is_admin = true 
WHERE id = auth.uid();

-- If no profile exists for current user, create one as admin
INSERT INTO public.profiles (id, email, is_admin)
SELECT id, email, true
FROM auth.users 
WHERE id = auth.uid() 
AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid());

-- Also ensure the mail_voting_enabled setting exists with default value
INSERT INTO public.system_settings (setting_key, setting_value, description) 
VALUES ('mail_voting_enabled', 'true', 'Controla la visibilidad de todas las funciones relacionadas con el voto por correo en la aplicación')
ON CONFLICT (setting_key) DO NOTHING;