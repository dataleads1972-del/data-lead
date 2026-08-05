import { LeadSource, SearchParams, CandidateLead } from "./source.types";
import { SourceKey } from "../../lib/lead-sources.server";
import { scorePost } from "../validation/intent-scorer";
import { getSourceConfig } from "./source-config.server";

export class MastodonConnector implements LeadSource {
  name = "Mastodon Discovery";
  sourceKey: SourceKey = "directory";

  async isEnabled(): Promise<boolean> {
    const config = await getSourceConfig("mastodon");
    return config.enabled;
  }

  async search(params: SearchParams): Promise<CandidateLead[]> {
    const config = await getSourceConfig("mastodon");
    if (!config.enabled) return [];

    const instanceUrl = config.config.instanceUrl || "mastodon.social";
    const accessToken = config.secrets.accessToken;

    const candidates: CandidateLead[] = [];
    const isIntentSearch = params.lead_type === "intent";

    const query = isIntentSearch
      ? `"${params.keyword}"`
      : params.keyword;

    try {
      const cleanHost = instanceUrl.replace(/^(https?:\/\/)?(www\.)?/i, "").replace(/\/$/, "");
      const searchUrl = `https://${cleanHost}/api/v2/search?q=${encodeURIComponent(query)}&type=statuses`;

      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) B2BLeadSwarmBot/1.0"
      };

      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken.trim()}`;
      }

      const res = await fetch(searchUrl, { headers });
      if (!res.ok) return [];

      const data = await res.json() as any;
      const statuses = data?.statuses || [];

      for (const status of statuses) {
        const cleanContent = (status.content || "").replace(/<[^>]*>/g, "");
        const title = `Mastodon post by @${status.account?.username || "user"}`;

        if (isIntentSearch) {
          const evaluation = scorePost(title, cleanContent, params.keyword);
          if (evaluation.isIntent) {
            candidates.push({
              company_name: title,
              website: null,
              domain: cleanHost,
              sources: new Set<SourceKey>([this.sourceKey]),
              socials: {},
              snippets: [cleanContent.slice(0, 500)],
              listing_urls: [status.url],
              is_intent_lead: true,
              intent_score: evaluation.score,
              matched_keyword: evaluation.matchedKeyword,
              post_author: status.account?.acct ? `@${status.account.acct}` : "Anonymous",
              post_created_at: status.created_at || new Date().toISOString(),
              post_url: status.url,
              source_platform: `Mastodon (${cleanHost})`,
              post_title: title
            });
          }
        }
      }
    } catch (e: any) {
      console.warn(`Mastodon search failed for ${instanceUrl}:`, e.message);
    }

    return candidates;
  }
}
