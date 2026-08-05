import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const DirectorySearchInput = z.object({
  searchTerm: z.string().min(1),
  city: z.string().min(1),
});

export interface Address {
  street: string | null;
  area: string | null;
  city: string | null;
  postcode: string | null;
}

export interface Coordinates {
  lat: string | null;
  lon: string | null;
}

export interface BasicInfo {
  name: string | null;
  address: Address;
  phone: string | null;
  website: string | null;
  opening_hours: string | null;
  coordinates: Coordinates;
  category: string | null;
}

export interface VideoInfo {
  video_title: string | null;
  video_id: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  channel_name: string | null;
  published_date: string | null;
  short_description: string | null;
}

export interface CombinedBusinessResult {
  basic_info: BasicInfo;
  videos: VideoInfo[];
}

export function getOSMQuery(keyword: string, city: string): string {
  const cleanKeyword = keyword.trim().toLowerCase();
  const escapedKeyword = keyword.replace(/["\\]/g, "");
  
  // Format city name to Title Case to match case-sensitive OSM area names
  const formattedCity = city
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  
  let selectors: string[] = [];

  if (cleanKeyword.includes("dental") || cleanKeyword.includes("dentist")) {
    selectors = [
      `node["amenity"="dentist"](area.searchArea);`,
      `way["amenity"="dentist"](area.searchArea);`,
      `node["healthcare"="dentist"](area.searchArea);`,
      `way["healthcare"="dentist"](area.searchArea);`
    ];
  } else if (
    cleanKeyword.includes("clinic") || 
    cleanKeyword.includes("hospital") || 
    cleanKeyword.includes("doctor") || 
    cleanKeyword.includes("healthcare")
  ) {
    selectors = [
      `node["amenity"="clinic"](area.searchArea);`,
      `way["amenity"="clinic"](area.searchArea);`,
      `node["amenity"="hospital"](area.searchArea);`,
      `way["amenity"="hospital"](area.searchArea);`,
      `node["healthcare"="doctor"](area.searchArea);`,
      `way["healthcare"="doctor"](area.searchArea);`
    ];
  } else if (
    cleanKeyword.includes("restaurant") || 
    cleanKeyword.includes("cafe") || 
    cleanKeyword.includes("coffee") || 
    cleanKeyword.includes("food")
  ) {
    selectors = [
      `node["amenity"="restaurant"](area.searchArea);`,
      `way["amenity"="restaurant"](area.searchArea);`,
      `node["amenity"="cafe"](area.searchArea);`,
      `way["amenity"="cafe"](area.searchArea);`
    ];
  } else if (cleanKeyword.includes("gym") || cleanKeyword.includes("fitness")) {
    selectors = [
      `node["leisure"="fitness_centre"](area.searchArea);`,
      `way["leisure"="fitness_centre"](area.searchArea);`
    ];
  } else if (cleanKeyword.includes("hotel") || cleanKeyword.includes("tourism")) {
    selectors = [
      `node["tourism"="hotel"](area.searchArea);`,
      `way["tourism"="hotel"](area.searchArea);`
    ];
  } else if (
    cleanKeyword.includes("school") || 
    cleanKeyword.includes("college") || 
    cleanKeyword.includes("university")
  ) {
    selectors = [
      `node["amenity"="school"](area.searchArea);`,
      `way["amenity"="school"](area.searchArea);`,
      `node["amenity"="college"](area.searchArea);`,
      `way["amenity"="college"](area.searchArea);`
    ];
  } else if (cleanKeyword.startsWith("shop ")) {
    const type = cleanKeyword.substring(5).trim();
    selectors = [
      `node["shop"="${type}"](area.searchArea);`,
      `way["shop"="${type}"](area.searchArea);`
    ];
  } else if (cleanKeyword.includes("shop") || cleanKeyword.includes("store")) {
    const words = cleanKeyword.split(/\s+/).filter(w => w !== "shop" && w !== "store");
    if (words.length > 0) {
      selectors = [
        `node["shop"="${words[0]}"](area.searchArea);`,
        `way["shop"="${words[0]}"](area.searchArea);`
      ];
    } else {
      selectors = [
        `node["shop"](area.searchArea);`,
        `way["shop"](area.searchArea);`
      ];
    }
  } else {
    // Fallback: name, amenity, shop, tourism containing keyword
    selectors = [
      `node["name"~"${escapedKeyword}",i](area.searchArea);`,
      `way["name"~"${escapedKeyword}",i](area.searchArea);`,
      `node["amenity"~"${escapedKeyword}",i](area.searchArea);`,
      `way["amenity"~"${escapedKeyword}",i](area.searchArea);`,
      `node["shop"~"${escapedKeyword}",i](area.searchArea);`,
      `way["shop"~"${escapedKeyword}",i](area.searchArea);`,
      `node["tourism"~"${escapedKeyword}",i](area.searchArea);`,
      `way["tourism"~"${escapedKeyword}",i](area.searchArea);`
    ];
  }

  return `
    [out:json][timeout:30];
    area["name"="${formattedCity}"]->.searchArea;
    (
      ${selectors.join("\n      ")}
    );
    out body center 50;
  `;
}

// Fetch YouTube Review Videos for a business
async function fetchYouTubeVideos(businessName: string, city: string): Promise<VideoInfo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY || null;
  if (!apiKey) {
    console.warn("YOUTUBE_API_KEY or GOOGLE_API_KEY is not defined. Skipping YouTube search.");
    return [];
  }

  const query = `${businessName} ${city} review`;
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
    query
  )}&maxResults=3&type=video&key=${apiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`YouTube API returned status ${res.status}: ${res.statusText}`);
      return [];
    }

    const data = await res.json() as any;
    const items = data.items || [];
    const videos: VideoInfo[] = [];

    for (const item of items) {
      const videoId = item.id?.videoId || null;
      if (!videoId) continue;

      const title = item.snippet?.title || null;
      const description = item.snippet?.description || null;
      const channelTitle = item.snippet?.channelTitle || null;
      const publishedAt = item.snippet?.publishedAt || null;
      const thumbnail =
        item.snippet?.thumbnails?.high?.url ||
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.default?.url ||
        null;

      videos.push({
        video_title: title,
        video_id: videoId,
        video_url: `https://youtube.com/watch?v=${videoId}`,
        thumbnail_url: thumbnail,
        channel_name: channelTitle,
        published_date: publishedAt,
        short_description: description,
      });
    }

    return videos;
  } catch (error) {
    console.error(`Error searching YouTube for "${query}":`, error);
    return [];
  }
}

