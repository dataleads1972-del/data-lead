import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface SourceConfig {
  enabled: boolean;
  config: Record<string, any>;
  secrets: Record<string, any>;
}

export async function getSourceConfig(sourceId: string): Promise<SourceConfig> {
  let dbRow: any = null;
  try {
    const { data, error } = await (supabaseAdmin as any)
      .from("source_integrations")
      .select("*")
      .eq("id", sourceId)
      .maybeSingle();
    if (!error && data) {
      dbRow = data;
    }
  } catch (e) {
    console.warn(`[source-config] Failed to fetch config for ${sourceId} from DB, using env fallback:`, e);
  }

  const config = dbRow?.config || {};
  const secrets = dbRow?.secrets || {};
  const isDbEnabled = dbRow?.config?.enabled !== false; // default true if not explicitly false

  switch (sourceId) {
    case "firecrawl": {
      const apiKey = secrets.apiKey || process.env.FIRECRAWL_API_KEY || "";
      return {
        enabled: isDbEnabled && !!apiKey,
        config: {},
        secrets: { apiKey },
      };
    }
    case "reddit": {
      const clientId = secrets.clientId || process.env.REDDIT_CLIENT_ID || "";
      const clientSecret = secrets.clientSecret || process.env.REDDIT_CLIENT_SECRET || "";
      return {
        enabled: isDbEnabled && (!!clientId && !!clientSecret),
        config: {},
        secrets: { clientId, clientSecret },
      };
    }
    case "threads": {
      const accessToken = secrets.accessToken || "";
      const appId = config.appId || process.env.THREADS_APP_ID || "";
      const appSecret = secrets.appSecret || process.env.THREADS_APP_SECRET || "";
      const redirectUri = config.redirectUri || process.env.THREADS_REDIRECT_URI || "";
      return {
        enabled: isDbEnabled && !!accessToken,
        config: { appId, redirectUri },
        secrets: { accessToken, appSecret },
      };
    }
    case "openstreetmap": {
      return {
        enabled: isDbEnabled,
        config: {},
        secrets: {},
      };
    }
    case "google-places": {
      const apiKey = secrets.apiKey || process.env.GOOGLE_PLACES_API_KEY || "";
      return {
        enabled: isDbEnabled && !!apiKey,
        config: {},
        secrets: { apiKey },
      };
    }
    case "youtube": {
      const apiKey = secrets.apiKey || process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY || "";
      return {
        enabled: isDbEnabled && !!apiKey,
        config: {},
        secrets: { apiKey },
      };
    }
    case "discourse": {
      const forumUrls = config.forumUrls || "";
      return {
        enabled: isDbEnabled,
        config: { forumUrls },
        secrets: {},
      };
    }
    case "rss": {
      const feedUrls = config.feedUrls || "";
      return {
        enabled: isDbEnabled,
        config: { feedUrls },
        secrets: {},
      };
    }
    case "hacker-news": {
      return {
        enabled: isDbEnabled,
        config: {},
        secrets: {},
      };
    }
    case "mastodon": {
      const accessToken = secrets.accessToken || "";
      const instanceUrl = config.instanceUrl || "mastodon.social";
      return {
        enabled: isDbEnabled,
        config: { instanceUrl },
        secrets: { accessToken },
      };
    }
    case "x": {
      const bearerToken = secrets.bearerToken || "";
      return {
        enabled: isDbEnabled && !!bearerToken,
        config: {},
        secrets: { bearerToken },
      };
    }
    default:
      return {
        enabled: false,
        config: {},
        secrets: {},
      };
  }
}
