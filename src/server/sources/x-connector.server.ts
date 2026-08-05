import { LeadSource, SearchParams, CandidateLead } from "./source.types";
import { SourceKey } from "../../lib/lead-sources.server";
import { scorePost } from "../validation/intent-scorer";
import { getSourceConfig } from "./source-config.server";

export class XConnector implements LeadSource {
  name = "X (Twitter) Discovery";
  sourceKey: SourceKey = "twitter";

  async isEnabled(): Promise<boolean> {
    const config = await getSourceConfig("x");
    return config.enabled;
  }

  async search(params: SearchParams): Promise<CandidateLead[]> {
    const config = await getSourceConfig("x");
    if (!config.enabled) return [];

    const bearerToken = config.secrets.bearerToken;
    if (!bearerToken) return [];

    const candidates: CandidateLead[] = [];
    const isIntentSearch = params.lead_type === "intent";

    const query = isIntentSearch
      ? `"${params.keyword}" (hiring OR "looking for" OR "need" OR "budget" OR "hire" OR "freelance") -is:retweet`
      : `${params.keyword} -is:retweet`;

    try {
      const searchUrl = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&tweet.fields=created_at,author_id&expansions=author_id&user.fields=username`;

      const res = await fetch(searchUrl, {
        headers: {
          "Authorization": `Bearer ${bearerToken.trim()}`,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) B2BLeadSwarmBot/1.0"
        }
      });

      if (!res.ok) {
        console.warn(`X API returned error status: ${res.status}`);
        return [];
      }

      const data = await res.json() as any;
      const tweets = data?.data || [];
      const users = data?.includes?.users || [];
      const userMap = new Map(users.map((u: any) => [u.id, u.username]));

      for (const tweet of tweets) {
        const username = userMap.get(tweet.author_id) || "twitter_user";
        const content = tweet.text || "";
        const title = `Tweet from @${username}`;
        const tweetUrl = `https://x.com/${username}/status/${tweet.id}`;

        if (isIntentSearch) {
          const evaluation = scorePost(title, content, params.keyword);
          if (evaluation.isIntent) {
            candidates.push({
              company_name: title,
              website: null,
              domain: "x.com",
              sources: new Set<SourceKey>([this.sourceKey]),
              socials: {},
              snippets: [content],
              listing_urls: [tweetUrl],
              is_intent_lead: true,
              intent_score: evaluation.score,
              matched_keyword: evaluation.matchedKeyword,
              post_author: `@${username}`,
              post_created_at: tweet.created_at || new Date().toISOString(),
              post_url: tweetUrl,
              source_platform: "X / Twitter",
              post_title: title
            });
          }
        }
      }
    } catch (e: any) {
      console.warn("X (Twitter) search failed:", e.message);
    }

    return candidates;
  }
}
