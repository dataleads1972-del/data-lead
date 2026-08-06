-- AI Config Table (Central Admin Settings)
CREATE TABLE IF NOT EXISTS public.ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_provider TEXT NOT NULL DEFAULT 'xai',
  primary_model TEXT NOT NULL DEFAULT 'grok-2-latest',
  fallback_provider TEXT DEFAULT 'openrouter',
  fallback_model TEXT DEFAULT 'meta-llama/llama-3.3-70b-instruct',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.ai_config TO authenticated;
GRANT ALL ON public.ai_config TO service_role;
ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_config_read_authenticated" ON public.ai_config
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "ai_config_write_admin" ON public.ai_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default AI configuration if none exists
INSERT INTO public.ai_config (primary_provider, primary_model, fallback_provider, fallback_model, is_enabled)
SELECT 'xai', 'grok-2-latest', 'openrouter', 'meta-llama/llama-3.3-70b-instruct', true
WHERE NOT EXISTS (SELECT 1 FROM public.ai_config);

-- AI Analyses Table
CREATE TABLE IF NOT EXISTS public.ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_record_id TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  relevance TEXT NOT NULL DEFAULT 'uncertain',
  intent TEXT NOT NULL DEFAULT 'general_discussion',
  problem TEXT,
  need TEXT,
  buying_signal TEXT NOT NULL DEFAULT 'none',
  buying_stage TEXT NOT NULL DEFAULT 'unknown',
  sentiment TEXT NOT NULL DEFAULT 'neutral',
  urgency TEXT NOT NULL DEFAULT 'unknown',
  opportunity TEXT,
  scores JSONB DEFAULT '{}'::jsonb,
  lead_score INTEGER NOT NULL DEFAULT 0,
  confidence INTEGER NOT NULL DEFAULT 0,
  keywords JSONB DEFAULT '[]'::jsonb,
  reason TEXT NOT NULL,
  analysis_version INTEGER NOT NULL DEFAULT 1,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_analyses TO authenticated;
GRANT ALL ON public.ai_analyses TO service_role;
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_analyses_own" ON public.ai_analyses
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS ai_analyses_lead_idx ON public.ai_analyses(lead_id);
CREATE INDEX IF NOT EXISTS ai_analyses_hash_idx ON public.ai_analyses(source_record_id, content_hash);

-- Alter leads table to add quick AI status columns
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS ai_lead_score INTEGER,
  ADD COLUMN IF NOT EXISTS ai_intent TEXT,
  ADD COLUMN IF NOT EXISTS ai_buying_signal TEXT,
  ADD COLUMN IF NOT EXISTS ai_analyzed BOOLEAN DEFAULT false;
