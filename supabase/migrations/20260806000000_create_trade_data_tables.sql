-- Trade Data Searches Table
CREATE TABLE IF NOT EXISTS public.trade_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'both',
  product_query TEXT,
  hs_code TEXT,
  company_query TEXT,
  origin_country TEXT,
  destination_country TEXT,
  results_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.trade_searches TO authenticated;
GRANT ALL ON public.trade_searches TO service_role;

ALTER TABLE public.trade_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trade_searches_own" ON public.trade_searches
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS trade_searches_user_idx ON public.trade_searches(user_id, created_at DESC);
