-- Create source_integrations table
CREATE TABLE IF NOT EXISTS public.source_integrations (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'not_configured',
  config JSONB NOT NULL DEFAULT '{"enabled": true}'::jsonb,
  secrets JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.source_integrations ENABLE ROW LEVEL SECURITY;

-- Admins manage integrations policy
CREATE POLICY admins_manage_integrations ON public.source_integrations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Grant access to authenticated users (admins can read/write, normal users won't match policy so they read nothing)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.source_integrations TO authenticated;
GRANT ALL ON public.source_integrations TO service_role;

-- Insert initial source rows
INSERT INTO public.source_integrations (id, status, config)
VALUES 
  ('firecrawl', 'not_configured', '{"enabled": true}'::jsonb),
  ('reddit', 'not_configured', '{"enabled": true}'::jsonb),
  ('threads', 'not_configured', '{"enabled": true}'::jsonb),
  ('openstreetmap', 'connected', '{"enabled": true}'::jsonb),
  ('google-places', 'not_configured', '{"enabled": true}'::jsonb)
ON CONFLICT (id) DO NOTHING;
