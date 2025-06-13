
-- Insert sample electoral acts for the 2023 general elections with realistic data
-- First, let's get the election ID for July 23, 2023
WITH election_2023 AS (
  SELECT id FROM public.elections WHERE date = '2023-07-23' LIMIT 1
)

-- Insert electoral acts from INDRA source
INSERT INTO public.electoral_acts (
  election_id, municipality_id, district, section, table_letter,
  census_total, total_voters, blank_votes, null_votes, source_type
)
SELECT 
  e.id,
  '28079', -- Madrid
  '01',
  '001',
  'A',
  850,
  745,
  12,
  8,
  'indra'
FROM election_2023 e
UNION ALL
SELECT 
  e.id,
  '28079', -- Madrid
  '01',
  '002',
  'A',
  892,
  780,
  15,
  10,
  'indra'
FROM election_2023 e
UNION ALL
SELECT 
  e.id,
  '08019', -- Barcelona
  '01',
  '001',
  'A',
  920,
  825,
  18,
  12,
  'indra'
FROM election_2023 e
UNION ALL
SELECT 
  e.id,
  '41091', -- Sevilla
  '01',
  '001',
  'A',
  765,
  680,
  14,
  9,
  'indra'
FROM election_2023 e;

-- Insert the same electoral acts from escrutinio source with slight variations
WITH election_2023 AS (
  SELECT id FROM public.elections WHERE date = '2023-07-23' LIMIT 1
)
INSERT INTO public.electoral_acts (
  election_id, municipality_id, district, section, table_letter,
  census_total, total_voters, blank_votes, null_votes, source_type
)
SELECT 
  e.id,
  '28079', -- Madrid
  '01',
  '001',
  'A',
  850,
  747, -- Slight difference
  12,
  8,
  'escrutinio'
FROM election_2023 e
UNION ALL
SELECT 
  e.id,
  '28079', -- Madrid
  '01',
  '002',
  'A',
  892,
  782, -- Slight difference
  15,
  10,
  'escrutinio'
FROM election_2023 e
UNION ALL
SELECT 
  e.id,
  '08019', -- Barcelona
  '01',
  '001',
  'A',
  920,
  827, -- Slight difference
  18,
  12,
  'escrutinio'
FROM election_2023 e
UNION ALL
SELECT 
  e.id,
  '41091', -- Sevilla
  '01',
  '001',
  'A',
  765,
  682, -- Slight difference
  14,
  9,
  'escrutinio'
FROM election_2023 e;

-- Insert oficial results (BOE) - these would be the final verified results
WITH election_2023 AS (
  SELECT id FROM public.elections WHERE date = '2023-07-23' LIMIT 1
)
INSERT INTO public.electoral_acts (
  election_id, municipality_id, district, section, table_letter,
  census_total, total_voters, blank_votes, null_votes, source_type
)
SELECT 
  e.id,
  '28079', -- Madrid
  '01',
  '001',
  'A',
  850,
  747,
  12,
  8,
  'oficial'
FROM election_2023 e
UNION ALL
SELECT 
  e.id,
  '28079', -- Madrid
  '01',
  '002',
  'A',
  892,
  782,
  15,
  10,
  'oficial'
FROM election_2023 e
UNION ALL
SELECT 
  e.id,
  '08019', -- Barcelona
  '01',
  '001',
  'A',
  920,
  827,
  18,
  12,
  'oficial'
FROM election_2023 e
UNION ALL
SELECT 
  e.id,
  '41091', -- Sevilla
  '01',
  '001',
  'A',
  765,
  682,
  14,
  9,
  'oficial'
FROM election_2023 e;

-- Now insert the party votes for each electoral act
-- First, let's insert votes for Madrid District 1, Section 1, Table A (INDRA)
WITH madrid_indra AS (
  SELECT ea.id as act_id
  FROM public.electoral_acts ea
  JOIN public.elections e ON ea.election_id = e.id
  WHERE e.date = '2023-07-23' 
    AND ea.municipality_id = '28079'
    AND ea.district = '01'
    AND ea.section = '001'
    AND ea.table_letter = 'A'
    AND ea.source_type = 'indra'
)
INSERT INTO public.party_votes (electoral_act_id, party_id, votes)
SELECT 
  m.act_id,
  'pp',
  245
