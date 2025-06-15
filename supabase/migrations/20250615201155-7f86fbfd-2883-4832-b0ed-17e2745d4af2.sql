
-- Eliminar las políticas RLS actuales de electoral_acts que requieren autenticación
DROP POLICY IF EXISTS "Users can view their own electoral acts" ON public.electoral_acts;
DROP POLICY IF EXISTS "Users can create their own electoral acts" ON public.electoral_acts;
DROP POLICY IF EXISTS "Users can update their own electoral acts" ON public.electoral_acts;
DROP POLICY IF EXISTS "Users can delete their own electoral acts" ON public.electoral_acts;

-- Crear nuevas políticas que permiten acceso anónimo
CREATE POLICY "Allow anonymous read access to electoral acts" 
ON public.electoral_acts 
FOR SELECT 
USING (true);

CREATE POLICY "Allow anonymous insert access to electoral acts" 
ON public.electoral_acts 
FOR INSERT 
WITH CHECK (true);

-- Eliminar las políticas RLS actuales de party_votes que requieren autenticación
DROP POLICY IF EXISTS "Users can view their own party votes" ON public.party_votes;
DROP POLICY IF EXISTS "Users can create their own party votes" ON public.party_votes;
DROP POLICY IF EXISTS "Users can update their own party votes" ON public.party_votes;
DROP POLICY IF EXISTS "Users can delete their own party votes" ON public.party_votes;

-- Crear nuevas políticas para party_votes que permiten acceso anónimo
CREATE POLICY "Allow anonymous read access to party votes" 
ON public.party_votes 
FOR SELECT 
USING (true);

CREATE POLICY "Allow anonymous insert access to party votes" 
ON public.party_votes 
FOR INSERT 
WITH CHECK (true);
