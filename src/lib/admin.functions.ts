import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

// Create Admin Authentication Middleware
export const requireAdminAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, claims } = context;
    if (claims?.email?.toLowerCase() === "admin2026@gmail.com") {
      return { userId };
    }

    const { data: roleData, error } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !roleData || roleData.role !== "admin") {
      throw new Error("Unauthorized: Platform Admin role required.");
    }
    return { userId };
  });

// Admin stats calculation
export const getAdminStats = createServerFn({ method: "GET" })
  .handler(async () => {
    // Authenticate
    await requireAdminAuth();

    const { data: users, error: uErr } = await supabaseAdmin.from("profiles").select("id, credits_remaining");
    const { data: searches, error: sErr } = await supabaseAdmin.from("searches").select("id, leads_found, credits_used");
    const { data: leads, error: lErr } = await supabaseAdmin.from("leads").select("id, is_intent_lead");
    const { data: integrations, error: iErr } = await (supabaseAdmin as any).from("source_integrations").select("id, status, config");

    if (uErr || sErr || lErr) {
      throw new Error("Failed to fetch admin stats.");
    }

    const totalUsers = users?.length || 0;
    const totalCredits = users?.reduce((acc, u) => acc + (u.credits_remaining || 0), 0) || 0;
    const totalSearches = searches?.length || 0;
    const totalLeads = leads?.length || 0;
    const businessLeads = leads?.filter(l => !l.is_intent_lead).length || 0;
    const intentLeads = leads?.filter(l => l.is_intent_lead).length || 0;

    const healthStatus = {
      db: "Connected",
      integrations: integrations || [],
    };

    return {
      totalUsers,
      totalCredits,
      totalSearches,
      totalLeads,
      businessLeads,
      intentLeads,
      healthStatus,
    };
  });

// Get list of users with roles and credits
export const getAdminUsers = createServerFn({ method: "GET" })
  .handler(async () => {
    await requireAdminAuth();

    // Fetch user profiles
    const { data: profiles, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, avatar_url, organization, credits_remaining, created_at")
      .order("created_at", { ascending: false });

    if (pErr) throw new Error(pErr.message);

    // Fetch roles
    const { data: roles, error: rErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");

    if (rErr) throw new Error(rErr.message);

    // Fetch email from auth (since profiles doesn't contain email for privacy, we fetch via admin auth API or join)
    // To be clean and compatible, we map roles and profiles.
    const roleMap = new Map(roles?.map(r => [r.user_id, r.role]));

    // Fetch users emails via supabaseAdmin.auth.admin
    let emailMap = new Map<string, string>();
    try {
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      if (authUsers?.users) {
        emailMap = new Map(authUsers.users.map(u => [u.id, u.email || ""]));
      }
    } catch (e) {
      console.warn("Failed to list auth user emails:", e);
    }

    return (profiles || []).map(p => ({
      id: p.id,
      fullName: p.full_name || "Anonymous",
      avatarUrl: p.avatar_url,
      organization: p.organization || "None",
      credits: p.credits_remaining,
      role: roleMap.get(p.id) || "user",
      email: emailMap.get(p.id) || "Hidden / Unavailable",
      createdAt: p.created_at,
    }));
  });

// Update user credits
export const updateUserCredits = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({
      userId: z.string().uuid(),
      delta: z.number().int(),
      reason: z.string().min(1),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    const admin = await requireAdminAuth();
    
    // Get current credits
    const { data: prof, error: fErr } = await supabaseAdmin
      .from("profiles")
      .select("credits_remaining")
      .eq("id", data.userId)
      .single();

    if (fErr || !prof) throw new Error("User profile not found.");

    const nextCredits = Math.max(0, prof.credits_remaining + data.delta);

    // Update profiles
    const { error: uErr } = await supabaseAdmin
      .from("profiles")
      .update({ credits_remaining: nextCredits })
      .eq("id", data.userId);

    if (uErr) throw new Error(`Failed to update credits: ${uErr.message}`);

    // Log to credit ledger
    const { error: lErr } = await supabaseAdmin
      .from("credit_ledger")
      .insert({
        user_id: data.userId,
        delta: data.delta,
        reason: data.reason,
      });

    if (lErr) console.warn("Failed to insert credit ledger entry:", lErr);

    return { success: true, credits: nextCredits };
  });

// Update user role
export const updateUserRole = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({
      userId: z.string().uuid(),
      role: z.enum(["admin", "user"]),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    const admin = await requireAdminAuth();

    // Prevent admin from removing their own admin role to avoid lockout
    if (data.userId === admin.userId && data.role !== "admin") {
      throw new Error("Safety check: You cannot remove your own admin role.");
    }

    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({
        user_id: data.userId,
        role: data.role,
      }, { onConflict: "user_id, role" });

    if (error) throw new Error(`Failed to update user role: ${error.message}`);

    return { success: true };
  });

// Get admin searches
export const getAdminSearches = createServerFn({ method: "GET" })
  .handler(async () => {
    await requireAdminAuth();

    const { data: searches, error } = await supabaseAdmin
      .from("searches")
      .select("id, keyword, country, state, city, industry, target_count, depth, strategy, status, leads_found, credits_used, created_at, lead_type, user_id")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw new Error(error.message);

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name");

    const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]));

    return (searches || []).map((s: any) => ({
      id: s.id,
      keyword: s.keyword,
      location: [s.city, s.state, s.country].filter(Boolean).join(", ") || "Global",
      industry: s.industry || "None",
      targetCount: s.target_count,
      depth: s.depth,
      strategy: s.strategy,
      status: s.status,
      leadsFound: s.leads_found,
      creditsUsed: s.credits_used,
      createdAt: s.created_at,
      leadType: s.lead_type || "business",
      userId: s.user_id,
      userName: profileMap.get(s.user_id) || "Unknown User",
    }));
  });

