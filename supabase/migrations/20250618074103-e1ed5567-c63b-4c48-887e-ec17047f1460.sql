
-- Recrear base de datos desde cero manteniendo solo la tabla MPCA
-- Eliminar todas las tablas excepto MPCA

-- Limpiar triggers y funciones
DROP TRIGGER IF EXISTS electoral_acts_audit_trigger ON public.electoral_acts;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.audit_electoral_acts();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.log_audit_action(text, text, uuid, jsonb, jsonb);

-- Eliminar todas las tablas excepto MPCA
DROP TABLE IF EXISTS public.party_votes CASCADE;
DROP TABLE IF EXISTS public.electoral_acts CASCADE;
DROP TABLE IF EXISTS public.party_suggestions CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.political_parties CASCADE;
DROP TABLE IF EXISTS public.elections CASCADE;

-- Eliminar vistas
DROP VIEW IF EXISTS public.electoral_acts_with_municipalities CASCADE;

-- Limpiar políticas RLS de MPCA y mantener solo acceso público de lectura
DROP POLICY IF EXISTS "Public can view municipalities" ON public.mpca;
CREATE POLICY "Public can view municipalities" ON public.mpca FOR SELECT USING (true);

-- 1. Crear tabla de Elecciones
CREATE TABLE public.elections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Crear tabla de Partidos Políticos
CREATE TABLE public.political_parties (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  siglas TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6B7280',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Crear tabla de Actas Electorales
CREATE TABLE public.electoral_acts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  election_id UUID REFERENCES public.elections(id),
  municipality_idm INTEGER REFERENCES public.mpca(idm),
  district TEXT NOT NULL,
  section TEXT NOT NULL,
  table_letter TEXT NOT NULL,
  census_total INTEGER NOT NULL,
  total_voters INTEGER NOT NULL,
  blank_votes INTEGER NOT NULL DEFAULT 0,
  null_votes INTEGER NOT NULL DEFAULT 0,
  source_type TEXT NOT NULL DEFAULT 'user',
  image_url TEXT,
  submitted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Crear tabla de Votos por Partido
CREATE TABLE public.party_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  electoral_act_id UUID REFERENCES public.electoral_acts(id) ON DELETE CASCADE,
  party_id TEXT REFERENCES public.political_parties(id),
  votes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Crear vista para consultas con información de municipios
CREATE VIEW public.electoral_acts_with_municipalities AS
SELECT 
  ea.*,
  m.municipio,
  m.provincia,
  m.ca as comunidad_autonoma
FROM public.electoral_acts ea
LEFT JOIN public.mpca m ON ea.municipality_idm = m.idm;

-- 6. Habilitar RLS en las nuevas tablas
ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.political_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electoral_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_votes ENABLE ROW LEVEL SECURITY;

-- 7. Crear políticas RLS para acceso público (sin autenticación requerida)
-- Elecciones: acceso público total
CREATE POLICY "Public access to elections" ON public.elections FOR ALL USING (true);

-- Partidos políticos: acceso público total
CREATE POLICY "Public access to political parties" ON public.political_parties FOR ALL USING (true);

-- Actas electorales: acceso público total
CREATE POLICY "Public access to electoral acts" ON public.electoral_acts FOR ALL USING (true);

-- Votos de partidos: acceso público total
CREATE POLICY "Public access to party votes" ON public.party_votes FOR ALL USING (true);

-- 8. Insertar datos iniciales

-- Insertar una elección activa
INSERT INTO public.elections (name, status) VALUES 
('Elecciones Generales 2023', 'active');

-- Insertar partidos políticos principales
INSERT INTO public.political_parties (id, name, siglas, color) VALUES 
('pp', 'Partido Popular', 'PP', '#0066CC'),
('psoe', 'Partido Socialista Obrero Español', 'PSOE', '#E30613'),
('vox', 'Vox', 'VOX', '#63BE21'),
('podemos', 'Podemos', 'PODEMOS', '#7B2D8E'),
('sumar', 'Sumar', 'SUMAR', '#F73E8C'),
('cs', 'Ciudadanos', 'Cs', '#FF6600'),
('erc', 'Esquerra Republicana de Catalunya', 'ERC', '#FFD700'),
('junts', 'Junts per Catalunya', 'Junts', '#00B2A0'),
('pnv', 'Partido Nacionalista Vasco', 'PNV', '#008000'),
('bildu', 'EH Bildu', 'Bildu', '#B4C430');
