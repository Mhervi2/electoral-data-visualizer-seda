
-- Insertar datos en la tabla mpca (municipios, provincias, comunidades autónomas)
INSERT INTO public.mpca (idm, municipio, provincia, ca, idp, idca) VALUES
  (28079, 'Madrid', 'Madrid', 'Comunidad de Madrid', 28, 13),
  (8019, 'Barcelona', 'Barcelona', 'Cataluña', 8, 9),
  (41091, 'Sevilla', 'Sevilla', 'Andalucía', 41, 1),
  (46250, 'Valencia', 'Valencia', 'Comunitat Valenciana', 46, 10),
  (48020, 'Bilbao', 'Bizkaia', 'País Vasco', 48, 16),
  (29067, 'Málaga', 'Málaga', 'Andalucía', 29, 1),
  (35016, 'Las Palmas de Gran Canaria', 'Las Palmas', 'Canarias', 35, 5),
  (7040, 'Palma', 'Balears', 'Illes Balears', 7, 4),
  (30030, 'Murcia', 'Murcia', 'Región de Murcia', 30, 14),
  (15030, 'A Coruña', 'A Coruña', 'Galicia', 15, 12),
  (33044, 'Oviedo', 'Asturias', 'Principado de Asturias', 33, 3),
  (39075, 'Santander', 'Cantabria', 'Cantabria', 39, 6),
  (26089, 'Logroño', 'La Rioja', 'La Rioja', 26, 17),
  (31201, 'Pamplona', 'Navarra', 'Comunidad Foral de Navarra', 31, 15),
  (6015, 'Badajoz', 'Badajoz', 'Extremadura', 6, 11),
  (10037, 'Cáceres', 'Cáceres', 'Extremadura', 10, 11),
  (2003, 'Albacete', 'Albacete', 'Castilla-La Mancha', 2, 7),
  (13034, 'Ciudad Real', 'Ciudad Real', 'Castilla-La Mancha', 13, 7),
  (16078, 'Cuenca', 'Cuenca', 'Castilla-La Mancha', 16, 7),
  (19130, 'Guadalajara', 'Guadalajara', 'Castilla-La Mancha', 19, 7),
  (45168, 'Toledo', 'Toledo', 'Castilla-La Mancha', 45, 7),
  (5019, 'Ávila', 'Ávila', 'Castilla y León', 5, 8),
  (9059, 'Burgos', 'Burgos', 'Castilla y León', 9, 8),
  (24089, 'León', 'León', 'Castilla y León', 24, 8),
  (34120, 'Palencia', 'Palencia', 'Castilla y León', 34, 8),
  (37274, 'Salamanca', 'Salamanca', 'Castilla y León', 37, 8),
  (40194, 'Segovia', 'Segovia', 'Castilla y León', 40, 8),
  (42173, 'Soria', 'Soria', 'Castilla y León', 42, 8),
  (47186, 'Valladolid', 'Valladolid', 'Castilla y León', 47, 8),
  (49275, 'Zamora', 'Zamora', 'Castilla y León', 49, 8),
  (22125, 'Huesca', 'Huesca', 'Aragón', 22, 2),
  (44216, 'Teruel', 'Teruel', 'Aragón', 44, 2),
  (50297, 'Zaragoza', 'Zaragoza', 'Aragón', 50, 2),
  (17079, 'Girona', 'Girona', 'Cataluña', 17, 9),
  (25120, 'Lleida', 'Lleida', 'Cataluña', 25, 9),
  (43148, 'Tarragona', 'Tarragona', 'Cataluña', 43, 9),
  (3014, 'Alicante/Alacant', 'Alicante/Alacant', 'Comunitat Valenciana', 3, 10),
  (12040, 'Castellón de la Plana/Castelló de la Plana', 'Castellón/Castelló', 'Comunitat Valenciana', 12, 10),
  (27028, 'Lugo', 'Lugo', 'Galicia', 27, 12),
  (32054, 'Ourense', 'Ourense', 'Galicia', 32, 12),
  (36057, 'Pontevedra', 'Pontevedra', 'Galicia', 36, 12),
  (1059, 'Vitoria-Gasteiz', 'Araba/Álava', 'País Vasco', 1, 16),
  (20069, 'Donostia/San Sebastián', 'Gipuzkoa', 'País Vasco', 20, 16),
  (51001, 'Ceuta', 'Ceuta', 'Ceuta', 51, 18),
  (52001, 'Melilla', 'Melilla', 'Melilla', 52, 19)
ON CONFLICT (idm) DO NOTHING;

-- Actualizar partidos políticos existentes con colores
UPDATE public.political_parties SET color = '#3182CE' WHERE id = 'pp';
UPDATE public.political_parties SET color = '#E53E3E' WHERE id = 'psoe';
UPDATE public.political_parties SET color = '#38A169' WHERE id = 'vox';
UPDATE public.political_parties SET color = '#805AD5' WHERE id = 'podemos';
UPDATE public.political_parties SET color = '#D69E2E' WHERE id = 'cs';
UPDATE public.political_parties SET color = '#2B6CB0' WHERE id = 'sumar';

