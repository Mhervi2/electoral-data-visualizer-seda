-- First, let's clean up the Valencia duplicate data
-- Delete the anomalous entry with IDM 46250, keeping the original IDM 7345
DELETE FROM public.mpca 
WHERE idm = 46250 AND municipio = 'Valencia';

-- Verify the correct Valencia entry exists
-- Should have IDM 7345, IDC 249, IDP 20, IDCA 10

-- Fix the update_municipality_name function to prevent duplicates
CREATE OR REPLACE FUNCTION public.update_municipality_name(p_idm integer, p_new_name text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    affected_count INTEGER;
    old_name TEXT;
BEGIN
    -- Get the old name for logging
    SELECT municipio INTO old_name FROM mpca WHERE idm = p_idm;
    
    -- Validate that the municipality exists
    IF old_name IS NULL THEN
        RAISE EXCEPTION 'Municipality with IDM % not found', p_idm;
    END IF;
    
    -- Update ONLY the municipality name, keeping IDM unchanged
    UPDATE mpca 
    SET municipio = p_new_name 
    WHERE idm = p_idm;
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    
    -- Log the change
    RAISE NOTICE 'Updated municipality IDM % from "%" to "%". Affected rows: %', 
                 p_idm, old_name, p_new_name, affected_count;
    
    RETURN affected_count;
END;
$function$;

-- Create audit log table for mpca changes
CREATE TABLE IF NOT EXISTS public.mpca_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL DEFAULT 'mpca',
    operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    row_id BIGINT NOT NULL, -- The IDM
    old_values JSONB,
    new_values JSONB,
    changed_by UUID,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.mpca_audit_log ENABLE ROW LEVEL SECURITY;

-- Allow admins to view audit logs
CREATE POLICY "Only admins can view mpca audit log" 
ON public.mpca_audit_log 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.is_admin = true
    )
);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION public.log_mpca_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    old_data JSONB;
    new_data JSONB;
BEGIN
    -- Convert old and new data to JSON
    IF TG_OP = 'DELETE' THEN
        old_data = to_jsonb(OLD);
        new_data = NULL;
    ELSIF TG_OP = 'INSERT' THEN
        old_data = NULL;
        new_data = to_jsonb(NEW);
    ELSE -- UPDATE
        old_data = to_jsonb(OLD);
        new_data = to_jsonb(NEW);
    END IF;

    -- Insert audit record
    INSERT INTO public.mpca_audit_log (
        operation,
        row_id,
        old_values,
        new_values,
        changed_by
    ) VALUES (
        TG_OP,
        COALESCE(NEW.idm, OLD.idm),
        old_data,
        new_data,
        auth.uid()
    );

    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create the audit trigger
DROP TRIGGER IF EXISTS mpca_audit_trigger ON public.mpca;
CREATE TRIGGER mpca_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.mpca
    FOR EACH ROW EXECUTE FUNCTION log_mpca_changes();

-- Add constraints to prevent future data corruption
-- Unique constraint on (provincia, municipio, idc) to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_mpca_unique_municipality 
ON public.mpca (provincia, municipio, idc) 
WHERE provincia IS NOT NULL AND municipio IS NOT NULL AND idc IS NOT NULL;

-- Constraint to prevent abnormally large IDM values
ALTER TABLE public.mpca 
ADD CONSTRAINT IF NOT EXISTS chk_idm_reasonable_range 
CHECK (idm > 0 AND idm < 100000);

-- Index for better performance on IDM lookups
CREATE INDEX IF NOT EXISTS idx_mpca_idm ON public.mpca (idm);
CREATE INDEX IF NOT EXISTS idx_mpca_municipio_search ON public.mpca (municipio, provincia, ca);