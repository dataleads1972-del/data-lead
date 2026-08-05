import { LeadSource, SearchParams, CandidateLead } from "./source.types";
import { SourceKey } from "../../lib/lead-sources.server";
import { getSourceConfig } from "./source-config.server";

export class OverpassConnector implements LeadSource {
  name = "OpenStreetMap / Overpass";
  sourceKey: SourceKey = "google_maps"; // Mapped to google_maps so they display under the maps agent step in the UI

  async isEnabled(): Promise<boolean> {
    const config = await getSourceConfig("openstreetmap");
    return config.enabled;
  }

  async search(params: SearchParams): Promise<CandidateLead[]> {
    const config = await getSourceConfig("openstreetmap");
    if (!config.enabled) return [];

    const locName = params.city || params.state;
    if (!locName) return []; // Overpass needs local city or state area context to avoid global/country-wide timeouts

    const escapedKeyword = params.keyword.replace(/["\\]/g, "");
    
    // Construct Query to find name, category, or service matching keyword in area
    const overpassQuery = `
      [out:json][timeout:30];
      area["name"="${locName}"]->.searchArea;
      (
        node["name"~"${escapedKeyword}",i](area.searchArea);
        way["name"~"${escapedKeyword}",i](area.searchArea);
        node["amenity"~"${escapedKeyword}",i](area.searchArea);
        way["amenity"~"${escapedKeyword}",i](area.searchArea);
        node["shop"~"${escapedKeyword}",i](area.searchArea);
        way["shop"~"${escapedKeyword}",i](area.searchArea);
        node["tourism"~"${escapedKeyword}",i](area.searchArea);
        way["tourism"~"${escapedKeyword}",i](area.searchArea);
      );
      out body 50;
    `;

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery.trim())}`;
    const candidates: CandidateLead[] = [];

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20_000); // 20s timeout

      const res = await fetch(url, {
        headers: { "User-Agent": "B2BLeadSwarmOverpass/1.0" },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));
      
      if (!res.ok) {
        // Overpass servers can be busy (504/429) — fail silently, other connectors continue
        console.warn(`Overpass API returned status ${res.status} — skipping.`);
        return candidates;
      }

      const data = (await res.json()) as any;
      const elements = data?.elements || [];

      for (const el of elements) {
        const tags = el.tags || {};
        const name = tags.name || tags.operator || tags.brand || `OSM Business:${el.id}`;
        
        let website = tags.website || tags["contact:website"] || tags["url"] || null;
        if (website && !website.startsWith("http")) {
          website = `https://${website}`;
        }
        
        const phone = tags.phone || tags["contact:phone"] || tags["phone:mobile"] || null;
        
        const street = tags["addr:street"] || "";
        const houseNumber = tags["addr:housenumber"] || "";
        const city = tags["addr:city"] || params.city || null;
        const postcode = tags["addr:postcode"] || "";
        const country = tags["addr:country"] || params.country || null;
        
        const fullAddress = [
          houseNumber && street ? `${houseNumber} ${street}` : street,
          city,
          postcode,
          country
        ].filter(Boolean).join(", ") || null;

        const domain = website 
          ? website.replace(/^(https?:\/\/)?(www\.)?/i, "").split("/")[0].toLowerCase() 
          : `osm:${el.id}`;

        candidates.push({
          company_name: name,
          website: website,
          domain: domain,
          sources: new Set<SourceKey>([this.sourceKey]),
          socials: {
            facebook: tags["contact:facebook"] || tags.facebook || undefined,
            instagram: tags["contact:instagram"] || tags.instagram || undefined,
            twitter: tags["contact:twitter"] || tags.twitter || tags.x || undefined,
          },
          snippets: [
            tags.description || tags.note || `OSM: ${tags.amenity || tags.shop || tags.tourism || "Local Business"}`
          ].filter(Boolean),
          listing_urls: [`https://www.openstreetmap.org/${el.type}/${el.id}`]
        });
      }
    } catch (e: any) {
      if (e?.name === "AbortError") {
        console.warn("Overpass API timed out — skipping.");
      } else {
        console.warn("Overpass Search skipped:", e?.message || e);
      }
    }

    return candidates;
  }
}