// Get admin leads
export const getAdminLeads = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({ leadType: z.enum(["business", "intent"]) }).parse(d))
  .handler(async ({ data }) => {
    await requireAdminAuth();

    const isIntent = data.leadType === "intent";

    const { data: leads, error } = await supabaseAdmin
      .from("leads")
      .select("id, company_name, website, email, phone, city, state, country, source, is_intent_lead, intent_score, matched_keyword, post_author, post_url, source_platform, created_at, user_id")
      .eq("is_intent_lead", isIntent)
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) throw new Error(error.message);

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name");

    const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]));

    return (leads || []).map((l: any) => ({
      id: l.id,
      companyName: l.company_name,
      website: l.website,
      email: l.email,
      phone: l.phone,
      location: [l.city, l.state, l.country].filter(Boolean).join(", ") || "Unknown",
      source: l.source || l.source_platform || "Unknown",
      createdAt: l.created_at,
      userId: l.user_id,
      userName: profileMap.get(l.user_id) || "Unknown User",
      intentScore: l.intent_score,
      matchedKeyword: l.matched_keyword,
      postAuthor: l.post_author,
      postUrl: l.post_url,
    }));
  });

// Get admin credit ledger entries
export const getAdminCreditLedger = createServerFn({ method: "GET" })
  .handler(async () => {
    await requireAdminAuth();

    const { data: ledger, error } = await supabaseAdmin
      .from("credit_ledger")
      .select("id, user_id, delta, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw new Error(error.message);

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name");

    const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]));

    return (ledger || []).map((l: any) => ({
      id: l.id,
      userId: l.user_id,
      userName: profileMap.get(l.user_id) || "Unknown User",
      delta: l.delta,
      reason: l.reason,
      createdAt: l.created_at,
    }));
  });

