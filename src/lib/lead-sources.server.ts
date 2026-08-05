import { firecrawlSearch, firecrawlScrape, type SearchHit } from "./firecrawl.server";
import { generateQueries } from "../server/research/query-generator";

export type SourceKey =
  | "web"
  | "google_maps"
  | "linkedin"
  | "instagram"
  | "facebook"
  | "youtube"
  | "twitter"
  | "yelp"
  | "yellowpages"
  | "crunchbase"
  | "directory";

export const SOURCE_LABELS: Record<SourceKey, string> = {
  web: "Web search",
  google_maps: "Google Maps",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  twitter: "X / Twitter",
  yelp: "Yelp",
  yellowpages: "Yellow Pages",
  crunchbase: "Crunchbase",
  directory: "Business directory",
};

const SOCIAL_HOSTS: Array<{ key: SourceKey; match: RegExp }> = [
  { key: "linkedin", match: /(^|\.)linkedin\.com$/i },
  { key: "instagram", match: /(^|\.)instagram\.com$/i },
  { key: "facebook", match: /(^|\.)facebook\.com$/i },
  { key: "youtube", match: /(^|\.)(youtube\.com|youtu\.be)$/i },
  { key: "twitter", match: /(^|\.)(twitter\.com|x\.com)$/i },
  { key: "yelp", match: /(^|\.)yelp\.[a-z.]+$/i },
  { key: "yellowpages", match: /(^|\.)(yellowpages|yell|justdial|europages|indiamart)\.[a-z.]+$/i },
  { key: "crunchbase", match: /(^|\.)crunchbase\.com$/i },
  { key: "google_maps", match: /(^|\.)(google\.[a-z.]+|maps\.google\.[a-z.]+)$/i },
];

const AGGREGATOR = /(wikipedia|reddit|quora|medium|pinterest|tripadvisor|glassdoor|indeed|amazon|ebay|blogspot|wordpress\.com|github\.com|slideshare|scribd|youtube|facebook|instagram|linkedin|twitter|x\.com|yelp|crunchbase|google\.)/i;

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

export function classify(url: string): SourceKey {
  const host = hostOf(url);
  for (const s of SOCIAL_HOSTS) if (s.match.test(host)) return s.key;
  return "web";
}

export function buildQueries(params: {
  keyword: string;
  industry?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  strategy: "broad" | "balanced" | "narrow";
}): Array<{ source: SourceKey; query: string }> {
  // Generate list of base query terms using our query generator
  const baseQueries = generateQueries(params);
  
  const queries: Array<{ source: SourceKey; query: string }> = [];
  
  for (const q of baseQueries) {
    queries.push({ source: "web", query: `${q} official website contact email` });
    queries.push({ source: "web", query: `${q} companies list contact details` });
    
    // For specific social/directory targets:
    queries.push({ source: "google_maps", query: `${q} site:google.com/maps` });
    queries.push({ source: "linkedin", query: `${q} site:linkedin.com/company` });
    queries.push({ source: "instagram", query: `${q} site:instagram.com` });
    queries.push({ source: "facebook", query: `${q} site:facebook.com` });
    
    if (params.strategy !== "narrow") {
      queries.push({ source: "twitter", query: `${q} site:x.com OR site:twitter.com` });
      queries.push({ source: "yelp", query: `${q} site:yelp.com` });
      queries.push({ source: "yellowpages", query: `${q} site:yellowpages.com OR site:justdial.com OR site:indiamart.com` });
      queries.push({ source: "crunchbase", query: `${q} site:crunchbase.com/organization` });
      queries.push({ source: "directory", query: `${q} business directory listing phone email` });
    }
  }
  
  return queries;
}

export type Candidate = {
  company_name: string;
  website: string | null;
  domain: string;
  sources: Set<SourceKey>;
  socials: Record<string, string>;
  snippets: string[];
  listing_urls: string[];
};

function cleanName(title: string | undefined, host: string): string {
  const raw = (title || host).split(/[|\-–—·:]/)[0]?.trim() || host;
  return raw
    .replace(/\s*\((@[^)]+)\)\s*$/i, "")
    .replace(/\s*(on Instagram|on Facebook|- YouTube|\| LinkedIn|LinkedIn)\s*$/i, "")
    .replace(/^\s*Home\s*$/i, host)
    .slice(0, 160)
    .trim();
}

function socialSlug(url: string): string {
  try {
    const p = new URL(url).pathname.split("/").filter(Boolean);
    return (p[p.length - 1] || p[0] || "").toLowerCase().replace(/^@/, "");
  } catch {
    return "";
  }
}

