-- Function to copy provincial seats from one election to another
CREATE OR REPLACE FUNCTION public.copy_provincial_seats_between_elections(p_from_election_id UUID, p_to_election_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  copied_count INTEGER := 0;
BEGIN
  INSERT INTO public.provincial_seats (provincia, seats, election_id)
  SELECT provincia, seats, p_to_election_id
  FROM public.provincial_seats
  WHERE election_id = p_from_election_id
  ON CONFLICT (provincia, election_id) DO NOTHING;

  GET DIAGNOSTICS copied_count = ROW_COUNT;
  
  RETURN copied_count;
END;
$function$