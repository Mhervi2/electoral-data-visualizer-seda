
-- Habilitar RLS en la tabla mpca si no está habilitado
ALTER TABLE public.mpca ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir lectura a todos los usuarios autenticados
CREATE POLICY "Allow authenticated users to read mpca data" 
ON public.mpca 
FOR SELECT 
TO authenticated 
USING (true);

-- Crear política para permitir lectura a usuarios anónimos (público)
-- Esto es útil si necesitas que los datos sean accesibles sin autenticación
CREATE POLICY "Allow public read access to mpca data" 
ON public.mpca 
FOR SELECT 
TO anon 
USING (true);

-- Opcional: Política para permitir a administradores insertar/actualizar datos
CREATE POLICY "Allow admins to manage mpca data" 
ON public.mpca 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);
