import { LeadSource, SearchParams, CandidateLead } from "./source.types";
import { SourceKey } from "../../lib/lead-sources.server";
import { scorePost } from "../validation/intent-scorer";
import { getSourceConfig } from "./source-config.server";

export class ThreadsConnector implements LeadSource {
  name = "Threads Discovery";
  sourceKey: SourceKey = "directory";

  async isEnabled(): Promise<boolean> {
    const config = await getSourceConfig("threads");
    return config.enabled;
  }

  async search(params: SearchParams): Promise<CandidateLead[]> {
    const config = await getSourceConfig("threads");
    if (!config.enabled) return [];

    const accessToken = config.secrets.accessToken;
    if (!accessToken) {
      console.warn("ThreadsConnector: Access token is missing, skipping search.");
      return [];
    }

    const isIntentSearch = params.lead_type === "intent";
    const candidates: CandidateLead[] = [];

    try {
      // Query the authorized platform account's threads/posts
      const url = `https://graph.threads.net/v1.0/me/threads?fields=id,permalink,timestamp,username,text&access_token=${accessToken}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Threads API returned ${res.status}: ${text}`);
      }

      const data = (await res.json()) as any;
      const posts = data.data || [];

      for (const post of posts) {
        const text = post.text || "";
        if (!text) continue;

        if (isIntentSearch) {
          // Intent Search Path: Evaluate the post for intent
          const evaluation = scorePost(text.slice(0, 100), text, params.keyword);
          if (evaluation.isIntent) {
            candidates.push({
              company_name: text.slice(0, 150),
              website: null,
              domain: "threads.net",
              sources: new Set<SourceKey>([this.sourceKey]),
              socials: {},
              snippets: [text],
              listing_urls: post.permalink ? [post.permalink] : [],
              
              // Intent specific attributes
              is_intent_lead: true,
              intent_score: evaluation.score,
              matched_keyword: evaluation.matchedKeyword,
              post_author: post.username ? `@${post.username}` : "Anonymous",
              post_created_at: post.timestamp || new Date().toISOString(),
              post_url: post.permalink || "",
              source_platform: "Threads",
              post_title: text.slice(0, 100)
            });
          }
        } else {
          // Business Discovery Path: Extract domain mentions in the text
          const urlMatches = text.match(/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,4})/g) || [];
          const uniqueDomains = Array.from(new Set(urlMatches))
            .map(d => (d as string).toLowerCase())
            .filter(d => !d.includes("threads.net") && !d.includes("google.com") && d.includes(".") && d.length > 4);

          for (const domain of uniqueDomains.slice(0, 3)) {
            const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/i, "").split("/")[0];
            candidates.push({
              company_name: cleanDomain.split(".")[0] || cleanDomain,
              website: `https://${cleanDomain}`,
              domain: cleanDomain,
              sources: new Set<SourceKey>([this.sourceKey]),
              socials: {},
              snippets: [`Threads post mention by @${post.username || "user"}: "${text.slice(0, 120)}"`],
              listing_urls: post.permalink ? [post.permalink] : []
            });
          }
        }
      }
    } catch (e: any) {
      console.error("Threads search failed:", e?.message || e);
    }

    return candidates;
  }
}