/** Merge hits from every source into de-duplicated business candidates. */
export function collectCandidates(hits: Array<SearchHit & { source: SourceKey }>): Candidate[] {
  const byKey = new Map<string, Candidate>();
  const socialHits: Array<SearchHit & { source: SourceKey }> = [];

  for (const hit of hits) {
    const host = hostOf(hit.url);
    if (!host) continue;
    const source = classify(hit.url);

    if (source !== "web") {
      socialHits.push({ ...hit, source });
      continue;
    }
    if (AGGREGATOR.test(host)) continue;

    const existing = byKey.get(host);
    if (existing) {
      existing.sources.add(hit.source);
      if (hit.description) existing.snippets.push(hit.description);
      continue;
    }
    byKey.set(host, {
      company_name: cleanName(hit.title, host),
      website: `https://${host}`,
      domain: host,
      sources: new Set<SourceKey>([hit.source, "web"]),
      socials: {},
      snippets: hit.description ? [hit.description] : [],
      listing_urls: [],
    });
  }

  // Attach social/listing profiles to the closest matching candidate, or create one.
  for (const hit of socialHits) {
    const slug = socialSlug(hit.url);
    const name = cleanName(hit.title, hostOf(hit.url));
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const nName = norm(name);
    const nSlug = norm(slug);

    let match: Candidate | undefined;
    for (const c of byKey.values()) {
      const nDomain = norm(c.domain.split(".")[0] || "");
      if (!nDomain) continue;
      if (nDomain === nSlug || nName.includes(nDomain) || nDomain.includes(nSlug || "\u0000")) {
        match = c;
        break;
      }
    }

    if (!match) {
      const key = `${hit.source}:${slug || hit.url}`;
      if (byKey.has(key)) {
        match = byKey.get(key)!;
      } else {
        match = {
          company_name: name,
          website: null,
          domain: key,
          sources: new Set<SourceKey>([hit.source]),
          socials: {},
          snippets: [],
          listing_urls: [],
        };
        byKey.set(key, match);
      }
    }

    match.sources.add(hit.source);
    if (!match.socials[hit.source]) match.socials[hit.source] = hit.url;
    if (hit.description) match.snippets.push(hit.description);
    match.listing_urls.push(hit.url);
  }

  return Array.from(byKey.values()).sort((a, b) => b.sources.size - a.sources.size);
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(\+?\d[\d\s().-]{7,17}\d)/g;

const BAD_EMAIL = /(sentry|example\.com|\.png|\.jpg|\.jpeg|\.gif|\.webp|wixpress|godaddy|@2x)/i;

export function extractContacts(text: string): { emails: string[]; phones: string[] } {
  const emails = Array.from(new Set((text.match(EMAIL_RE) || []).filter((e) => !BAD_EMAIL.test(e)))).slice(0, 5);
  const phones = Array.from(
    new Set(
      (text.match(PHONE_RE) || [])
        .map((p) => p.trim())
        .filter((p) => p.replace(/\D/g, "").length >= 8 && p.replace(/\D/g, "").length <= 15),
    ),
  ).slice(0, 3);
  return { emails, phones };
}

/** Scrape the site (plus /contact) to pull real emails, phones and copy. */
export async function enrichFromSite(website: string): Promise<{
  emails: string[];
  phones: string[];
  text: string;
} | null> {
  const pages = [website, `${website.replace(/\/$/, "")}/contact`];
  const results = await Promise.all(pages.map((p) => firecrawlScrape(p)));
  const text = results
    .filter(Boolean)
    .map((r) => r!.markdown || "")
    .join("\n")
    .slice(0, 20000);
  if (!text) return null;
  const { emails, phones } = extractContacts(text);
  return { emails, phones, text };
}

export async function runSourceSearches(
  queries: Array<{ source: SourceKey; query: string }>,
  opts: { limit: number; country?: string | null },
  onSource?: (source: SourceKey, found: number) => Promise<void> | void,
): Promise<Array<SearchHit & { source: SourceKey }>> {
  const all: Array<SearchHit & { source: SourceKey }> = [];
  const chunks: Array<Array<{ source: SourceKey; query: string }>> = [];
  for (let i = 0; i < queries.length; i += 4) chunks.push(queries.slice(i, i + 4));

  for (const chunk of chunks) {
    const settled = await Promise.allSettled(
      chunk.map((q) =>
        firecrawlSearch(q.query, { limit: opts.limit, country: opts.country || undefined }),
      ),
    );
    for (let i = 0; i < settled.length; i++) {
      const q = chunk[i]!;
      const res = settled[i]!;
      const hits = res.status === "fulfilled" ? res.value : [];
      all.push(...hits.map((h) => ({ ...h, source: q.source })));
      if (onSource) await onSource(q.source, hits.length);
    }
  }
  return all;
}
