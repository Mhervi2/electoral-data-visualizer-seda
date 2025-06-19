
-- Create storage bucket for electoral files
INSERT INTO storage.buckets (id, name, public)
VALUES ('electoral-files', 'electoral-files', false);

-- Create policy for authenticated users to upload files
CREATE POLICY "Authenticated users can upload electoral files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'electoral-files' AND 
  auth.role() = 'authenticated'
);

-- Create policy for authenticated users to read files
CREATE POLICY "Authenticated users can read electoral files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'electoral-files' AND 
  auth.role() = 'authenticated'
);
