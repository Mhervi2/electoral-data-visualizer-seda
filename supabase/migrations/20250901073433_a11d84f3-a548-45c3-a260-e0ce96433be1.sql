-- Create table for error reports
CREATE TABLE public.act_error_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  electoral_act_id UUID NOT NULL,
  reporter_name TEXT,
  reporter_email TEXT,
  error_types TEXT[] NOT NULL DEFAULT '{}',
  observations TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  admin_notes TEXT
);

-- Enable RLS
ALTER TABLE public.act_error_reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can create error reports" 
ON public.act_error_reports 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public can view their own reports" 
ON public.act_error_reports 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can update error reports" 
ON public.act_error_reports 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.is_admin = true
));

CREATE POLICY "Only admins can delete error reports" 
ON public.act_error_reports 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.is_admin = true
));

-- Add index for better performance
CREATE INDEX idx_act_error_reports_electoral_act_id ON public.act_error_reports(electoral_act_id);
CREATE INDEX idx_act_error_reports_status ON public.act_error_reports(status);