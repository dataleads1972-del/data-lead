import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getThreadsConnection = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("threads_connections")
      .select("id, threads_user_id, username, created_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const exchangeThreadsCode = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({
      code: z.string(),
      userId: z.string().uuid(),
      origin: z.string().url(),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    const appId = process.env.THREADS_APP_ID;
    const appSecret = process.env.THREADS_APP_SECRET;
    const redirectUri = process.env.THREADS_REDIRECT_URI;

    if (!appId || !appSecret || !redirectUri) {
      throw new Error("Threads API keys or redirect URI not configured in server environment.");
    }

    // 1. Exchange authorization code for a short-lived token
    const tokenUrl = "https://graph.threads.net/oauth/access_token";
    const bodyParams = new URLSearchParams();
    bodyParams.append("client_id", appId);
    bodyParams.append("client_secret", appSecret);
    bodyParams.append("grant_type", "authorization_code");
    bodyParams.append("redirect_uri", redirectUri);
    bodyParams.append("code", data.code);

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: bodyParams.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`Threads token exchange failed: ${errText}`);
    }

    const tokenJson = (await tokenRes.json()) as any;
    let accessToken = tokenJson.access_token;
    const threadsUserId = tokenJson.user_id;

    if (!accessToken) {
      throw new Error("No access token returned from Threads.");
    }

    // 2. Exchange short-lived token for a long-lived 60-day token
    try {
      const longLivedUrl = `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${appSecret}&access_token=${accessToken}`;
      const longLivedRes = await fetch(longLivedUrl);
      if (longLivedRes.ok) {
        const longLivedJson = (await longLivedRes.json()) as any;
        if (longLivedJson.access_token) {
          accessToken = longLivedJson.access_token;
        }
      }
    } catch (e) {
      console.warn("Failed to exchange Threads short-lived token for long-lived token, keeping short-lived token.", e);
    }

    // 3. Fetch user profile from Threads API to get username
    const profileUrl = `https://graph.threads.net/v1.0/me?fields=id,username,name&access_token=${accessToken}`;
    const profileRes = await fetch(profileUrl);
    if (!profileRes.ok) {
      const errText = await profileRes.text();
      throw new Error(`Failed to fetch Threads profile details: ${errText}`);
    }

    const profileJson = (await profileRes.json()) as any;
    const username = profileJson.username || "Anonymous";

    // 4. Save connection securely using supabaseAdmin
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: dbError } = await supabaseAdmin.from("threads_connections").upsert({
      user_id: data.userId,
      access_token: accessToken,
      threads_user_id: String(threadsUserId || profileJson.id),
      username,
      updated_at: new Date().toISOString(),
    });

    if (dbError) {
      throw new Error(`Database error saving Threads connection: ${dbError.message}`);
    }

    return { success: true, username };
  });

export const disconnectThreads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("threads_connections")
      .delete()
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const testThreadsProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    // Bypassing normal user RLS select for access_token security:
    // Load supabaseAdmin client to securely read access_token from the backend
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: connection, error: dbError } = await supabaseAdmin
      .from("threads_connections")
      .select("access_token")
      .eq("user_id", userId)
      .maybeSingle();

    if (dbError || !connection) {
      throw new Error(dbError?.message || "Threads connection not found.");
    }

    // Query official Threads API profile details
    const testUrl = `https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url,threads_biography&access_token=${connection.access_token}`;
    const res = await fetch(testUrl);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Threads API profile test failed: ${errText}`);
    }

    const data = await res.json();
    return data;
  });

export const getThreadsConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    return {
      appId: process.env.THREADS_APP_ID || null,
      redirectUri: process.env.THREADS_REDIRECT_URI || null,
    };
  });
