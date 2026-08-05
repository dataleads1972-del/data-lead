import { LeadSource, SearchParams, CandidateLead } from "./source.types";
import { SourceKey } from "../../lib/lead-sources.server";
import { scorePost } from "../validation/intent-scorer";
import { getSourceConfig } from "./source-config.server";

export class DiscourseConnector implements LeadSource {
  name = "Discourse Discovery";
  sourceKey: SourceKey = "directory";

  async isEnabled(): Promise<boolean> {
    const config = await getSourceConfig("discourse");
    return config.enabled;
  }

  async search(params: SearchParams): Promise<CandidateLead[]> {
    const config = await getSourceConfig("discourse");
    if (!config.enabled) return [];

    const forumUrlsStr = config.config.forumUrls || "";
    const forumUrls = forumUrlsStr
      .split(",")
      .map((u: string) => u.trim())
      .filter(Boolean);

    if (forumUrls.length === 0) return [];

    const candidates: CandidateLead[] = [];
    const isIntentSearch = params.lead_type === "intent";

    const query = isIntentSearch
      ? `"${params.keyword}" (hiring OR "looking for" OR "need" OR "budget" OR "hire" OR "freelance")`
      : params.keyword;

    for (const forumUrl of forumUrls) {
      try {
        const cleanUrl = forumUrl.replace(/\/$/, "");
        const searchUrl = `${cleanUrl}/search.json?q=${encodeURIComponent(query)}`;
        
        const res = await fetch(searchUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) B2BLeadSwarmBot/1.0"
          }
        });

        if (!res.ok) continue;
        const data = await res.json() as any;
        
        const posts = data?.posts || [];
        const topics = data?.topics || [];
        const topicMap = new Map(topics.map((t: any) => [t.id, t]));

        for (const post of posts) {
          const topic: any = topicMap.get(post.topic_id);
          const title = topic?.title || "Discussion Post";
          const snippet = post.blurb || post.cooked || "";
          
          if (isIntentSearch) {
            const evaluation = scorePost(title, snippet, params.keyword);
            if (evaluation.isIntent) {
              const domain = new URL(forumUrl).hostname;
              const postUrl = topic?.slug 
                ? `${cleanUrl}/t/${topic.slug}/${post.topic_id}` 
                : `${cleanUrl}/t/${post.topic_id}`;

              candidates.push({
                company_name: title.slice(0, 150),
                website: null,
                domain,
                sources: new Set<SourceKey>([this.sourceKey]),
                socials: {},
                snippets: [snippet],
                listing_urls: [postUrl],
                is_intent_lead: true,
                intent_score: evaluation.score,
                matched_keyword: evaluation.matchedKeyword,
                post_author: post.username ? `forum/${post.username}` : "Anonymous",
                post_created_at: post.created_at || new Date().toISOString(),
                post_url: postUrl,
                source_platform: `Discourse (${domain})`,
                post_title: title
              });
            }
          }
        }
      } catch (e: any) {
        console.warn(`Discourse search failed for ${forumUrl}:`, e.message);
      }
    }

    return candidates;
  }
}
