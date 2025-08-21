-- Create table for party province availability
CREATE TABLE public.party_provinces (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  party_id text NOT NULL,
  provincia text NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT party_provinces_party_id_fkey FOREIGN KEY (party_id) REFERENCES public.political_parties(id) ON DELETE CASCADE,
  CONSTRAINT party_provinces_unique UNIQUE (party_id, provincia)
);

-- Enable Row Level Security
ALTER TABLE public.party_provinces ENABLE ROW LEVEL SECURITY;

-- Create policies for party province management
CREATE POLICY "Public can view party provinces" 
ON public.party_provinces 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage party provinces" 
ON public.party_provinces 
FOR ALL 
USING (auth.role() = 'authenticated'::text)
WITH CHECK (auth.role() = 'authenticated'::text);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_party_provinces_updated_at
BEFORE UPDATE ON public.party_provinces
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();