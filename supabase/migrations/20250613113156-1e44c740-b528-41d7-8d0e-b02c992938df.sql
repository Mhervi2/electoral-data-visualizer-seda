
-- Crear tabla de comunidades autónomas
CREATE TABLE public.autonomous_communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de provincias
CREATE TABLE public.provinces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  autonomous_community_id UUID REFERENCES public.autonomous_communities(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de municipios
CREATE TABLE public.municipalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  province_id UUID REFERENCES public.provinces(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de partidos políticos
CREATE TABLE public.political_parties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  siglas TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6B7280',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de elecciones
CREATE TABLE public.elections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de perfiles de usuario
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de actas electorales
CREATE TABLE public.electoral_acts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID REFERENCES public.elections(id),
  municipality_id UUID REFERENCES public.municipalities(id),
  district TEXT NOT NULL,
  section TEXT NOT NULL,
  table_letter TEXT NOT NULL,
  census_total INTEGER NOT NULL,
  total_voters INTEGER NOT NULL,
  blank_votes INTEGER NOT NULL DEFAULT 0,
  null_votes INTEGER NOT NULL DEFAULT 0,
  source_type TEXT NOT NULL,
  image_url TEXT,
  submitted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de votos por partido
CREATE TABLE public.party_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  electoral_act_id UUID REFERENCES public.electoral_acts(id) ON DELETE CASCADE,
  party_id TEXT REFERENCES public.political_parties(id),
  votes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de sugerencias de partidos
CREATE TABLE public.party_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  siglas TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  suggested_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electoral_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_votes ENABLE ROW LEVEL SECURITY;

-- Políticas para perfiles (solo pueden ver su propio perfil)
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para sugerencias de partidos
CREATE POLICY "Users can view all party suggestions" ON public.party_suggestions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create party suggestions" ON public.party_suggestions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = suggested_by);

CREATE POLICY "Admins can update party suggestions" ON public.party_suggestions
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Políticas para actas electorales
CREATE POLICY "Users can view all electoral acts" ON public.electoral_acts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create electoral acts" ON public.electoral_acts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = submitted_by);

-- Políticas para votos por partido
CREATE POLICY "Users can view all party votes" ON public.party_votes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create party votes" ON public.party_votes
  FOR INSERT TO authenticated WITH CHECK (true);

-- Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_admin)
  VALUES (
    new.id,
    new.email,
    new.email = 'admin@seda.es'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insertar algunos datos de ejemplo
INSERT INTO public.autonomous_communities (name) VALUES 
  ('Andalucía'),
  ('Aragón'),
  ('Asturias'),
  ('Islas Baleares'),
  ('Canarias'),
  ('Cantabria'),
  ('Castilla-La Mancha'),
  ('Castilla y León'),
  ('Cataluña'),
  ('Comunidad Valenciana'),
  ('Extremadura'),
  ('Galicia'),
  ('Madrid'),
  ('Murcia'),
  ('Navarra'),
  ('País Vasco'),
  ('La Rioja');

-- Insertar algunos partidos políticos de ejemplo
INSERT INTO public.political_parties (id, name, siglas, color) VALUES 
  ('pp', 'Partido Popular', 'PP', '#0066CC'),
  ('psoe', 'Partido Socialista Obrero Español', 'PSOE', '#E30613'),
  ('vox', 'Vox', 'VOX', '#63BE21'),
  ('podemos', 'Podemos', 'PODEMOS', '#7B2D8E'),
  ('cs', 'Ciudadanos', 'Cs', '#FF6600'),
  ('sumar', 'Sumar', 'SUMAR', '#F73E8C');

-- Insertar una elección de ejemplo
INSERT INTO public.elections (name, status) VALUES 
  ('Elecciones Generales 2023', 'active');
