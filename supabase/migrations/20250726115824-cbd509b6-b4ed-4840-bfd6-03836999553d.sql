-- Add audit fields to electoral_acts table
ALTER TABLE public.electoral_acts 
ADD COLUMN updated_by UUID REFERENCES auth.users(id),
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

-- Create audit log table for tracking detailed changes
CREATE TABLE public.electoral_acts_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  electoral_act_id UUID NOT NULL REFERENCES public.electoral_acts(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  action TEXT NOT NULL, -- 'UPDATE', 'CREATE'
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  version INTEGER NOT NULL
);

-- Enable RLS on audit log table
ALTER TABLE public.electoral_acts_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policy for audit log (admins only)
CREATE POLICY "Only admins can view audit log" 
ON public.electoral_acts_audit_log 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() AND profiles.is_admin = true
));

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_electoral_acts_updated_at
  BEFORE UPDATE ON public.electoral_acts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to log field changes
CREATE OR REPLACE FUNCTION public.log_electoral_act_changes()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for audit logging
CREATE TRIGGER log_electoral_act_changes_trigger
  BEFORE UPDATE ON public.electoral_acts
  FOR EACH ROW
  EXECUTE FUNCTION public.log_electoral_act_changes();