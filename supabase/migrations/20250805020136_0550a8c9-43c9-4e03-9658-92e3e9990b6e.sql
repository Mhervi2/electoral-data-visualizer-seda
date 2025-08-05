-- Add minimum_threshold column to elections table
ALTER TABLE public.elections 
ADD COLUMN minimum_threshold DECIMAL(4,2) NOT NULL DEFAULT 3.0;

-- Add comment for clarity
COMMENT ON COLUMN public.elections.minimum_threshold IS 'Minimum vote percentage required to obtain representation (e.g., 3.0 for 3%)';