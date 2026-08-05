import { LeadSource, SearchParams, CandidateLead } from "./source.types";
import { SourceKey } from "../../lib/lead-sources.server";
import { generateQueries } from "../research/query-generator";
import { scorePost } from "../validation/intent-scorer";
import { getSourceConfig } from "./source-config.server";

async function fetchRedditPosts(query: string, limit = 20, clientId?: string, clientSecret?: string): Promise<any[]> {
  const finalClientId = clientId || process.env.REDDIT_CLIENT_ID;
  const finalClientSecret = clientSecret || process.env.REDDIT_CLIENT_SECRET;
  
  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) B2BLeadSwarmBot/1.0"
  };

  if (finalClientId && finalClientSecret) {
    try {
      // Official API path using OAuth client credentials
      const tokenUrl = "https://www.reddit.com/api/v1/access_token";
      const auth = btoa(`${finalClientId.trim()}:${finalClientSecret.trim()}`);
      const tokenRes = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) B2BLeadSwarmBot/1.0"
        },
        body: "grant_type=client_credentials"
      });

      if (tokenRes.ok) {
        const tokenData = await tokenRes.json() as any;
        const accessToken = tokenData.access_token;
        if (accessToken) {
          const oauthUrl = `https://oauth.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=${limit}`;
          const res = await fetch(oauthUrl, {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) B2BLeadSwarmBot/1.0"
            }
          });
          if (res.ok) {
            const data = await res.json() as any;
            return data?.data?.children || [];
          }
        }
      }
    } catch (e) {
      console.warn("Reddit OAuth search failed, falling back to public endpoint:", e);
    }
  }

  // Fallback to unauthenticated public API for development
  const publicUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await fetch(publicUrl, { headers });
  if (!res.ok) return [];
  const data = (await res.json()) as any;
  return data?.data?.children || [];
}

export class RedditConnector implements LeadSource {
  name = "Reddit Discovery";
  sourceKey: SourceKey = "directory";

  async isEnabled(): Promise<boolean> {
    const config = await getSourceConfig("reddit");
    return config.enabled;
  }

  async search(params: SearchParams): Promise<CandidateLead[]> {
    const config = await getSourceConfig("reddit");
    if (!config.enabled) return [];
    
    const clientId = config.secrets.clientId;
    const clientSecret = config.secrets.clientSecret;
    
    const isIntentSearch = params.lead_type === "intent";
    
    // For intent searches, construct a direct high-intent query.
    // For business discovery, use the default query generation.
    let queries: string[] = [];
    if (isIntentSearch) {
      queries = [`"${params.keyword}" (hiring OR "looking for" OR "need" OR "budget" OR "hire" OR "freelance")`];
    } else {
      queries = [generateQueries(params)[0]].filter(Boolean) as string[];
    }

    const query = queries[0];
    if (!query) return [];

    const candidates: CandidateLead[] = [];

    try {
      const children = await fetchRedditPosts(query, 20, clientId, clientSecret);

      for (const child of children) {
        const post = child.data;
        const text = `${post.title} \n ${post.selftext || ""}`;
        
        if (isIntentSearch) {
          // Intent Search Path: Evaluate the post for intent
          const evaluation = scorePost(post.title, post.selftext || "", params.keyword, post.subreddit);
          if (evaluation.isIntent) {
            candidates.push({
              company_name: post.title.slice(0, 150),
              website: null,
              domain: "reddit.com",
              sources: new Set<SourceKey>([this.sourceKey]),
              socials: {},
              snippets: [post.selftext || ""],
              listing_urls: [`https://www.reddit.com${post.permalink}`],
              
              // Intent specific attributes
              is_intent_lead: true,
              intent_score: evaluation.score,
              matched_keyword: evaluation.matchedKeyword,
              post_author: post.author ? `u/${post.author}` : "Anonymous",
              post_created_at: new Date(post.created_utc * 1000).toISOString(),
              post_url: `https://www.reddit.com${post.permalink}`,
              source_platform: "Reddit",
              post_title: post.title
            });
          }
        } else {
          // Existing Business Search Path: Extract domain names mentioned in the post
          const urlMatches = text.match(/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,4})/g) || [];
          const uniqueDomains = Array.from(new Set(urlMatches))
            .map(d => d.toLowerCase())
            .filter(d => !d.includes("reddit.com") && !d.includes("google.com") && d.includes(".") && d.length > 4);

          for (const domain of uniqueDomains.slice(0, 3)) {
            const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/i, "").split("/")[0];
            candidates.push({
              company_name: cleanDomain.split(".")[0] || cleanDomain,
              website: `https://${cleanDomain}`,
              domain: cleanDomain,
              sources: new Set<SourceKey>([this.sourceKey]),
              socials: {},
              snippets: [`Reddit mention in r/${post.subreddit}: "${post.title.slice(0, 120)}"`],
              listing_urls: [`https://www.reddit.com${post.permalink}`]
            });
          }
        }
      }
    } catch (e) {
      console.error("Reddit search failed:", e);
    }

    return candidates;
  }
}
