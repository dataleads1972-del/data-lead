import * as cheerio from "cheerio";
import { LeadSource, SearchParams, CandidateLead } from "./source.types";
import { SourceKey } from "../../lib/lead-sources.server";
import { scorePost } from "../validation/intent-scorer";
import { getSourceConfig } from "./source-config.server";

export class RssConnector implements LeadSource {
  name = "RSS Feed Discovery";
  sourceKey: SourceKey = "directory";

  async isEnabled(): Promise<boolean> {
    const config = await getSourceConfig("rss");
    return config.enabled;
  }

  async search(params: SearchParams): Promise<CandidateLead[]> {
    const config = await getSourceConfig("rss");
    if (!config.enabled) return [];

    const feedUrlsStr = config.config.feedUrls || "";
    const feedUrls = feedUrlsStr
      .split(",")
      .map((u: string) => u.trim())
      .filter(Boolean);

    if (feedUrls.length === 0) return [];

    const candidates: CandidateLead[] = [];
    const isIntentSearch = params.lead_type === "intent";

    for (const feedUrl of feedUrls) {
      try {
        const res = await fetch(feedUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) B2BLeadSwarmBot/1.0"
          }
        });

        if (!res.ok) continue;
        const xml = await res.text();
        const $ = cheerio.load(xml, { xmlMode: true });

        const domain = new URL(feedUrl).hostname;
        const items = $("item, entry").toArray();

        for (const element of items) {
          const $item = $(element);
          const title = $item.find("title").text().trim();
          
          let link = $item.find("link").text().trim();
          if (!link) {
            link = $item.find("link").attr("href") || "";
          }

          const content = $item.find("description, content, summary").text().trim();
          const pubDate = $item.find("pubDate, published, updated").text().trim();

          if (isIntentSearch) {
            const evaluation = scorePost(title, content, params.keyword);
            if (evaluation.isIntent) {
              candidates.push({
                company_name: title.slice(0, 150),
                website: null,
                domain,
                sources: new Set<SourceKey>([this.sourceKey]),
                socials: {},
                snippets: [content.slice(0, 500)],
                listing_urls: [link || feedUrl],
                is_intent_lead: true,
                intent_score: evaluation.score,
                matched_keyword: evaluation.matchedKeyword,
                post_author: "Feed Author",
                post_created_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
                post_url: link || feedUrl,
                source_platform: `RSS Feed (${domain})`,
                post_title: title
              });
            }
          }
        }
      } catch (e: any) {
        console.warn(`RSS feed search failed for ${feedUrl}:`, e.message);
      }
    }

    return candidates;
  }
}
