-- Delete duplicate electoral acts, keeping only the most recent version per full_identifier and source_type

-- Delete party_votes for duplicate acts
DELETE FROM party_votes 
WHERE electoral_act_id IN (
  SELECT ea.id
  FROM electoral_acts ea
  WHERE ea.full_identifier IS NOT NULL
    AND ea.id NOT IN (
      SELECT DISTINCT ON (full_identifier, source_type) id
      FROM electoral_acts 
      WHERE full_identifier IS NOT NULL
      ORDER BY full_identifier, source_type, created_at DESC
    )
);

-- Delete mail_votes for duplicate acts
DELETE FROM mail_votes 
WHERE electoral_act_id IN (
  SELECT ea.id
  FROM electoral_acts ea
  WHERE ea.full_identifier IS NOT NULL
    AND ea.id NOT IN (
      SELECT DISTINCT ON (full_identifier, source_type) id
      FROM electoral_acts 
      WHERE full_identifier IS NOT NULL
      ORDER BY full_identifier, source_type, created_at DESC
    )
);

-- Delete audit log entries for duplicate acts
DELETE FROM electoral_acts_audit_log 
WHERE electoral_act_id IN (
  SELECT ea.id
  FROM electoral_acts ea
  WHERE ea.full_identifier IS NOT NULL
    AND ea.id NOT IN (
      SELECT DISTINCT ON (full_identifier, source_type) id
      FROM electoral_acts 
      WHERE full_identifier IS NOT NULL
      ORDER BY full_identifier, source_type, created_at DESC
    )
);

-- Finally, delete the duplicate electoral acts
DELETE FROM electoral_acts 
WHERE id IN (
  SELECT ea.id
  FROM electoral_acts ea
  WHERE ea.full_identifier IS NOT NULL
    AND ea.id NOT IN (
      SELECT DISTINCT ON (full_identifier, source_type) id
      FROM electoral_acts 
      WHERE full_identifier IS NOT NULL
      ORDER BY full_identifier, source_type, created_at DESC
    )
);