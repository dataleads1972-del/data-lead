import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseRedditRSS(xmlText: string, fallbackSubreddit: string) {
  const blocks = xmlText.split("<entry>");
  const posts: any[] = [];

  for (let i = 1; i < blocks.length; i++) {
    const entryContent = blocks[i].split("</entry>")[0];
    
    const titleMatch = entryContent.match(/<title>([\s\S]*?)<\/title>/);
    const title = titleMatch ? decodeHTMLEntities(titleMatch[1]) : "";
    
    const authorMatch = entryContent.match(/<author><name>([\s\S]*?)<\/name>/);
    const rawAuthor = authorMatch ? authorMatch[1] : "";
    const author = rawAuthor.replace(/^\/u\//i, "");
    
    const linkMatch = entryContent.match(/href="([^"]+)"/);
    const permalink = linkMatch ? linkMatch[1] : "";
    
    const subMatch = permalink.match(/\/r\/([^\/]+)\//i) || entryContent.match(/<category term="([^\"]+)"/i);
    const subreddit = subMatch ? subMatch[1] : fallbackSubreddit;

    const updatedMatch = entryContent.match(/<updated>([\s\S]*?)<\/updated>/);
    const createdAt = updatedMatch ? updatedMatch[1] : new Date().toISOString();
    
    const contentMatch = entryContent.match(/<content type="html">([\s\S]*?)<\/content>/);
    let body = "";
    if (contentMatch) {
      const html = contentMatch[1];
      const mdDivMatch = html.match(/&lt;div class="md"&gt;([\s\S]*?)&lt;\/div&gt;/);
      let contentHtml = mdDivMatch ? mdDivMatch[1] : html;
      
      body = contentHtml
        .replace(/&lt;[\s\S]*?&gt;/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/submitted by[\s\S]+/, "")
        .trim();
    }
    
    const idMatch = entryContent.match(/<id>([\s\S]*?)<\/id>/);
    let id = "";
    if (idMatch) {
      const idUrl = idMatch[1];
      const matchT3 = idUrl.match(/t3_[a-z0-9]+/i);
      id = matchT3 ? matchT3[0] : idUrl.split("/").pop() || "";
    }

    posts.push({
      id: id || `rss_${posts.length}`,
      subreddit,
      title,
      body: body.slice(0, 500),
      author,
      createdAt,
      permalink,
      url: permalink
    });
  }

  return posts;
}

function parseRSS2JSON(data: any, fallbackSubreddit: string) {
  const items = data?.items || [];
  return items.map((item: any, i: number) => {
    let body = item.content || item.description || "";
    body = body
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/submitted by[\s\S]+/, "")
      .trim();

    const rawAuthor = item.author || "";
    const author = rawAuthor.replace(/^\/u\//i, "");

    const permalink = item.link || "";
    const subMatch = permalink.match(/\/r\/([^\/]+)\//i);
    const subreddit = subMatch ? subMatch[1] : fallbackSubreddit;

    return {
      id: item.guid || `rss2json_${i}`,
      subreddit,
      title: decodeHTMLEntities(item.title || ""),
      body: body.slice(0, 500),
      author,
      createdAt: item.pubDate || new Date().toISOString(),
      permalink,
      url: permalink
    };
  });
}

export interface FetchRedditResult {
  posts: any[];
  debugLog: string[];
  status: number;
  searchType: "subreddit" | "keyword";
  query: string;
}

// In-Memory Server Cache (60 second TTL per query)
interface CacheEntry {
  posts: any[];
  timestamp: number;
  searchType: "subreddit" | "keyword";
}
const rssCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000;

const USER_AGENT = "script:questly-ai-leads:v1.0.0 (by /u/datalead)";

const stopWords = new Set([
  "a","an","the","for","is","in","at","of","to","and","or","on","with",
  "my","our","i","you","we","me","us","be","have","has","had","do","does",
  "did","would","should","could","please","want","any","some"
]);

function extractSearchTerms(rawQuery: string): string[] {
  const words = rawQuery.trim().split(/\s+/);
  const filtered = words.filter(w => !stopWords.has(w.toLowerCase().replace(/[^a-z0-9]/g, "")));
  const terms: string[] = [];

  if (filtered.length > 0) {
    terms.push(filtered.join(" "));
  }
  if (filtered.length > 1) {
    terms.push(filtered[filtered.length - 1]);
  }
  terms.push(rawQuery);

  return [...new Set(terms)];
}

export const fetchRedditSubPosts = createServerFn({ method: "GET" })
  .validator((d: unknown) =>
    z.object({
      subreddit: z.string()
    }).parse(d)
  )
  .handler(async ({ data }): Promise<FetchRedditResult> => {
    const rawQuery = data.subreddit.trim();
    const debugLog: string[] = [];

    if (!rawQuery) {
      return { posts: [], debugLog: ["Empty query"], status: 200, searchType: "subreddit", query: "startups" };
    }

    let isSubreddit = false;
    let sanitizedSub = rawQuery;

    if (rawQuery.toLowerCase().startsWith("r/")) {
      isSubreddit = true;
      sanitizedSub = rawQuery.substring(2).trim().replace(/\s+/g, "");
    }

    const searchType: "subreddit" | "keyword" = isSubreddit ? "subreddit" : "keyword";
    const cacheKey = `${searchType}:${(isSubreddit ? sanitizedSub : rawQuery).toLowerCase()}`;
    const now = Date.now();
    const cached = rssCache.get(cacheKey);

    // Check memory cache first
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      const ageSeconds = Math.round((now - cached.timestamp) / 1000);
      debugLog.push(`[${new Date().toLocaleTimeString()}] Cache HIT for ${searchType} "${rawQuery}" (${cached.posts.length} posts, age: ${ageSeconds}s)`);
      return {
        posts: cached.posts,
        debugLog,
        status: 200,
        searchType,
        query: isSubreddit ? sanitizedSub : rawQuery
      };
    }

    debugLog.push(`[${new Date().toLocaleTimeString()}] Cache MISS. Executing ${searchType} search for: "${rawQuery}"`);

    // MODE 1: Subreddit Feed Search (e.g. r/startups, r/hotels, r/SaaS)
    if (isSubreddit) {
      const targetSub = sanitizedSub.toLowerCase();
      const rssUrls = [
        `https://www.reddit.com/r/${targetSub}/hot.rss`,
        `https://www.reddit.com/r/${targetSub}/.rss`
      ];

      for (const rssUrl of rssUrls) {
        try {
          debugLog.push(`[${new Date().toLocaleTimeString()}] Fetching Subreddit RSS: ${rssUrl}`);
          const res = await fetch(rssUrl, { headers: { "User-Agent": USER_AGENT } });
          if (res.ok) {
            const xmlText = await res.text();
            const posts = parseRedditRSS(xmlText, targetSub);
            if (posts.length > 0) {
              rssCache.set(cacheKey, { posts, timestamp: Date.now(), searchType });
              return { posts, debugLog, status: 200, searchType, query: targetSub };
            }
          }
        } catch {}

        // RSS Bridge Fallback for Subreddit
        try {
          const bridgeUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
          const bridgeRes = await fetch(bridgeUrl);
          if (bridgeRes.ok) {
            const json = await bridgeRes.json();
            if (json.status === "ok" && json.items && json.items.length > 0) {
              const posts = parseRSS2JSON(json, targetSub);
              if (posts.length > 0) {
                rssCache.set(cacheKey, { posts, timestamp: Date.now(), searchType });
                return { posts, debugLog, status: 200, searchType, query: targetSub };
              }
            }
          }
        } catch {}
      }

      return { posts: [], debugLog, status: 404, searchType: "subreddit", query: sanitizedSub };
    }

    // MODE 2: Global Keyword Intent Search (e.g. "box", "hotel", "looking for a developer")
    const searchTerms = extractSearchTerms(rawQuery);
    debugLog.push(`[${new Date().toLocaleTimeString()}] Keyword terms to search: ${searchTerms.join(", ")}`);

    for (const term of searchTerms) {
      const searchRssUrl = `https://www.reddit.com/search.rss?q=${encodeURIComponent(term)}&sort=new`;
      
      // Attempt 1: Direct Search RSS
      try {
        debugLog.push(`[${new Date().toLocaleTimeString()}] Fetching Search RSS for term "${term}": ${searchRssUrl}`);
        const res = await fetch(searchRssUrl, { headers: { "User-Agent": USER_AGENT } });
        if (res.ok) {
          const xmlText = await res.text();
          const posts = parseRedditRSS(xmlText, "search");
          if (posts.length > 0) {
            rssCache.set(cacheKey, { posts, timestamp: Date.now(), searchType });
            return { posts, debugLog, status: 200, searchType: "keyword", query: rawQuery };
          }
        }
      } catch {}

      // Attempt 2: Bridge Search RSS
      try {
        const bridgeUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(searchRssUrl)}`;
        debugLog.push(`[${new Date().toLocaleTimeString()}] Bridge Fetching Search RSS: ${bridgeUrl}`);
        const bridgeRes = await fetch(bridgeUrl);
        if (bridgeRes.ok) {
          const json = await bridgeRes.json();
          if (json.status === "ok" && json.items && json.items.length > 0) {
            const posts = parseRSS2JSON(json, "search");
            if (posts.length > 0) {
              rssCache.set(cacheKey, { posts, timestamp: Date.now(), searchType });
              return { posts, debugLog, status: 200, searchType: "keyword", query: rawQuery };
            }
          }
        }
      } catch {}
    }

    // Return empty results if keyword search yields no items (NEVER fallback to r/startups!)
    return {
      posts: [],
      debugLog: [...debugLog, `[${new Date().toLocaleTimeString()}] No matching posts found for "${rawQuery}"`],
      status: 200,
      searchType: "keyword",
      query: rawQuery
    };
  });
