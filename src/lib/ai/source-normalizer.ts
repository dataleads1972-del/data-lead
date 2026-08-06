export type SourcePlatformType =
  | "reddit"
  | "youtube"
  | "threads"
  | "x"
  | "discourse"
  | "rss"
  | "hackernews"
  | "mastodon"
  | "trade_database"
  | "business_directory"
  | "firecrawl"
  | "other";

export type RecordKindType =
  | "post"
  | "comment"
  | "reply"
  | "article"
  | "company"
  | "trade_record"
  | "webpage"
  | "video"
  | "other";

export interface DataLeadSourceRecord {
  id: string;
  source: SourcePlatformType;
  recordType: RecordKindType;
  title?: string;
  content?: string;
  author?: string;
  companyName?: string;
  companyDescription?: string;
  sourceUrl?: string;
  publishedAt?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Generates a consistent hash for duplicate prevention & caching
 */
export function generateContentHash(record: DataLeadSourceRecord): string {
  const str = `${record.source}:${record.id}:${record.title || ""}:${record.content || ""}:${record.companyName || ""}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `h_${Math.abs(hash).toString(36)}`;
}

/**
 * Normalizes a generic lead row or post into a DataLeadSourceRecord
 */
export function normalizeSourceRecord(raw: any): DataLeadSourceRecord {
  if (!raw) {
    return {
      id: "unknown",
      source: "other",
      recordType: "other",
      content: "",
    };
  }

  // Handle existing DataLead Lead row format
  if (raw.company_name || raw.description || raw.source) {
    const sourceStr = (raw.source || raw.source_platform || "other").toLowerCase();
    let platform: SourcePlatformType = "other";
    
    if (sourceStr.includes("reddit")) platform = "reddit";
    else if (sourceStr.includes("youtube")) platform = "youtube";
    else if (sourceStr.includes("thread")) platform = "threads";
    else if (sourceStr.includes("x") || sourceStr.includes("twitter")) platform = "x";
    else if (sourceStr.includes("discourse") || sourceStr.includes("forum")) platform = "discourse";
    else if (sourceStr.includes("rss")) platform = "rss";
    else if (sourceStr.includes("hacker") || sourceStr.includes("hn")) platform = "hackernews";
    else if (sourceStr.includes("mastodon")) platform = "mastodon";
    else if (sourceStr.includes("trade") || sourceStr.includes("import") || sourceStr.includes("export")) platform = "trade_database";
    else if (sourceStr.includes("directory") || sourceStr.includes("places") || sourceStr.includes("google")) platform = "business_directory";
    else if (sourceStr.includes("firecrawl") || sourceStr.includes("web")) platform = "firecrawl";

    return {
      id: raw.id || raw.post_id || `lead_${Date.now()}`,
      source: platform,
      recordType: platform === "trade_database" ? "trade_record" : platform === "business_directory" ? "company" : "post",
      title: raw.post_title || raw.company_name || undefined,
      content: raw.description || raw.body || raw.content || "",
      author: raw.post_author || raw.author || undefined,
      companyName: raw.company_name || undefined,
      companyDescription: raw.description || undefined,
      sourceUrl: raw.post_url || raw.website || raw.source_url || undefined,
      publishedAt: raw.post_created_at || raw.created_at || undefined,
      metadata: {
        industry: raw.industry,
        country: raw.country,
        city: raw.city,
        matched_keyword: raw.matched_keyword,
        intent_score: raw.intent_score,
      },
    };
  }

  // Default fallback
  return {
    id: raw.id || `rec_${Date.now()}`,
    source: raw.source || "other",
    recordType: raw.recordType || "post",
    title: raw.title,
    content: raw.content || raw.body || "",
    author: raw.author,
    companyName: raw.companyName,
    companyDescription: raw.companyDescription,
    sourceUrl: raw.sourceUrl,
    publishedAt: raw.publishedAt,
    metadata: raw.metadata || {},
  };
}
