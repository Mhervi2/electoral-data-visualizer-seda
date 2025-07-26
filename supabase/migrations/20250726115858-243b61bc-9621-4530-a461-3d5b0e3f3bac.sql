-- Fix security issues by adding search_path to functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_electoral_act_changes()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  field_name TEXT;
  old_val TEXT;
  new_val TEXT;
BEGIN
  -- Increment version
  NEW.version = OLD.version + 1;
  NEW.updated_by = auth.uid();
  
  -- Log changes for each field
  IF OLD.census_total != NEW.census_total THEN
    INSERT INTO public.electoral_acts_audit_log 
    (electoral_act_id, changed_by, action, field_name, old_value, new_value, version)
    VALUES (NEW.id, auth.uid(), 'UPDATE', 'census_total', OLD.census_total::text, NEW.census_total::text, NEW.version);
  END IF;
  
  IF OLD.total_voters != NEW.total_voters THEN
    INSERT INTO public.electoral_acts_audit_log 
    (electoral_act_id, changed_by, action, field_name, old_value, new_value, version)
    VALUES (NEW.id, auth.uid(), 'UPDATE', 'total_voters', OLD.total_voters::text, NEW.total_voters::text, NEW.version);
  END IF;
  
  IF OLD.blank_votes != NEW.blank_votes THEN
    INSERT INTO public.electoral_acts_audit_log 
    (electoral_act_id, changed_by, action, field_name, old_value, new_value, version)
    VALUES (NEW.id, auth.uid(), 'UPDATE', 'blank_votes', OLD.blank_votes::text, NEW.blank_votes::text, NEW.version);
  END IF;
  
  IF OLD.null_votes != NEW.null_votes THEN
    INSERT INTO public.electoral_acts_audit_log 
    (electoral_act_id, changed_by, action, field_name, old_value, new_value, version)
    VALUES (NEW.id, auth.uid(), 'UPDATE', 'null_votes', OLD.null_votes::text, NEW.null_votes::text, NEW.version);
  END IF;
  
  IF OLD.mesa_identifier != NEW.mesa_identifier THEN
    INSERT INTO public.electoral_acts_audit_log 
    (electoral_act_id, changed_by, action, field_name, old_value, new_value, version)
    VALUES (NEW.id, auth.uid(), 'UPDATE', 'mesa_identifier', OLD.mesa_identifier, NEW.mesa_identifier, NEW.version);
  END IF;
  
  IF OLD.municipality_idm != NEW.municipality_idm THEN
    INSERT INTO public.electoral_acts_audit_log 
    (electoral_act_id, changed_by, action, field_name, old_value, new_value, version)
    VALUES (NEW.id, auth.uid(), 'UPDATE', 'municipality_idm', OLD.municipality_idm::text, NEW.municipality_idm::text, NEW.version);
  END IF;
  
  RETURN NEW;
END;
$$;