-- Insertar partidos adicionales si no existen
INSERT INTO public.political_parties (id, name, siglas, color) VALUES
  ('erc', 'Esquerra Republicana de Catalunya', 'ERC', '#F56565'),
  ('pnv', 'Partido Nacionalista Vasco', 'PNV', '#48BB78'),
  ('bildu', 'EH Bildu', 'Bildu', '#4FD1C7'),
  ('junts', 'Junts per Catalunya', 'Junts', '#9F7AEA'),
  ('mas-pais', 'Más País', 'MP', '#68D391'),
  ('cup', 'Candidatura d''Unitat Popular', 'CUP', '#F687B3'),
  ('bng', 'Bloque Nacionalista Galego', 'BNG', '#4299E1'),
  ('cc', 'Coalición Canaria', 'CC', '#ED8936')
ON CONFLICT (id) DO NOTHING;

-- Crear vista para actas electorales con municipios si no existe
CREATE OR REPLACE VIEW public.electoral_acts_with_municipalities AS
SELECT 
  ea.*,
  m.municipio,
  m.provincia,
  m.ca as comunidad_autonoma
FROM public.electoral_acts ea
LEFT JOIN public.mpca m ON ea.municipality_idm = m.idm;

-- Insertar datos de ejemplo para actas electorales
DO $$
DECLARE
  election_id uuid;
BEGIN
  -- Obtener el ID de la primera elección activa
  SELECT id INTO election_id FROM public.elections WHERE status = 'active' LIMIT 1;
  
  IF election_id IS NOT NULL THEN
    -- Insertar actas electorales de ejemplo
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
    
    -- Insertar votos de partidos para las actas
    INSERT INTO public.party_votes (electoral_act_id, party_id, votes)
    SELECT ea.id, 'pp', 200
    FROM public.electoral_acts ea
    WHERE ea.municipality_idm IN (28079, 8019, 41091, 46250, 48020) AND ea.source_type = 'oficial'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.party_votes (electoral_act_id, party_id, votes)
    SELECT ea.id, 'psoe', 180
    FROM public.electoral_acts ea
    WHERE ea.municipality_idm IN (28079, 8019, 41091, 46250, 48020) AND ea.source_type = 'oficial'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.party_votes (electoral_act_id, party_id, votes)
    SELECT ea.id, 'vox', 120
    FROM public.electoral_acts ea
    WHERE ea.municipality_idm IN (28079, 8019, 41091, 46250, 48020) AND ea.source_type = 'oficial'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.party_votes (electoral_act_id, party_id, votes)
    SELECT ea.id, 'podemos', 100
    FROM public.electoral_acts ea
    WHERE ea.municipality_idm IN (28079, 8019, 41091, 46250, 48020) AND ea.source_type = 'oficial'
    ON CONFLICT DO NOTHING;
    
  END IF;
END $$;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_electoral_acts_source_type ON public.electoral_acts(source_type);
CREATE INDEX IF NOT EXISTS idx_electoral_acts_municipality_district ON public.electoral_acts(municipality_idm, district);
CREATE INDEX IF NOT EXISTS idx_party_votes_electoral_act ON public.party_votes(electoral_act_id);
CREATE INDEX IF NOT EXISTS idx_mpca_ca ON public.mpca(ca);
CREATE INDEX IF NOT EXISTS idx_mpca_provincia ON public.mpca(provincia);

-- Habilitar RLS en las tablas
ALTER TABLE public.mpca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.political_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electoral_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_votes ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS básicas para permitir acceso público a datos de lectura
DO $$
BEGIN
  -- Eliminar políticas existentes si existen
  DROP POLICY IF EXISTS "Anyone can view mpca data" ON public.mpca;
  DROP POLICY IF EXISTS "Anyone can view political parties" ON public.political_parties;
  DROP POLICY IF EXISTS "Anyone can view elections" ON public.elections;
  DROP POLICY IF EXISTS "Anyone can view electoral acts" ON public.electoral_acts;
  DROP POLICY IF EXISTS "Anyone can view party votes" ON public.party_votes;
  DROP POLICY IF EXISTS "Anyone can insert electoral acts" ON public.electoral_acts;
  DROP POLICY IF EXISTS "Anyone can insert party votes" ON public.party_votes;
  
  -- Crear nuevas políticas
  CREATE POLICY "Anyone can view mpca data" ON public.mpca FOR SELECT USING (true);
  CREATE POLICY "Anyone can view political parties" ON public.political_parties FOR SELECT USING (true);
  CREATE POLICY "Anyone can view elections" ON public.elections FOR SELECT USING (true);
  CREATE POLICY "Anyone can view electoral acts" ON public.electoral_acts FOR SELECT USING (true);
  CREATE POLICY "Anyone can view party votes" ON public.party_votes FOR SELECT USING (true);
  CREATE POLICY "Anyone can insert electoral acts" ON public.electoral_acts FOR INSERT WITH CHECK (true);
  CREATE POLICY "Anyone can insert party votes" ON public.party_votes FOR INSERT WITH CHECK (true);
END $$;
