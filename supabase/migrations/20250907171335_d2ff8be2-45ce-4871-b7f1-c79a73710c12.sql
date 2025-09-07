-- Update the handle_new_user function to include the new admin email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    -- Make both superadmin@seda.es and sergiomorolopez@gmail.com admins by default
    CASE WHEN NEW.email IN ('superadmin@seda.es', 'sergiomorolopez@gmail.com') THEN true ELSE false END
  );
  RETURN NEW;
END;
$function$;