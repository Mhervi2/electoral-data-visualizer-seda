
-- Primero insertar los municipios que faltan
INSERT INTO public.mpca (idm, municipio, provincia, ca, idp, idca) 
VALUES 
  (28079, 'Madrid', 'Madrid', 'Comunidad de Madrid', 28, 13),
  (8019, 'Barcelona', 'Barcelona', 'Cataluña', 8, 9),
  (41091, 'Sevilla', 'Sevilla', 'Andalucía', 41, 1),
  (46250, 'Valencia', 'Valencia', 'Comunitat Valenciana', 46, 10),
  (48020, 'Bilbao', 'Bizkaia', 'País Vasco', 48, 16)
ON CONFLICT (idm) DO NOTHING;

-- Ahora insertar las actas electorales y sus votos usando los IDs correctos de los partidos
DO $$
DECLARE
  election_id uuid;
  pp_party_id text;
  psoe_party_id text;
  vox_party_id text;
  podemos_party_id text;
BEGIN
  -- Obtener el ID de la elección activa
  SELECT id INTO election_id FROM public.elections WHERE status = 'active' LIMIT 1;
  
  -- Obtener los IDs correctos de los partidos existentes
  SELECT id INTO pp_party_id FROM public.political_parties WHERE siglas = 'PP' LIMIT 1;
  SELECT id INTO psoe_party_id FROM public.political_parties WHERE siglas = 'PSOE' LIMIT 1;
  SELECT id INTO vox_party_id FROM public.political_parties WHERE siglas = 'VOX' LIMIT 1;
  SELECT id INTO podemos_party_id FROM public.political_parties WHERE siglas = 'PODEMOS' LIMIT 1;
  
  -- Mostrar información de debug
  RAISE NOTICE 'Election ID: %', election_id;
  RAISE NOTICE 'PP Party ID: %', pp_party_id;
  RAISE NOTICE 'PSOE Party ID: %', psoe_party_id;
  RAISE NOTICE 'VOX Party ID: %', vox_party_id;
  RAISE NOTICE 'PODEMOS Party ID: %', podemos_party_id;
  
  IF election_id IS NOT NULL THEN
    -- Insertar actas electorales
    INSERT INTO public.electoral_acts (
      election_id, municipality_idm, district, section, table_letter,
      census_total, total_voters, blank_votes, null_votes, source_type
    ) VALUES 
      (election_id, 28079, '01', '001', 'A', 850, 745, 12, 8, 'oficial'),
      (election_id, 8019, '01', '001', 'A', 920, 825, 18, 12, 'oficial'),
      (election_id, 41091, '01', '001', 'A', 765, 680, 14, 9, 'oficial'),
      (election_id, 46250, '01', '001', 'A', 800, 720, 15, 10, 'oficial'),
      (election_id, 48020, '01', '001', 'A', 700, 630, 12, 8, 'oficial')
    ON CONFLICT DO NOTHING;
    
    -- Insertar votos solo para partidos que existen
    IF pp_party_id IS NOT NULL THEN
      INSERT INTO public.party_votes (electoral_act_id, party_id, votes)
      SELECT ea.id, pp_party_id, 250
      FROM public.electoral_acts ea
      WHERE ea.municipality_idm IN (28079, 8019, 41091, 46250, 48020) AND ea.source_type = 'oficial'
      ON CONFLICT DO NOTHING;
    END IF;
    
    IF psoe_party_id IS NOT NULL THEN
      INSERT INTO public.party_votes (electoral_act_id, party_id, votes)
      SELECT ea.id, psoe_party_id, 200
      FROM public.electoral_acts ea
      WHERE ea.municipality_idm IN (28079, 8019, 41091, 46250, 48020) AND ea.source_type = 'oficial'
      ON CONFLICT DO NOTHING;
    END IF;
    
    IF vox_party_id IS NOT NULL THEN
      INSERT INTO public.party_votes (electoral_act_id, party_id, votes)
      SELECT ea.id, vox_party_id, 120
      FROM public.electoral_acts ea
      WHERE ea.municipality_idm IN (28079, 8019, 41091, 46250, 48020) AND ea.source_type = 'oficial'
      ON CONFLICT DO NOTHING;
    END IF;
    
    IF podemos_party_id IS NOT NULL THEN
      INSERT INTO public.party_votes (electoral_act_id, party_id, votes)
      SELECT ea.id, podemos_party_id, 100
      FROM public.electoral_acts ea
      WHERE ea.municipality_idm IN (28079, 8019, 41091, 46250, 48020) AND ea.source_type = 'oficial'
      ON CONFLICT DO NOTHING;
    END IF;
    
  END IF;
END $$;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_electoral_acts_source_type ON public.electoral_acts(source_type);
CREATE INDEX IF NOT EXISTS idx_electoral_acts_municipality_district ON public.electoral_acts(municipality_idm, district);
CREATE INDEX IF NOT EXISTS idx_party_votes_electoral_act ON public.party_votes(electoral_act_id);
CREATE INDEX IF NOT EXISTS idx_mpca_ca ON public.mpca(ca);
CREATE INDEX IF NOT EXISTS idx_mpca_provincia ON public.mpca(provincia);
