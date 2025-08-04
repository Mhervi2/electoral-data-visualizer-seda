-- Create function to update individual municipality name
CREATE OR REPLACE FUNCTION public.update_municipality_name(p_idm integer, p_new_name text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    affected_count INTEGER;
BEGIN
    -- Update the municipality name
    UPDATE mpca 
    SET municipio = p_new_name 
    WHERE idm = p_idm;
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    
    RETURN affected_count;
END;
$function$