export const directorySearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => DirectorySearchInput.parse(d))
  .handler(async ({ data }) => {
    const { searchTerm, city } = data;
    
    // TASK 1: Fetch OSM listings
    const query = getOSMQuery(searchTerm, city);
    
    const OVERPASS_ENDPOINTS = [
      "https://overpass-api.de/api/interpreter",
      "https://lz4.overpass-api.de/api/interpreter",
      "https://z.overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
    ];

    let elements = [];
    let success = false;
    let lastError = null;

    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        console.log(`Querying Overpass endpoint: ${endpoint}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second timeout per mirror
        
        const url = `${endpoint}?data=${encodeURIComponent(query.trim())}`;
        const res = await fetch(url, {
          headers: { "User-Agent": "QuestlyAIDirectoryAgent/1.0" },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (res.ok) {
          const rawData = await res.json() as any;
          elements = rawData.elements || [];
          success = true;
          console.log(`Successfully fetched from ${endpoint}`);
          break;
        } else {
          console.warn(`Endpoint ${endpoint} failed with status ${res.status}`);
          lastError = new Error(`Overpass API returned status ${res.status}`);
        }
      } catch (err: any) {
        console.warn(`Failed to connect to ${endpoint}:`, err?.message || err);
        lastError = err;
      }
    }

    if (!success) {
      throw lastError || new Error("Failed to contact any Overpass API servers");
    }

    const businesses: CombinedBusinessResult[] = [];
    
    try {
      for (const el of elements) {
        const tags = el.tags || {};
        const name = tags.name || tags.operator || tags.brand || null;

        // Construct Address Object
        const streetName = tags["addr:street"] || null;
        const houseNumber = tags["addr:housenumber"] || null;
        const street = houseNumber && streetName ? `${houseNumber} ${streetName}` : streetName;
        const area = tags["addr:suburb"] || tags["addr:neighbourhood"] || tags["addr:district"] || null;
        const addressCity = tags["addr:city"] || city || null;
        const postcode = tags["addr:postcode"] || tags["addr:post_code"] || null;

        const phone = tags.phone || tags["contact:phone"] || tags["phone:mobile"] || null;
        
        let website = tags.website || tags["contact:website"] || tags["url"] || null;
        if (website && !website.startsWith("http")) {
          website = `https://${website}`;
        }

        const openingHours = tags.opening_hours || tags.openinghours || null;
        
        const lat = el.lat || el.center?.lat || null;
        const lon = el.lon || el.center?.lon || null;
        const coordinates = {
          lat: lat ? String(lat) : null,
          lon: lon ? String(lon) : null,
        };

        const category = tags.amenity || tags.shop || tags.tourism || tags.leisure || tags.healthcare || tags.office || null;

        businesses.push({
          basic_info: {
            name,
            address: {
              street,
              area,
              city: addressCity,
              postcode,
            },
            phone,
            website,
            opening_hours: openingHours,
            coordinates,
            category,
          },
          videos: [],
        });
      }

      // TASK 2: Fetch YouTube Review Videos (In parallel but capped or simple loop)
      // Limit to max 50 businesses as requested by user
      const limitList = businesses.slice(0, 50);
      
      const promises = limitList.map(async (biz) => {
        if (biz.basic_info.name) {
          biz.videos = await fetchYouTubeVideos(biz.basic_info.name, city);
        }
      });
      
      await Promise.allSettled(promises);
      
      return limitList;
    } catch (e: any) {
      console.error("Directory Search Agent Pipeline failed:", e?.message || e);
      throw new Error(e?.message || "Search failed");
    }
  });
