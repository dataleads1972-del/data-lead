import { LeadSource, SearchParams, CandidateLead } from "./source.types";
import { SourceKey } from "../../lib/lead-sources.server";
import { scorePost } from "../validation/intent-scorer";
import { getSourceConfig } from "./source-config.server";

export class HackerNewsConnector implements LeadSource {
  name = "Hacker News Discovery";
  sourceKey: SourceKey = "directory";

  async isEnabled(): Promise<boolean> {
    const config = await getSourceConfig("hacker-news");
    return config.enabled;
  }

  async search(params: SearchParams): Promise<CandidateLead[]> {
    const config = await getSourceConfig("hacker-news");
    if (!config.enabled) return [];

    const candidates: CandidateLead[] = [];
    const isIntentSearch = params.lead_type === "intent";

    try {
      const searchUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(params.keyword)}&tags=(comment,story)`;
      
      const res = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) B2BLeadSwarmBot/1.0"
        }
      });

      if (!res.ok) return [];
      const data = await res.json() as any;
      const hits = data?.hits || [];

      for (const hit of hits) {
        const isComment = hit.tags?.includes("comment");
        const title = isComment 
          ? `Comment on: ${hit.story_title || "HN Story"}` 
          : (hit.title || "HN Story");
        
        const snippet = isComment 
          ? (hit.comment_text || "") 
          : (hit.story_text || hit.title || "");

        if (isIntentSearch) {
          const evaluation = scorePost(title, snippet, params.keyword);
          if (evaluation.isIntent) {
            const postUrl = `https://news.ycombinator.com/item?id=${hit.objectID}`;
            
            candidates.push({
              company_name: title.slice(0, 150),
              website: null,
              domain: "news.ycombinator.com",
              sources: new Set<SourceKey>([this.sourceKey]),
              socials: {},
              snippets: [snippet.replace(/<[^>]*>/g, "")],
              listing_urls: [postUrl],
              is_intent_lead: true,
              intent_score: evaluation.score,
              matched_keyword: evaluation.matchedKeyword,
              post_author: hit.author ? `hn/${hit.author}` : "Anonymous",
              post_created_at: hit.created_at || new Date().toISOString(),
              post_url: postUrl,
              source_platform: "Hacker News",
              post_title: title
            });
          }
        }
      }
    } catch (e: any) {
      console.warn("Hacker News search failed:", e.message);
    }

    return candidates;
  }
}
