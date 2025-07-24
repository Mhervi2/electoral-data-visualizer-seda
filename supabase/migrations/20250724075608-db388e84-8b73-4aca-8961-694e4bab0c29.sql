-- Create function to update timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create table for provincial seats management
CREATE TABLE public.provincial_seats (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    provincia TEXT NOT NULL,
    seats INTEGER NOT NULL CHECK (seats > 0),
    election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT unique_provincia_election UNIQUE(provincia, election_id)
);

-- Enable RLS
ALTER TABLE public.provincial_seats ENABLE ROW LEVEL SECURITY;

-- Create policies - only admins can manage provincial seats
CREATE POLICY "Only admins can manage provincial seats"
ON public.provincial_seats
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_admin = true
    )
);

-- Public can view provincial seats for calculations
CREATE POLICY "Public can view provincial seats"
ON public.provincial_seats
FOR SELECT
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_provincial_seats_updated_at
BEFORE UPDATE ON public.provincial_seats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default seats for Spanish provinces based on 2019 general election
INSERT INTO public.provincial_seats (provincia, seats, election_id) 
SELECT provincia, seats, NULL as election_id FROM (VALUES
    ('A Coruña', 8),
    ('Álava', 4),
    ('Albacete', 4),
    ('Alicante', 12),
    ('Almería', 6),
    ('Asturias', 8),
    ('Ávila', 3),
    ('Badajoz', 6),
    ('Balears, Illes', 8),
    ('Barcelona', 48),
    ('Burgos', 4),
    ('Cáceres', 4),
    ('Cádiz', 9),
    ('Cantabria', 5),
    ('Castellón', 5),
    ('Ciudad Real', 5),
    ('Córdoba', 6),
    ('Cuenca', 3),
    ('Girona', 6),
    ('Granada', 7),
    ('Guadalajara', 3),
    ('Guipúzcoa', 6),
    ('Huelva', 5),
    ('Huesca', 3),
    ('Jaén', 5),
    ('León', 4),
    ('Lleida', 4),
    ('La Rioja', 4),
    ('Lugo', 4),
    ('Madrid', 37),
    ('Málaga', 11),
    ('Murcia', 10),
    ('Navarra', 5),
    ('Ourense', 4),
    ('Palencia', 3),
    ('Las Palmas', 8),
    ('Pontevedra', 7),
    ('Salamanca', 4),
    ('Santa Cruz de Tenerife', 7),
    ('Segovia', 3),
    ('Sevilla', 12),
    ('Soria', 3),
    ('Tarragona', 6),
    ('Teruel', 3),
    ('Toledo', 5),
    ('Valencia', 16),
    ('Valladolid', 5),
    ('Vizcaya', 8),
    ('Zamora', 3),
    ('Zaragoza', 7),
    ('Ceuta', 1),
    ('Melilla', 1)
) AS default_seats(provincia, seats);