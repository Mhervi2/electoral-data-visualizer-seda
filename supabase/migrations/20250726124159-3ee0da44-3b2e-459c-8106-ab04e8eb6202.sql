-- Create function to log party votes changes
CREATE OR REPLACE FUNCTION public.log_party_votes_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  party_name TEXT;
  electoral_act_version INTEGER;
BEGIN
  -- Get electoral act version and increment it
  UPDATE public.electoral_acts 
  SET version = version + 1, updated_by = auth.uid(), updated_at = now()
  WHERE id = COALESCE(NEW.electoral_act_id, OLD.electoral_act_id)
  RETURNING version INTO electoral_act_version;
  
  -- Get party name for logging
  SELECT name INTO party_name 
  FROM public.political_parties 
  WHERE id = COALESCE(NEW.party_id, OLD.party_id);
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.electoral_acts_audit_log 
    (electoral_act_id, changed_by, action, field_name, old_value, new_value, version)
    VALUES (NEW.electoral_act_id, auth.uid(), 'INSERT', 'party_votes_' || NEW.party_id, 
            NULL, 'Partido: ' || COALESCE(party_name, NEW.party_id) || ' - Votos: ' || NEW.votes::text, electoral_act_version);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.electoral_acts_audit_log 
    (electoral_act_id, changed_by, action, field_name, old_value, new_value, version)
    VALUES (NEW.electoral_act_id, auth.uid(), 'UPDATE', 'party_votes_' || NEW.party_id,
            'Partido: ' || COALESCE(party_name, NEW.party_id) || ' - Votos: ' || OLD.votes::text,
            'Partido: ' || COALESCE(party_name, NEW.party_id) || ' - Votos: ' || NEW.votes::text, electoral_act_version);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.electoral_acts_audit_log 
    (electoral_act_id, changed_by, action, field_name, old_value, new_value, version)
    VALUES (OLD.electoral_act_id, auth.uid(), 'DELETE', 'party_votes_' || OLD.party_id,
            'Partido: ' || COALESCE(party_name, OLD.party_id) || ' - Votos: ' || OLD.votes::text, NULL, electoral_act_version);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create function to log mail votes changes
CREATE OR REPLACE FUNCTION public.log_mail_votes_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  electoral_act_version INTEGER;
BEGIN
  -- Get electoral act version and increment it
  UPDATE public.electoral_acts 
  SET version = version + 1, updated_by = auth.uid(), updated_at = now()
  WHERE id = COALESCE(NEW.electoral_act_id, OLD.electoral_act_id)
  RETURNING version INTO electoral_act_version;
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.electoral_acts_audit_log 
    (electoral_act_id, changed_by, action, field_name, old_value, new_value, version)
    VALUES (NEW.electoral_act_id, auth.uid(), 'INSERT', 'mail_votes', 
            NULL, 'DNI agregado: ' || NEW.dni, electoral_act_version);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.electoral_acts_audit_log 
    (electoral_act_id, changed_by, action, field_name, old_value, new_value, version)
    VALUES (OLD.electoral_act_id, auth.uid(), 'DELETE', 'mail_votes',
            'DNI eliminado: ' || OLD.dni, NULL, electoral_act_version);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create triggers for party votes
CREATE TRIGGER log_party_votes_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.party_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.log_party_votes_changes();

-- Create triggers for mail votes  
CREATE TRIGGER log_mail_votes_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.mail_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.log_mail_votes_changes();