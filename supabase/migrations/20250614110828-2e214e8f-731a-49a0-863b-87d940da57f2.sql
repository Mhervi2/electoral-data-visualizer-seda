
-- First, let's add an updated_at column to elections table for better tracking
ALTER TABLE public.elections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create audit logs table for tracking all administrative actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit_logs (only admins can view)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for electoral_acts (users can only see their own submissions unless admin)
ALTER TABLE public.electoral_acts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own electoral acts" ON public.electoral_acts
  FOR SELECT USING (
    auth.uid() = submitted_by OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Users can insert their own electoral acts" ON public.electoral_acts
  FOR INSERT WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Admins can view all electoral acts" ON public.electoral_acts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Create RLS policies for party_votes
ALTER TABLE public.party_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view party votes for their acts" ON public.party_votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.electoral_acts 
      WHERE id = party_votes.electoral_act_id 
      AND (submitted_by = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
    )
  );

CREATE POLICY "Users can insert party votes for their acts" ON public.party_votes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.electoral_acts 
      WHERE id = party_votes.electoral_act_id 
      AND submitted_by = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all party votes" ON public.party_votes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Create RLS policies for audit_logs (admin only)
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Only admins can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Create function to log audit actions
CREATE OR REPLACE FUNCTION public.log_audit_action(
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    p_action,
    p_table_name,
    p_record_id,
    p_old_values,
    p_new_values
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create storage bucket for electoral act images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('electoral-acts', 'electoral-acts', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for electoral act images
CREATE POLICY "Users can upload their own electoral act images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'electoral-acts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public can view electoral act images" ON storage.objects
  FOR SELECT USING (bucket_id = 'electoral-acts');

CREATE POLICY "Users can update their own electoral act images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'electoral-acts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own electoral act images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'electoral-acts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
