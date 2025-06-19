
-- Crear tabla para registrar votantes por correo
CREATE TABLE public.mail_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  electoral_act_id UUID REFERENCES public.electoral_acts(id) ON DELETE CASCADE,
  dni TEXT NOT NULL,
  first_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS pero con acceso público total (sin restricciones)
ALTER TABLE public.mail_votes ENABLE ROW LEVEL SECURITY;

-- Política de acceso público total para votantes por correo
CREATE POLICY "Public access to mail votes" ON public.mail_votes FOR ALL USING (true);

-- Crear índice para mejorar consultas por acta electoral
CREATE INDEX idx_mail_votes_electoral_act_id ON public.mail_votes(electoral_act_id);
