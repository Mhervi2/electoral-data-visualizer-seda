-- Delete duplicate electoral acts, keeping only the most recent version per full_identifier and source_type

-- First, create a temporary table with the IDs of acts to keep (most recent per group)
WITH acts_to_keep AS (
  SELECT DISTINCT ON (full_identifier, source_type) id
  FROM electoral_acts 
  WHERE full_identifier IS NOT NULL
  ORDER BY full_identifier, source_type, created_at DESC
),
-- Identify all duplicate act IDs to delete
acts_to_delete AS (
  SELECT ea.id
  FROM electoral_acts ea
  WHERE ea.full_identifier IS NOT NULL
    AND ea.id NOT IN (SELECT id FROM acts_to_keep)
)

-- Delete party_votes for duplicate acts first (foreign key constraint)
DELETE FROM party_votes 
WHERE electoral_act_id IN (SELECT id FROM acts_to_delete);

-- Delete mail_votes for duplicate acts
DELETE FROM mail_votes 
WHERE electoral_act_id IN (SELECT id FROM acts_to_delete);

-- Delete audit log entries for duplicate acts
DELETE FROM electoral_acts_audit_log 
WHERE electoral_act_id IN (SELECT id FROM acts_to_delete);

-- Finally, delete the duplicate electoral acts
DELETE FROM electoral_acts 
WHERE id IN (SELECT id FROM acts_to_delete);

-- Show summary of what was deleted
SELECT 
  'Deletion completed' as status,
  (SELECT COUNT(*) FROM electoral_acts) as remaining_acts;