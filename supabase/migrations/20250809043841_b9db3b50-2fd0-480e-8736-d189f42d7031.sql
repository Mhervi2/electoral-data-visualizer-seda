-- Create table for political party provincial order
CREATE TABLE IF NOT EXISTS public.political_party_provincial_order (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provincia TEXT NOT NULL,
    party_id TEXT NOT NULL REFERENCES public.political_parties(id) ON DELETE CASCADE,
    order_position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(provincia, party_id),
    UNIQUE(provincia, order_position)
);

-- Enable RLS
ALTER TABLE public.political_party_provincial_order ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can manage party orders" ON public.political_party_provincial_order;
DROP POLICY IF EXISTS "Public can view party orders" ON public.political_party_provincial_order;

-- Create RLS policies
CREATE POLICY "Public can view party orders" 
ON public.political_party_provincial_order 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage party orders" 
ON public.political_party_provincial_order 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Add updated_at trigger
CREATE TRIGGER update_political_party_provincial_order_updated_at
    BEFORE UPDATE ON public.political_party_provincial_order
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();