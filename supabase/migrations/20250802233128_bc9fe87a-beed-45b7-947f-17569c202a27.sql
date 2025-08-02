-- Fase 1: Permitir edición de códigos territoriales en tabla mpca
-- Agregar políticas RLS para permitir a admins editar idca e idp

-- Crear política para permitir a administradores actualizar códigos territoriales
CREATE POLICY "Allow admins to update territorial codes" 
ON public.mpca 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Fase 2: Agregar campo mesa_identifier_full a electoral_acts
ALTER TABLE public.electoral_acts 
ADD COLUMN mesa_identifier_full text;

-- Crear índice para búsquedas eficientes del nuevo campo
CREATE INDEX IF NOT EXISTS idx_electoral_acts_mesa_identifier_full 
ON public.electoral_acts(mesa_identifier_full);

-- Comentario para documentar el formato del nuevo campo
COMMENT ON COLUMN public.electoral_acts.mesa_identifier_full IS 'Formato: XX-YY-ZZZ-DD-SSS-M donde XX=idca, YY=idp, ZZZ=idm(3 dígitos), DD=distrito, SSS=sección, M=mesa';