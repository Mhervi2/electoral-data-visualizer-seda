-- Update the audit triggers to allow null changed_by for automated imports

-- Drop and recreate the log_party_votes_changes function to handle null changed_by
DROP FUNCTION IF EXISTS public.log_party_votes_changes() CASCADE;

CREATE OR REPLACE FUNCTION public.log_party_votes_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  party_name TEXT;
  electoral_act_version INTEGER;
  change_user UUID;
BEGIN
  -- Use auth.uid() if available, otherwise null for automated imports
  change_user := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
  
  -- Get electoral act version and increment it
  UPDATE public.electoral_acts 
  SET version = version + 1, 
      updated_by = COALESCE(auth.uid(), updated_by), 
      updated_at = now()
  WHERE id = COALESCE(NEW.electoral_act_id, OLD.electoral_act_id)
  RETURNING version INTO electoral_act_version;
  
  -- Get party name for logging
  SELECT name INTO party_name 
  FROM public.political_parties 
  WHERE id = COALESCE(NEW.party_id, OLD.party_id);
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.electoral_acts_audit_log 
    (electoral_act_id, changed_by, action, field_name, old_value, new_value, version)
    VALUES (NEW.electoral_act_id, change_user, 'INSERT', 'party_votes_' || NEW.party_id, 
            NULL, 'Partido: ' || COALESCE(party_name, NEW.party_id) || ' - Votos: ' || NEW.votes::text, electoral_act_version);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.electoral_acts_audit_log 
    (electoral_act_id, changed_by, action, field_name, old_value, new_value, version)
    VALUES (NEW.electoral_act_id, change_user, 'UPDATE', 'party_votes_' || NEW.party_id,
            'Partido: ' || COALESCE(party_name, NEW.party_id) || ' - Votos: ' || OLD.votes::text,
            'Partido: ' || COALESCE(party_name, NEW.party_id) || ' - Votos: ' || NEW.votes::text, electoral_act_version);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.electoral_acts_audit_log 
    (electoral_act_id, changed_by, action, field_name, old_value, new_value, version)
    VALUES (OLD.electoral_act_id, change_user, 'DELETE', 'party_votes_' || OLD.party_id,
            'Partido: ' || COALESCE(party_name, OLD.party_id) || ' - Votos: ' || OLD.votes::text, NULL, electoral_act_version);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER log_party_votes_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.party_votes
  FOR EACH ROW EXECUTE FUNCTION public.log_party_votes_changes();

-- Also update the electoral acts audit trigger to handle null changed_by
DROP FUNCTION IF EXISTS public.log_electoral_act_changes() CASCADE;

CREATE OR REPLACE FUNCTION public.log_electoral_act_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  field_name TEXT;
  old_val TEXT;
  new_val TEXT;
  change_user UUID;
BEGIN
  -- Use auth.uid() if available, otherwise null for automated imports
  change_user := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
  
  -- Increment version
  NEW.version = OLD.version + 1;
  NEW.updated_by = auth.uid();
  
  -- Log changes for each field
  IF OLD.census_total != NEW.census_total THEN
    INSERT INTO public.electoral_acts_audit_log 
    (electoral_act_id, changed_by, action, field_name, old_value, new_value, version)
    VALUES (NEW.id, change_user, 'UPDATE', 'census_total', OLD.census_total::text, NEW.census_total::text, NEW.version);
  END IF;
  
  IF OLD.total_voters != NEW.total_voters THEN
    INSERT INTO public.electoral_acts_audit_log 
    (electoral_act_id, changed_by, action, field_name, old_value, new_value, version)
    VALUES (NEW.id, change_user, 'UPDATE', 'total_voters', OLD.total_voters::text, NEW.total_voters::text, NEW.version);
  END IF;
  
  IF OLD.blank_votes != NEW.blank_votes THEN
    INSERT INTO public.electoral_acts_audit_log 
    (electoral_act_id, changed_by, action, field_name, old_value, new_value, version)
    VALUES (NEW.id, change_user, 'UPDATE', 'blank_votes', OLD.blank_votes::text, NEW.blank_votes::text, NEW.version);
  END IF;
  
  IF OLD.null_votes != NEW.null_votes THEN
    INSERT INTO public.electoral_acts_audit_log 
    (electoral_act_id, changed_by, action, field_name, old_value, new_value, version)
    VALUES (NEW.id, change_user, 'UPDATE', 'null_votes', OLD.null_votes::text, NEW.null_votes::text, NEW.version);
  END IF;
  
  IF OLD.mesa_identifier != NEW.mesa_identifier THEN
    INSERT INTO public.electoral_acts_audit_log 
    (electoral_act_id, changed_by, action, field_name, old_value, new_value, version)
    VALUES (NEW.id, change_user, 'UPDATE', 'mesa_identifier', OLD.mesa_identifier, NEW.mesa_identifier, NEW.version);
  END IF;
  
  IF OLD.municipality_idm != NEW.municipality_idm THEN
    INSERT INTO public.electoral_acts_audit_log 
    (electoral_act_id, changed_by, action, field_name, old_value, new_value, version)
    VALUES (NEW.id, change_user, 'UPDATE', 'municipality_idm', OLD.municipality_idm::text, NEW.municipality_idm::text, NEW.version);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER log_electoral_act_changes_trigger
  BEFORE UPDATE ON public.electoral_acts
  FOR EACH ROW EXECUTE FUNCTION public.log_electoral_act_changes();

-- Also update mail votes trigger
DROP FUNCTION IF EXISTS public.log_mail_votes_changes() CASCADE;

CREATE OR REPLACE FUNCTION public.log_mail_votes_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  electoral_act_version INTEGER;
  change_user UUID;
BEGIN
  -- Use auth.uid() if available, otherwise use a default UUID for automated imports
  change_user := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
  
  -- Get electoral act version and increment it
  UPDATE public.electoral_acts 
  SET version = version + 1, 
      updated_by = COALESCE(auth.uid(), updated_by), 
      updated_at = now()
  WHERE id = COALESCE(NEW.electoral_act_id, OLD.electoral_act_id)
  RETURNING version INTO electoral_act_version;
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.electoral_acts_audit_log 
    (electoral_act_id, changed_by, action, field_name, old_value, new_value, version)
    VALUES (NEW.electoral_act_id, change_user, 'INSERT', 'mail_votes', 
            NULL, 'DNI agregado: ' || NEW.dni, electoral_act_version);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.electoral_acts_audit_log 
    (electoral_act_id, changed_by, action, field_name, old_value, new_value, version)
    VALUES (OLD.electoral_act_id, change_user, 'DELETE', 'mail_votes',
            'DNI eliminado: ' || OLD.dni, NULL, electoral_act_version);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER log_mail_votes_changes_trigger
  AFTER INSERT OR DELETE ON public.mail_votes
  FOR EACH ROW EXECUTE FUNCTION public.log_mail_votes_changes();