-- Create threads_connections table
CREATE TABLE IF NOT EXISTS public.threads_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  threads_user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Enable Row Level Security
ALTER TABLE public.threads_connections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "connections_view_own" ON public.threads_connections 
  FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "connections_delete_own" ON public.threads_connections 
  FOR DELETE TO authenticated 
  USING (auth.uid() = user_id);

-- Grant privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON public.threads_connections TO authenticated;
GRANT ALL ON public.threads_connections TO service_role;
