-- Fix security issues by updating functions with proper search paths
CREATE OR REPLACE FUNCTION public.generate_full_identifier(
  p_idca BIGINT,
  p_idp BIGINT, 
  p_idc VARCHAR,
  p_mesa_identifier TEXT
) RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.update_electoral_acts_full_identifier()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.update_electoral_acts_on_mpca_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update all electoral acts for this municipality when territorial codes change
  IF TG_OP = 'UPDATE' AND (OLD.idca IS DISTINCT FROM NEW.idca OR OLD.idp IS DISTINCT FROM NEW.idp OR OLD.idc IS DISTINCT FROM NEW.idc) THEN
    UPDATE public.electoral_acts
    SET full_identifier = generate_full_identifier(NEW.idca, NEW.idp, NEW.idc, mesa_identifier)
    WHERE municipality_idm = NEW.idm AND mesa_identifier IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$$;