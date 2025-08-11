-- Function to initialize provincial seats for a new election
CREATE OR REPLACE FUNCTION public.initialize_provincial_seats_for_election(p_election_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  province_count INTEGER := 0;
BEGIN
  -- Default seats distribution based on 2019 Spanish general election
  INSERT INTO public.provincial_seats (provincia, seats, election_id)
  VALUES 
    ('Madrid', 37, p_election_id),
    ('Barcelona', 32, p_election_id),
    ('Valencia', 16, p_election_id),
    ('Sevilla', 12, p_election_id),
    ('Alicante', 12, p_election_id),
    ('Málaga', 11, p_election_id),
    ('Murcia', 10, p_election_id),
    ('Cádiz', 9, p_election_id),
    ('Baleares', 8, p_election_id),
    ('Vizcaya', 8, p_election_id),
    ('Asturias', 8, p_election_id),
    ('La Coruña', 8, p_election_id),
    ('Córdoba', 7, p_election_id),
    ('Santa Cruz de Tenerife', 7, p_election_id),
    ('Las Palmas', 7, p_election_id),
    ('Pontevedra', 7, p_election_id),
    ('Granada', 7, p_election_id),
    ('Zaragoza', 7, p_election_id),
    ('Gipuzkoa', 6, p_election_id),
    ('Tarragona', 6, p_election_id),
    ('Girona', 6, p_election_id),
    ('Almería', 6, p_election_id),
    ('Badajoz', 6, p_election_id),
    ('Jaén', 6, p_election_id),
    ('Toledo', 6, p_election_id),
    ('Cantabria', 5, p_election_id),
    ('Castellón', 5, p_election_id),
    ('Ciudad Real', 5, p_election_id),
    ('Huelva', 5, p_election_id),
    ('Navarra', 5, p_election_id),
    ('Valladolid', 5, p_election_id),
    ('Lleida', 4, p_election_id),
    ('Cáceres', 4, p_election_id),
    ('Albacete', 4, p_election_id),
    ('Álava', 4, p_election_id),
    ('La Rioja', 4, p_election_id),
    ('Salamanca', 4, p_election_id),
    ('Burgos', 4, p_election_id),
    ('León', 4, p_election_id),
    ('Lugo', 4, p_election_id),
    ('Ourense', 4, p_election_id),
    ('Cuenca', 3, p_election_id),
    ('Guadalajara', 3, p_election_id),
    ('Huesca', 3, p_election_id),
    ('Teruel', 3, p_election_id),
    ('Zamora', 3, p_election_id),
    ('Ávila', 3, p_election_id),
    ('Segovia', 3, p_election_id),
    ('Palencia', 3, p_election_id),
    ('Soria', 2, p_election_id),
    ('Ceuta', 1, p_election_id),
    ('Melilla', 1, p_election_id)
  ON CONFLICT (provincia, election_id) DO NOTHING;

  GET DIAGNOSTICS province_count = ROW_COUNT;
  
  RETURN province_count;
END;
$function$