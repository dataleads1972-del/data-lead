-- Upsert initial configuration rows for new intent sources
INSERT INTO public.source_integrations (id, status, config, secrets)
VALUES 
  ('discourse', 'not_configured', '{"enabled": true, "forumUrls": ""}'::jsonb, '{}'::jsonb),
  ('rss', 'not_configured', '{"enabled": true, "feedUrls": ""}'::jsonb, '{}'::jsonb),
  ('hacker-news', 'connected', '{"enabled": true}'::jsonb, '{}'::jsonb),
  ('mastodon', 'not_configured', '{"enabled": true, "instanceUrl": "mastodon.social"}'::jsonb, '{"accessToken": ""}'::jsonb),
  ('x', 'not_configured', '{"enabled": true}'::jsonb, '{"bearerToken": ""}'::jsonb)
ON CONFLICT (id) DO NOTHING;