FROM madrid_indra m
UNION ALL
SELECT 
  m.act_id,
  'psoe',
  198
FROM madrid_indra m
UNION ALL
SELECT 
  m.act_id,
  'vox',
  125
FROM madrid_indra m
UNION ALL
SELECT 
  m.act_id,
  'podemos',
  89
FROM madrid_indra m
UNION ALL
SELECT 
  m.act_id,
  'cs',
  68
FROM madrid_indra m;

-- Insert votes for Madrid District 1, Section 1, Table A (Escrutinio) - with slight variations
WITH madrid_escrutinio AS (
  SELECT ea.id as act_id
  FROM public.electoral_acts ea
  JOIN public.elections e ON ea.election_id = e.id
  WHERE e.date = '2023-07-23' 
    AND ea.municipality_id = '28079'
    AND ea.district = '01'
    AND ea.section = '001'
    AND ea.table_letter = 'A'
    AND ea.source_type = 'escrutinio'
)
INSERT INTO public.party_votes (electoral_act_id, party_id, votes)
SELECT 
  m.act_id,
  'pp',
  247 -- Slight difference
FROM madrid_escrutinio m
UNION ALL
SELECT 
  m.act_id,
  'psoe',
  198
FROM madrid_escrutinio m
UNION ALL
SELECT 
  m.act_id,
  'vox',
  124 -- Slight difference
FROM madrid_escrutinio m
UNION ALL
SELECT 
  m.act_id,
  'podemos',
  90 -- Slight difference
FROM madrid_escrutinio m
UNION ALL
SELECT 
  m.act_id,
  'cs',
  68
FROM madrid_escrutinio m;

-- Insert votes for Madrid District 1, Section 1, Table A (Oficial) - final results
WITH madrid_oficial AS (
  SELECT ea.id as act_id
  FROM public.electoral_acts ea
  JOIN public.elections e ON ea.election_id = e.id
  WHERE e.date = '2023-07-23' 
    AND ea.municipality_id = '28079'
    AND ea.district = '01'
    AND ea.section = '001'
    AND ea.table_letter = 'A'
    AND ea.source_type = 'oficial'
)
INSERT INTO public.party_votes (electoral_act_id, party_id, votes)
SELECT 
  m.act_id,
  'pp',
  247
FROM madrid_oficial m
UNION ALL
SELECT 
  m.act_id,
  'psoe',
  198
FROM madrid_oficial m
UNION ALL
SELECT 
  m.act_id,
  'vox',
  124
FROM madrid_oficial m
UNION ALL
SELECT 
  m.act_id,
  'podemos',
  90
FROM madrid_oficial m
UNION ALL
SELECT 
  m.act_id,
  'cs',
  68
FROM madrid_oficial m;

-- Insert votes for Barcelona (similar pattern)
WITH barcelona_indra AS (
  SELECT ea.id as act_id
  FROM public.electoral_acts ea
  JOIN public.elections e ON ea.election_id = e.id
  WHERE e.date = '2023-07-23' 
    AND ea.municipality_id = '08019'
    AND ea.district = '01'
    AND ea.section = '001'
    AND ea.table_letter = 'A'
    AND ea.source_type = 'indra'
)
INSERT INTO public.party_votes (electoral_act_id, party_id, votes)
SELECT 
  b.act_id,
  'psoe',
  220
FROM barcelona_indra b
UNION ALL
SELECT 
  b.act_id,
  'pp',
  165
FROM barcelona_indra b
UNION ALL
SELECT 
  b.act_id,
  'erc',
  145
FROM barcelona_indra b
UNION ALL
SELECT 
  b.act_id,
  'podemos',
  125
FROM barcelona_indra b
UNION ALL
SELECT 
  b.act_id,
  'vox',
  98
FROM barcelona_indra b
UNION ALL
SELECT 
  b.act_id,
  'cs',
  72
FROM barcelona_indra b;

-- Add more sample data for other municipalities and sources following the same pattern
-- This is a representative sample - in reality you would have thousands of electoral acts
