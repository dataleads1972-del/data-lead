import { LeadSource, SearchParams, CandidateLead } from "./source.types";
import { SourceKey, collectCandidates } from "../../lib/lead-sources.server";
import { firecrawlSearch } from "../../lib/firecrawl.server";
import { generateQueries } from "../research/query-generator";
import { getSourceConfig } from "./source-config.server";

export class FirecrawlConnector implements LeadSource {
  name = "Firecrawl Search";
  sourceKey: SourceKey = "web";

  async isEnabled(): Promise<boolean> {
    const config = await getSourceConfig("firecrawl");
    return config.enabled;
  }

  async search(params: SearchParams): Promise<CandidateLead[]> {
    const config = await getSourceConfig("firecrawl");
    if (!config.enabled) return [];
    
    const apiKey = config.secrets.apiKey;
    const baseQueries = generateQueries(params);
    const perQuery = params.depth === "deep" ? 12 : params.depth === "quick" ? 5 : 8;
    const allHits: any[] = [];
    
    // Group queries into chunks of 4 to run concurrently
    const queries = baseQueries.map(q => `${q} contact email phone`);
    const chunks: string[][] = [];
    for (let i = 0; i < queries.length; i += 4) {
      chunks.push(queries.slice(i, i + 4));
    }
    
    for (const chunk of chunks) {
      const settled = await Promise.allSettled(
        chunk.map(q => firecrawlSearch(q, { limit: perQuery, country: params.country || undefined, apiKey }))
      );
      for (const res of settled) {
        if (res.status === "fulfilled" && Array.isArray(res.value)) {
          allHits.push(...res.value.map(h => ({ ...h, source: this.sourceKey })));
        }
      }
    }
    
    // Convert hits to candidate lead objects
    const candidates = collectCandidates(allHits);
    return candidates as CandidateLead[];
  }
}
