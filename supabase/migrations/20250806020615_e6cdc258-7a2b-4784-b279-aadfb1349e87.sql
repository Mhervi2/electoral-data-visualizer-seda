-- Add full_identifier column to electoral_acts
ALTER TABLE public.electoral_acts 
ADD COLUMN full_identifier TEXT;

-- Create function to generate full identifier using idc
CREATE OR REPLACE FUNCTION public.generate_full_identifier(
  p_idca INTEGER,
  p_idp INTEGER, 
  p_idc TEXT,
  p_mesa_identifier TEXT
) RETURNS TEXT AS $$
BEGIN
  IF p_idca IS NULL OR p_idp IS NULL OR p_idc IS NULL OR p_mesa_identifier IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Format: idca-idp-idc-distrito-seccion-mesa
  RETURN LPAD(p_idca::TEXT, 2, '0') || '-' || 
         LPAD(p_idp::TEXT, 2, '0') || '-' || 
         p_idc || '-' || 
         p_mesa_identifier;
END;
$$ LANGUAGE plpgsql;

-- Create function to update full_identifier for electoral acts
CREATE OR REPLACE FUNCTION public.update_electoral_acts_full_identifier()
RETURNS TRIGGER AS $$
BEGIN
  -- Update full_identifier when mesa_identifier changes
  IF TG_OP = 'UPDATE' AND (OLD.mesa_identifier IS DISTINCT FROM NEW.mesa_identifier OR OLD.municipality_idm IS DISTINCT FROM NEW.municipality_idm) THEN
    -- Get municipality data to generate full identifier
    SELECT generate_full_identifier(m.idca, m.idp, m.idc, NEW.mesa_identifier)
    INTO NEW.full_identifier
    FROM mpca m
    WHERE m.idm = NEW.municipality_idm;
  END IF;
  
  -- For INSERT operations
  IF TG_OP = 'INSERT' AND NEW.municipality_idm IS NOT NULL AND NEW.mesa_identifier IS NOT NULL THEN
    SELECT generate_full_identifier(m.idca, m.idp, m.idc, NEW.mesa_identifier)
    INTO NEW.full_identifier
    FROM mpca m
    WHERE m.idm = NEW.municipality_idm;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for electoral_acts
CREATE TRIGGER trigger_update_electoral_acts_full_identifier
  BEFORE INSERT OR UPDATE ON public.electoral_acts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_electoral_acts_full_identifier();

-- Create function to update all electoral acts when mpca changes
CREATE OR REPLACE FUNCTION public.update_electoral_acts_on_mpca_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all electoral acts for this municipality when territorial codes change
  IF TG_OP = 'UPDATE' AND (OLD.idca IS DISTINCT FROM NEW.idca OR OLD.idp IS DISTINCT FROM NEW.idp OR OLD.idc IS DISTINCT FROM NEW.idc) THEN
    UPDATE public.electoral_acts
    SET full_identifier = generate_full_identifier(NEW.idca, NEW.idp, NEW.idc, mesa_identifier)
    WHERE municipality_idm = NEW.idm AND mesa_identifier IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for mpca
CREATE TRIGGER trigger_update_electoral_acts_on_mpca_change
  AFTER UPDATE ON public.mpca
  FOR EACH ROW
  EXECUTE FUNCTION public.update_electoral_acts_on_mpca_change();

-- Populate existing records with full_identifier
UPDATE public.electoral_acts
SET full_identifier = (
  SELECT generate_full_identifier(m.idca, m.idp, m.idc, electoral_acts.mesa_identifier)
  FROM mpca m
  WHERE m.idm = electoral_acts.municipality_idm
)
WHERE municipality_idm IS NOT NULL AND mesa_identifier IS NOT NULL;