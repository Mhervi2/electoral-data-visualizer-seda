-- Add observations field to electoral_acts table
ALTER TABLE public.electoral_acts 
ADD COLUMN observations text;