-- Add unique constraint to prevent duplicate provincia-election combinations
ALTER TABLE public.provincial_seats 
ADD CONSTRAINT unique_provincia_election 
UNIQUE (provincia, election_id);