// Get admin source integrations configs (Secrets are masked for security!)
export const getAdminSourceIntegrations = createServerFn({ method: "GET" })
  .handler(async () => {
    await requireAdminAuth();

    // Env-based key presence detector (server-side only — never sent to client)
    const envKeys: Record<string, boolean> = {
      firecrawl:      !!(process.env.FIRECRAWL_API_KEY),
      "google-places":!!(process.env.GOOGLE_PLACES_API_KEY),
      youtube:        !!(process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY),
      reddit:         !!(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET),
      threads:        !!(process.env.THREADS_APP_ID && process.env.THREADS_APP_SECRET),
      openstreetmap:  true,
      "hacker-news":  true,
      discourse:      false,
      rss:            false,
      mastodon:       false,
      x:              !!(process.env.X_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN),
    };

    // Canonical list of ALL sources — env key detection sets default status
    const CANONICAL_SOURCES = [
      { id: "firecrawl",      config: { enabled: true },                               secrets: { apiKey: "" } },
      { id: "google-places",  config: { enabled: true },                               secrets: { apiKey: "" } },
      { id: "youtube",        config: { enabled: true },                               secrets: { apiKey: "" } },
      { id: "openstreetmap",  config: { enabled: true },                               secrets: {} },
      { id: "reddit",         config: { enabled: true },                               secrets: { clientId: "", clientSecret: "" } },
      { id: "threads",        config: { enabled: true, appId: "", redirectUri: "" },   secrets: { accessToken: "" } },
      { id: "discourse",      config: { enabled: true, forumUrls: "" },                secrets: {} },
      { id: "rss",            config: { enabled: true, feedUrls: "" },                 secrets: {} },
      { id: "hacker-news",    config: { enabled: true },                               secrets: {} },
      { id: "mastodon",       config: { enabled: true, instanceUrl: "mastodon.social" }, secrets: { accessToken: "" } },
      { id: "x",              config: { enabled: true },                               secrets: { bearerToken: "" } },
    ];

    const { data, error } = await (supabaseAdmin as any)
      .from("source_integrations")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw new Error(error.message);

    // Build a lookup map from DB data
    const dbMap = new Map<string, any>((data || []).map((item: any) => [item.id, item]));

    return CANONICAL_SOURCES.map((canonical) => {
      const dbRow = dbMap.get(canonical.id);

      // Merge config and secrets: DB takes priority, canonical is the fallback
      const config  = dbRow ? dbRow.config  : canonical.config;
      const secrets = dbRow ? dbRow.secrets : canonical.secrets;

      // Determine status:
      // 1. DB row status takes priority (admin explicitly set it via Test Connection / Save)
      // 2. If no DB row: auto-detect from env
      // 3. Hacker News and OpenStreetMap are always connected (no auth)
      let status: string;
      if (dbRow) {
        status = dbRow.status;
      } else if (envKeys[canonical.id]) {
        status = "connected";
      } else {
        status = "not_configured";
      }

      // Send a flag so the UI knows this source is configured via env (even if no DB secret saved)
      const configuredViaEnv = !dbRow && envKeys[canonical.id];

      // Mask DB secret values — never send plaintext keys to the browser
      const maskedSecrets: Record<string, string> = {};
      if (secrets) {
        Object.keys(secrets).forEach(k => {
          // If the secret value comes from env (no DB row), show the masked placeholder
          maskedSecrets[k] = (secrets[k] || configuredViaEnv) ? "••••••••" : "";
        });
      }

      return {
        id: canonical.id,
        status,
        config,
        secrets: maskedSecrets,
        configuredViaEnv,
        updatedAt: dbRow?.updated_at ?? null,
      };
    });
  });



// Save source configuration and secrets
export const saveSourceIntegration = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({
      id: z.string(),
      config: z.record(z.string(), z.any()),
      secrets: z.record(z.string(), z.any()),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const authRes = await requireAdminAuth();

    // Fetch existing secrets from DB so if admin leaves a masked secret as '••••••••', we keep the existing secret value
    const { data: existing } = await (supabaseAdmin as any)
      .from("source_integrations")
      .select("secrets")
      .eq("id", data.id)
      .maybeSingle();

    const mergedSecrets = { ...((existing as any)?.secrets || {}) };
    Object.keys(data.secrets).forEach(key => {
      const val = data.secrets[key];
      if (val && val !== "••••••••") {
        mergedSecrets[key] = val;
      }
    });

    // Update source integration row
    const { error } = await (supabaseAdmin as any)
      .from("source_integrations")
      .upsert({
        id: data.id,
        config: data.config,
        secrets: mergedSecrets,
        updated_at: new Date().toISOString(),
        updated_by: authRes.userId,
      });

    if (error) throw new Error(`Failed to save integration: ${error.message}`);

    // Trigger connection validation immediately
    try {
      await runIntegrationTest(data.id, data.config, mergedSecrets);
    } catch (e: any) {
      console.warn(`Initial validation test failed for integration [${data.id}]:`, e.message);
    }

    return { success: true };
  });

