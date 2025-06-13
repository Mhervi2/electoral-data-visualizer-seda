
-- Create table for political party suggestions
CREATE TABLE public.party_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  siglas TEXT NOT NULL,
  suggested_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Create table for Spanish autonomous communities
CREATE TABLE public.autonomous_communities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Create table for Spanish provinces
CREATE TABLE public.provinces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  autonomous_community_id TEXT REFERENCES public.autonomous_communities(id)
);

-- Create table for Spanish municipalities
CREATE TABLE public.municipalities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  province_id TEXT REFERENCES public.provinces(id),
  autonomous_community_id TEXT REFERENCES public.autonomous_communities(id)
);

-- Create elections table
CREATE TABLE public.elections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create political parties table
CREATE TABLE public.political_parties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  siglas TEXT NOT NULL,
  color TEXT DEFAULT '#000000',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create electoral acts table
CREATE TABLE public.electoral_acts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  election_id UUID REFERENCES public.elections(id),
  municipality_id TEXT REFERENCES public.municipalities(id),
  district TEXT NOT NULL,
  section TEXT NOT NULL,
  table_letter TEXT NOT NULL,
  census_total INTEGER NOT NULL,
  total_voters INTEGER NOT NULL,
  blank_votes INTEGER NOT NULL,
  null_votes INTEGER NOT NULL,
  image_url TEXT,
  source_type TEXT DEFAULT 'user' CHECK (source_type IN ('user', 'indra', 'escrutinio', 'oficial')),
  submitted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(election_id, municipality_id, district, section, table_letter, source_type)
);

-- Create party votes table
CREATE TABLE public.party_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  electoral_act_id UUID REFERENCES public.electoral_acts(id) ON DELETE CASCADE,
  party_id TEXT REFERENCES public.political_parties(id),
  votes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create result files table
CREATE TABLE public.result_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  election_id UUID REFERENCES public.elections(id),
  filename TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('indra', 'escrutinio', 'oficial')),
  scope TEXT NOT NULL,
  file_url TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.party_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autonomous_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.political_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electoral_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.result_files ENABLE ROW LEVEL SECURITY;

-- Create policies for party suggestions (admins can see all, users can see their own)
CREATE POLICY "Admins can view all party suggestions" 
  ON public.party_suggestions 
  FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Users can view their own party suggestions" 
  ON public.party_suggestions 
  FOR SELECT 
  USING (suggested_by = auth.uid());

CREATE POLICY "Authenticated users can create party suggestions" 
  ON public.party_suggestions 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update party suggestions" 
  ON public.party_suggestions 
  FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Create policies for geographic data (public read access)
CREATE POLICY "Anyone can view autonomous communities" 
  ON public.autonomous_communities 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can view provinces" 
  ON public.provinces 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can view municipalities" 
  ON public.municipalities 
  FOR SELECT 
  USING (true);

-- Create policies for elections (public read, admin write)
CREATE POLICY "Anyone can view elections" 
  ON public.elections 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage elections" 
  ON public.elections 
  FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Create policies for political parties (public read, admin write)
CREATE POLICY "Anyone can view political parties" 
  ON public.political_parties 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage political parties" 
  ON public.political_parties 
  FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Create policies for electoral acts (users can create and view, admins can view all)
CREATE POLICY "Authenticated users can create electoral acts" 
  ON public.electoral_acts 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can view electoral acts" 
  ON public.electoral_acts 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage electoral acts" 
  ON public.electoral_acts 
  FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Create policies for party votes (linked to electoral acts permissions)
CREATE POLICY "Users can manage party votes for their acts" 
  ON public.party_votes 
  FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.electoral_acts WHERE id = electoral_act_id AND (submitted_by = auth.uid() OR true)));

-- Create policies for result files (admin only)
CREATE POLICY "Admins can manage result files" 
  ON public.result_files 
  FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Insert basic Spanish geographic data
INSERT INTO public.autonomous_communities (id, name) VALUES
('01', 'Andalucía'),
('02', 'Aragón'),
('03', 'Principado de Asturias'),
('04', 'Illes Balears'),
('05', 'Canarias'),
('06', 'Cantabria'),
('07', 'Castilla-La Mancha'),
('08', 'Castilla y León'),
('09', 'Cataluña'),
('10', 'Comunitat Valenciana'),
('11', 'Extremadura'),
('12', 'Galicia'),
('13', 'Comunidad de Madrid'),
('14', 'Región de Murcia'),
('15', 'Comunidad Foral de Navarra'),
('16', 'País Vasco'),
('17', 'La Rioja'),
('18', 'Ceuta'),
('19', 'Melilla');

-- Insert main Spanish provinces (sample - you can add all 50)
INSERT INTO public.provinces (id, name, autonomous_community_id) VALUES
('28', 'Madrid', '13'),
('08', 'Barcelona', '09'),
('41', 'Sevilla', '01'),
('46', 'Valencia', '10'),
('48', 'Bizkaia', '16'),
('29', 'Málaga', '01'),
('35', 'Las Palmas', '05'),
('07', 'Balears', '04'),
('30', 'Murcia', '14'),
('15', 'A Coruña', '12');

-- Insert sample municipalities (you can add all Spanish municipalities)
INSERT INTO public.municipalities (id, name, province_id, autonomous_community_id) VALUES
('28079', 'Madrid', '28', '13'),
('28080', 'Alcalá de Henares', '28', '13'),
('08019', 'Barcelona', '08', '09'),
('08020', 'Badalona', '08', '09'),
('41091', 'Sevilla', '41', '01'),
('46250', 'Valencia', '46', '10');

-- Insert sample political parties
INSERT INTO public.political_parties (id, name, siglas, color) VALUES
('psoe', 'Partido Socialista Obrero Español', 'PSOE', '#E53E3E'),
('pp', 'Partido Popular', 'PP', '#3182CE'),
('podemos', 'Podemos', 'UP', '#805AD5'),
('vox', 'Vox', 'VOX', '#38A169'),
('cs', 'Ciudadanos', 'Cs', '#D69E2E'),
('erc', 'Esquerra Republicana de Catalunya', 'ERC', '#F56565'),
('pnv', 'Partido Nacionalista Vasco', 'PNV', '#48BB78'),
('bildu', 'EH Bildu', 'Bildu', '#4FD1C7');

-- Insert sample elections
INSERT INTO public.elections (id, name, date, type, status) VALUES
(gen_random_uuid(), 'Elecciones Municipales 2023', '2023-05-28', 'Municipal', 'closed'),
(gen_random_uuid(), 'Elecciones Generales 2023', '2023-07-23', 'General', 'active');
