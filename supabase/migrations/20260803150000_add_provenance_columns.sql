-- Add provenance and enrichment metadata tracking columns to leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS source_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS email_source TEXT,
ADD COLUMN IF NOT EXISTS phone_source TEXT,
ADD COLUMN IF NOT EXISTS website_source TEXT,
ADD COLUMN IF NOT EXISTS last_enriched_at TIMESTAMPTZ DEFAULT now();
