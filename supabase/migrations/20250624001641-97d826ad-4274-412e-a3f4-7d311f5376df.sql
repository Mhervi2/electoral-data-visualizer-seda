
-- Crear tabla para almacenar credenciales biométricas
CREATE TABLE public.biometric_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS
ALTER TABLE public.biometric_credentials ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo puedan acceder a sus propias credenciales
CREATE POLICY "Users can manage their own biometric credentials" 
  ON public.biometric_credentials 
  FOR ALL 
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Índice para búsquedas eficientes por email
CREATE INDEX idx_biometric_credentials_user_email ON public.biometric_credentials(user_email);
