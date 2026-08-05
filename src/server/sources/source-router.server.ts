import { LeadSource, SearchParams, CandidateLead } from "./source.types";
import { FirecrawlConnector } from "./firecrawl-connector.server";
import { GooglePlacesConnector } from "./google-places.server";
import { RedditConnector } from "./reddit.server";
import { OverpassConnector } from "./overpass-connector.server";
import { SourceKey } from "../../lib/lead-sources.server";

export class SourceRouter {
  private connectors: LeadSource[] = [];

  constructor() {
    // Phase 4: Register existing Firecrawl connector
    this.connectors.push(new FirecrawlConnector());
    // Phase 5: Register optional Google Places connector
    this.connectors.push(new GooglePlacesConnector());
    // Phase 6: Register Reddit connector
    this.connectors.push(new RedditConnector());
    // Zero-Cost setup: Register free OpenStreetMap/Overpass connector
    this.connectors.push(new OverpassConnector());
  }

  register(connector: LeadSource) {
    this.connectors.push(connector);
  }

  getConnectors(): LeadSource[] {
    return this.connectors;
  }

  async runSearch(
    params: SearchParams,
    onProgress?: (source: SourceKey, count: number) => Promise<void> | void
  ): Promise<CandidateLead[]> {
    const active = this.connectors.filter(c => {
      if (!c.isEnabled()) return false;
      if (params.lead_type === "intent") {
        return c.name === "Reddit Discovery";
      }
      return true;
    });
    
    if (active.length === 0) {
      throw new Error("No active search connectors enabled. Please configure FIRECRAWL_API_KEY.");
    }

    const results = await Promise.allSettled(
      active.map(async (connector) => {
        try {
          const leads = await connector.search(params);
          if (onProgress) {
            await onProgress(connector.sourceKey, leads.length);
          }
          return leads;
        } catch (e) {
          console.warn(`Connector [${connector.name}] skipped:`, (e as any)?.message || e);
          return [];
        }
      })
    );

    const mergedCandidates = new Map<string, CandidateLead>();

    for (const res of results) {
      if (res.status === "fulfilled" && Array.isArray(res.value)) {
        for (const lead of res.value) {
          // Merge based on domain name (if present) or normalized company name
          const key = lead.domain || lead.company_name.toLowerCase().replace(/[^a-z0-9]/g, "");
          const existing = mergedCandidates.get(key);
          if (existing) {
            existing.snippets = Array.from(new Set([...existing.snippets, ...lead.snippets]));
            lead.sources.forEach(src => existing.sources.add(src));
            existing.listing_urls = Array.from(new Set([...existing.listing_urls, ...lead.listing_urls]));
            existing.socials = { ...existing.socials, ...lead.socials };
            if (!existing.website && lead.website) {
              existing.website = lead.website;
            }
          } else {
            mergedCandidates.set(key, {
              ...lead,
              sources: new Set(lead.sources)
            });
          }
        }
      }
    }

    // Sort by source counts (leads with more source hits come first)
    return Array.from(mergedCandidates.values()).sort(
      (a, b) => b.sources.size - a.sources.size
    );
  }
}
export const sourceRouter = new SourceRouter();
