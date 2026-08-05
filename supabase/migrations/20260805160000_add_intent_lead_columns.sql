-- Alter Searches table to add lead_type
ALTER TABLE public.searches 
ADD COLUMN IF NOT EXISTS lead_type TEXT DEFAULT 'business';

-- Alter Leads table to add intent-related columns
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS is_intent_lead BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS intent_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS matched_keyword TEXT,
ADD COLUMN IF NOT EXISTS post_author TEXT,
ADD COLUMN IF NOT EXISTS post_created_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS post_url TEXT,
ADD COLUMN IF NOT EXISTS source_platform TEXT,
ADD COLUMN IF NOT EXISTS post_title TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS leads_is_intent_lead_idx ON public.leads(is_intent_lead);
CREATE INDEX IF NOT EXISTS searches_lead_type_idx ON public.searches(lead_type);

-- Re-grant permissions to ensure any new columns are accessible
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.searches TO authenticated;
GRANT ALL ON public.leads, public.searches TO service_role;
