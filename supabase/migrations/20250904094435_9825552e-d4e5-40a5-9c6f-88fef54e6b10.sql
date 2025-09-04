-- Add party identifier column to political_parties table
ALTER TABLE public.political_parties 
ADD COLUMN party_identifier integer;

-- Create a function to get the next available party identifier
CREATE OR REPLACE FUNCTION get_next_party_identifier()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    next_id integer;
BEGIN
    SELECT COALESCE(MAX(party_identifier), 0) + 1 
    INTO next_id 
    FROM political_parties;
    
    RETURN next_id;
END;
$$;

-- Assign sequential identifiers to existing parties (ordered by creation date)
WITH numbered_parties AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, name ASC) as rn
    FROM political_parties
    WHERE party_identifier IS NULL
)
UPDATE political_parties 
SET party_identifier = numbered_parties.rn
FROM numbered_parties
WHERE political_parties.id = numbered_parties.id;

-- Make the column NOT NULL and add a default value for new parties
ALTER TABLE public.political_parties 
ALTER COLUMN party_identifier SET NOT NULL,
ALTER COLUMN party_identifier SET DEFAULT get_next_party_identifier();

-- Add a unique constraint to ensure no duplicate identifiers
ALTER TABLE public.political_parties 
ADD CONSTRAINT unique_party_identifier UNIQUE (party_identifier);

-- Create an index for better performance
CREATE INDEX idx_political_parties_identifier ON public.political_parties(party_identifier);