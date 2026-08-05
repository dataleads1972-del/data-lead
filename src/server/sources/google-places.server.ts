import { LeadSource, SearchParams, CandidateLead } from "./source.types";
import { SourceKey } from "../../lib/lead-sources.server";
import { generateQueries } from "../research/query-generator";

export class GooglePlacesConnector implements LeadSource {
  name = "Google Places";
  sourceKey: SourceKey = "google_maps";

  isEnabled(): boolean {
    return !!process.env.GOOGLE_PLACES_API_KEY;
  }

  async search(params: SearchParams): Promise<CandidateLead[]> {
    if (!this.isEnabled()) return [];

    const key = process.env.GOOGLE_PLACES_API_KEY;
    const baseQueries = generateQueries(params);
    
    // Use the primary search query to fetch local listings
    const query = baseQueries[0];
    if (!query) return [];

    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${key}`;
    const candidates: CandidateLead[] = [];

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Google Places API returned ${res.status}`);
      }
      const data = (await res.json()) as any;
      const results = data.results || [];
      const limitedResults = results.slice(0, params.target_count);

      for (const place of limitedResults) {
        // Simple textsearch contains general info. 
        // Website is usually not included in standard textsearch unless we run a place details search.
        // We will default to a places mapping key for deduplication.
        const domain = `places:${place.place_id}`;
        
        candidates.push({
          company_name: place.name,
          website: null,
          domain: domain,
          sources: new Set<SourceKey>([this.sourceKey]),
          socials: {},
          snippets: [
            place.formatted_address || "",
            `Rating: ${place.rating || "N/A"} (${place.user_ratings_total || 0} reviews)`,
            `Types: ${(place.types || []).join(", ")}`
          ].filter(Boolean),
          listing_urls: place.place_id ? [`https://www.google.com/maps/place/?q=place_id:${place.place_id}`] : []
        });
      }
    } catch (e) {
      console.error("Google Places Search error:", e);
    }

    return candidates;
  }
}