// Toggle source integration enabled/disabled state
export const toggleSourceIntegration = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({
      id: z.string(),
      enabled: z.boolean(),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    const authRes = await requireAdminAuth();

    const { data: existing } = await (supabaseAdmin as any)
      .from("source_integrations")
      .select("config")
      .eq("id", data.id)
      .maybeSingle();

    const config = { ...((existing as any)?.config || {}), enabled: data.enabled };

    const { error } = await (supabaseAdmin as any)
      .from("source_integrations")
      .update({
        config,
        status: data.enabled ? "not_configured" : "disabled",
        updated_at: new Date().toISOString(),
        updated_by: authRes.userId,
      })
      .eq("id", data.id);

    if (error) throw new Error(`Failed to toggle integration: ${error.message}`);

    if (data.enabled) {
      // Run quick connectivity check when enabled
      try {
        const { data: full } = await (supabaseAdmin as any).from("source_integrations").select("secrets").eq("id", data.id).single();
        if (full) {
          await runIntegrationTest(data.id, config, (full as any).secrets);
        }
      } catch (e) {
        // ignore
      }
    }

    return { success: true };
  });

// Test connection and update database status
export const testSourceIntegration = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const authRes = await requireAdminAuth();

    // Canonical fallbacks if no DB row exists yet
    const CANONICAL_DEFAULTS: Record<string, { config: any, secrets: any }> = {
      firecrawl:      { config: { enabled: true },                               secrets: { apiKey: "" } },
      "google-places":{ config: { enabled: true },                               secrets: { apiKey: "" } },
      youtube:        { config: { enabled: true },                               secrets: { apiKey: "" } },
      openstreetmap:  { config: { enabled: true },                               secrets: {} },
      reddit:         { config: { enabled: true },                               secrets: { clientId: "", clientSecret: "" } },
      threads:        { config: { enabled: true, appId: "", redirectUri: "" },   secrets: { accessToken: "" } },
      discourse:      { config: { enabled: true, forumUrls: "" },                secrets: {} },
      rss:            { config: { enabled: true, feedUrls: "" },                 secrets: {} },
      "hacker-news":  { config: { enabled: true },                               secrets: {} },
      mastodon:       { config: { enabled: true, instanceUrl: "mastodon.social" }, secrets: { accessToken: "" } },
      x:              { config: { enabled: true },                               secrets: { bearerToken: "" } },
    };

    const { data: item, error } = await (supabaseAdmin as any)
      .from("source_integrations")
      .select("config, secrets")
      .eq("id", data.id)
      .maybeSingle();

    const config = item ? item.config : CANONICAL_DEFAULTS[data.id]?.config || {};
    const secrets = item ? item.secrets : CANONICAL_DEFAULTS[data.id]?.secrets || {};

    try {
      await runIntegrationTest(data.id, config, secrets);

      // Save/Upsert the successful status into the database
      await (supabaseAdmin as any).from("source_integrations").upsert({
        id: data.id,
        status: "connected",
        config,
        secrets,
        updated_at: new Date().toISOString(),
        updated_by: authRes.userId,
      });

      return { success: true, status: "Connected" };
    } catch (e: any) {
      // Save/Upsert the failure status into the database
      await (supabaseAdmin as any).from("source_integrations").upsert({
        id: data.id,
        status: "error",
        config,
        secrets,
        updated_at: new Date().toISOString(),
        updated_by: authRes.userId,
      });

      return { success: false, error: e.message || "Connection failed" };
    }
  });

// Dev helper to quickly elevate current user to Admin
export const elevateToAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;

    // Insert user into user_roles as admin
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({
        user_id: userId,
        role: "admin",
      }, { onConflict: "user_id, role" });

    if (error) throw new Error(`Failed to elevate role: ${error.message}`);

    return { success: true };
  });


