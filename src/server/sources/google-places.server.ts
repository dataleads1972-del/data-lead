import { LeadSource, SearchParams, CandidateLead } from "./source.types";
import { SourceKey } from "../../lib/lead-sources.server";
import { generateQueries } from "../research/query-generator";
import { getSourceConfig } from "./source-config.server";

export class GooglePlacesConnector implements LeadSource {
  name = "Google Places";
  sourceKey: SourceKey = "google_maps";

  async isEnabled(): Promise<boolean> {
    const config = await getSourceConfig("google-places");
    return config.enabled;
  }

  async search(params: SearchParams): Promise<CandidateLead[]> {
    const config = await getSourceConfig("google-places");
    if (!config.enabled) return [];

    const key = config.secrets.apiKey;
    const baseQueries = generateQueries(params);
    
    // Use the primary search query to fetch local listings
    const query = baseQueries[0];
    if (!query) return [];

    const candidates: CandidateLead[] = [];

    try {
      const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.types,places.websiteUri"
        },
        body: JSON.stringify({
          textQuery: query,
          maxResultCount: Math.min(params.target_count || 20, 20)
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Google Places API returned status ${res.status}`);
      }

      const data = await res.json();
      const results = data.places || [];

      for (const place of results) {
        let domain = `places:${place.id}`;
        let website: string | null = null;
        
        if (place.websiteUri) {
          try {
            const urlObj = new URL(place.websiteUri);
            domain = urlObj.hostname.replace("www.", "");
            website = place.websiteUri;
          } catch (e) {
            // fallback
          }
        }
        
        candidates.push({
          company_name: place.displayName?.text || "Unknown Name",
          website: website,
          domain: domain,
          sources: new Set<SourceKey>([this.sourceKey]),
          socials: {},
          snippets: [
            place.formattedAddress || "",
            `Rating: ${place.rating || "N/A"} (${place.userRatingCount || 0} reviews)`,
            `Types: ${(place.types || []).join(", ")}`
          ].filter(Boolean),
          listing_urls: place.id ? [`https://www.google.com/maps/place/?q=place_id:${place.id}`] : []
        });
      }
    } catch (e) {
      console.error("Google Places Search error:", e);
    }

    return candidates;
  }
}
