-- Add is_visible field to elections table to control visibility in dropdowns
ALTER TABLE public.elections 
ADD COLUMN is_visible boolean NOT NULL DEFAULT true;