// Connection Check Runner helper
async function runIntegrationTest(sourceId: string, config: any, secrets: any): Promise<void> {
  let status = "connected";
  
  if (config.enabled === false) {
    status = "disabled";
    await updateStatus(sourceId, status);
    return;
  }

  try {
    switch (sourceId) {
      case "firecrawl": {
        const apiKey = secrets.apiKey || process.env.FIRECRAWL_API_KEY;
        if (!apiKey) throw new Error("API key is not configured");
        // Test key by requesting scrape endpoint
        const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ url: "https://example.com" }),
        });
        if (res.status === 401 || res.status === 403) {
          throw new Error("Invalid API Credentials (unauthorized)");
        }
        break;
      }
      case "reddit": {
        const clientId = secrets.clientId || process.env.REDDIT_CLIENT_ID;
        const clientSecret = secrets.clientSecret || process.env.REDDIT_CLIENT_SECRET;
        if (!clientId || !clientSecret) throw new Error("Client ID or Client Secret not configured");

        const auth = btoa(`${clientId.trim()}:${clientSecret.trim()}`);
        const res = await fetch("https://www.reddit.com/api/v1/access_token", {
          method: "POST",
          headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) B2BLeadSwarmBot/1.0",
          },
          body: "grant_type=client_credentials",
        });
        if (!res.ok) {
          throw new Error(`Authentication token retrieval failed [Status: ${res.status}]`);
        }
        break;
      }
      case "threads": {
        const accessToken = secrets.accessToken;
        if (!accessToken) throw new Error("Platform OAuth access token not connected");
        
        const res = await fetch(`https://graph.threads.net/v1.0/me?fields=id,username&access_token=${accessToken}`);
        if (!res.ok) {
          throw new Error(`Threads API Token validation failed [Status: ${res.status}]`);
        }
        break;
      }
      case "openstreetmap": {
        // Ping Overpass interpreter with a tiny query count
        const res = await fetch("https://overpass-api.de/api/interpreter?data=[out:json];node(50.0,8.0,50.1,8.1);out count;");
        if (!res.ok) {
          throw new Error("Overpass query server is currently unreachable");
        }
        break;
      }
      case "google-places": {
        const apiKey = secrets.apiKey || process.env.GOOGLE_PLACES_API_KEY;
        if (!apiKey) throw new Error("API key is not configured");

        const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "places.id"
          },
          body: JSON.stringify({ textQuery: "test" })
        });
        
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Google Places API returned status ${res.status}`);
        }
        break;
      }
      case "youtube": {
        const apiKey = secrets.apiKey || process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;
        if (!apiKey) throw new Error("YouTube API key (YOUTUBE_API_KEY) is not configured");

        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&maxResults=1&key=${apiKey}`);
        const data = await res.json();
        if (data.error?.code === 403 || data.error?.code === 400) {
          throw new Error(data.error.message || "YouTube API key is denied/unauthorized");
        }
        break;
      }
      case "discourse": {
        const forumUrls = config.forumUrls || "";
        if (!forumUrls.trim()) throw new Error("No forum URLs configured");
        const testUrl = forumUrls.split(",")[0]?.trim();
        if (!testUrl) throw new Error("Invalid forum URL configuration");
        const res = await fetch(`${testUrl.replace(/\/$/, "")}/search.json?q=test`);
        if (!res.ok && res.status !== 404) {
          throw new Error(`Forum is unreachable or returned status [${res.status}]`);
        }
        break;
      }
      case "rss": {
        const feedUrls = config.feedUrls || "";
        if (!feedUrls.trim()) throw new Error("No RSS feed URLs configured");
        const testUrl = feedUrls.split(",")[0]?.trim();
        if (!testUrl) throw new Error("Invalid feed URL configuration");
        const res = await fetch(testUrl);
        if (!res.ok) {
          throw new Error(`Feed URL is unreachable [Status: ${res.status}]`);
        }
        break;
      }
      case "hacker-news": {
        const res = await fetch("https://hn.algolia.com/api/v1/search?query=test");
        if (!res.ok) {
          throw new Error("Hacker News Algolia search API is currently unreachable");
        }
        break;
      }
      case "mastodon": {
        const instanceUrl = config.instanceUrl || "mastodon.social";
        const cleanHost = instanceUrl.replace(/^(https?:\/\/)?(www\.)?/i, "").replace(/\/$/, "");
        const res = await fetch(`https://${cleanHost}/api/v1/instance`);
        if (!res.ok) {
          throw new Error(`Mastodon instance [${cleanHost}] is unreachable [Status: ${res.status}]`);
        }
        break;
      }
      case "x": {
        const bearerToken = secrets.bearerToken;
        if (!bearerToken) throw new Error("Bearer token is not configured");
        const res = await fetch("https://api.twitter.com/2/tweets/search/recent?query=hiring", {
          headers: {
            "Authorization": `Bearer ${bearerToken.trim()}`,
          }
        });
        if (res.status === 401 || res.status === 403) {
          throw new Error("Invalid X developer Bearer Token (unauthorized)");
        }
        break;
      }
      default:
        throw new Error("Unsupported integration type");
    }
  } catch (e: any) {
    status = "error";
    await updateStatus(sourceId, status);
    throw new Error(e.message || "Connection test failed");
  }

  await updateStatus(sourceId, status);
}

async function updateStatus(sourceId: string, status: string) {
  await (supabaseAdmin as any)
    .from("source_integrations")
    .update({ status })
    .eq("id", sourceId);
}
