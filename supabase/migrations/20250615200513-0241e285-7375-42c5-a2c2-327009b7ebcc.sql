
-- Eliminar todas las políticas existentes del bucket electoral-acts
DROP POLICY IF EXISTS "Users can upload their own electoral act images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view electoral act images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own electoral act images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own electoral act images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads to electoral-acts bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous updates to electoral-acts bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous deletes from electoral-acts bucket" ON storage.objects;

-- Crear nueva política que permite a usuarios anónimos subir imágenes
CREATE POLICY "Allow anonymous uploads to electoral-acts bucket" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'electoral-acts'
  );

-- Crear política de lectura pública
CREATE POLICY "Public can view electoral act images" ON storage.objects
  FOR SELECT USING (bucket_id = 'electoral-acts');

-- Permitir actualizaciones anónimas
CREATE POLICY "Allow anonymous updates to electoral-acts bucket" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'electoral-acts'
  );

-- Permitir eliminaciones anónimas
CREATE POLICY "Allow anonymous deletes from electoral-acts bucket" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'electoral-acts'
  );
