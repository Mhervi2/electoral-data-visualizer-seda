-- Create table for storing municipality resolution decisions (learning system)
CREATE TABLE IF NOT EXISTS public.municipality_resolutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_name TEXT NOT NULL,
  resolved_idm INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(original_name)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_municipality_resolutions_original_name 
ON public.municipality_resolutions(original_name);

-- Create index for municipality reference
CREATE INDEX IF NOT EXISTS idx_municipality_resolutions_resolved_idm 
ON public.municipality_resolutions(resolved_idm);

-- Enable RLS
ALTER TABLE public.municipality_resolutions ENABLE ROW LEVEL SECURITY;

-- Create policies for municipality resolutions
CREATE POLICY "Municipality resolutions are viewable by authenticated users" 
ON public.municipality_resolutions 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Municipality resolutions can be created by authenticated users" 
ON public.municipality_resolutions 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Municipality resolutions can be updated by authenticated users" 
ON public.municipality_resolutions 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Add foreign key constraint (soft reference to mpca table)
-- Note: We don't add a strict foreign key because mpca.idm might not have one, 
-- but we add a comment for documentation
COMMENT ON COLUMN public.municipality_resolutions.resolved_idm IS 'References mpca.idm - the municipality that was resolved to';