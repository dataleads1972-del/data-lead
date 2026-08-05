import { SourceKey } from "../../lib/lead-sources.server";

export interface CandidateLead {
  company_name: string;
  website: string | null;
  domain: string;
  sources: Set<SourceKey>;
  socials: Record<string, string>;
  snippets: string[];
  listing_urls: string[];
  
  // Intent-related fields
  is_intent_lead?: boolean;
  intent_score?: number;
  matched_keyword?: string;
  post_author?: string;
  post_created_at?: string;
  post_url?: string;
  source_platform?: string;
  post_title?: string;
}

export interface SearchParams {
  keyword: string;
  industry?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  strategy: "broad" | "balanced" | "narrow";
  target_count: number;
  depth: "quick" | "balanced" | "deep";
  lead_type?: "business" | "intent";
}

export interface LeadSource {
  name: string;
  sourceKey: SourceKey;
  isEnabled(): Promise<boolean> | boolean;
  search(params: SearchParams): Promise<CandidateLead[]>;
}
