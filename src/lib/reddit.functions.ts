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

const stopWords = new Set([
  "a","an","the","for","is","in","at","of","to","and","or","on","with",
  "my","our","i","you","we","me","us","be","have","has","had","do","does",
  "did","would","should","could","please","want","any","some","need"
]);

function getQueryEndpoints(rawQuery: string, isSubreddit: boolean, sanitizedSub: string): string[] {
  if (isSubreddit) {
    return [
      `https://www.reddit.com/r/${sanitizedSub}/hot/.rss`,
      `https://www.reddit.com/r/${sanitizedSub}/.rss`
    ];
  }

  const words = rawQuery.trim().split(/\s+/);
  const filtered = words.filter(w => !stopWords.has(w.toLowerCase().replace(/[^a-z0-9]/g, "")));
  const candidateQueries: string[] = [];

  // Candidate 1: Cleaned non-stopword query (e.g. "looking developer")
  if (filtered.length > 0) {
    candidateQueries.push(filtered.join(" "));
  }

  // Candidate 2: Core noun/keyword (e.g. "developer")
  if (filtered.length > 1) {
    candidateQueries.push(filtered[filtered.length - 1]);
  }

  // Candidate 3: Original raw query string
  candidateQueries.push(rawQuery);

  const unique = [...new Set(candidateQueries)];
  return unique.map(q => `https://www.reddit.com/search/.rss?q=${encodeURIComponent(q)}&sort=new`);
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

    const endpoints = getQueryEndpoints(rawQuery, isSubreddit, sanitizedSub);
    let lastError = "";

    for (const url of endpoints) {
      try {
        debugLog.push(`[${new Date().toLocaleTimeString()}] Fetching URL: ${url}`);
        const res = await fetch(url, {
          headers: {
            "User-Agent": "QuestlyLeadAgent/1.0.0"
          }
        });

        debugLog.push(`[${new Date().toLocaleTimeString()}] HTTP Status: ${res.status} ${res.statusText}`);

        if (res.status === 429) {
          debugLog.push(`[${new Date().toLocaleTimeString()}] Rate limited (429) by Reddit for ${url}`);
          lastError = "Reddit rate limit reached (429). Please wait a few seconds.";
          // Brief pause before trying next candidate if rate limited
          await new Promise(r => setTimeout(r, 300));
          continue;
        }

        if (!res.ok) {
          debugLog.push(`[${new Date().toLocaleTimeString()}] Non-OK response (${res.status}) for ${url}`);
          lastError = `Query "${rawQuery}" returned status ${res.status}`;
          continue;
        }

        const xmlText = await res.text();
        debugLog.push(`[${new Date().toLocaleTimeString()}] Received XML payload (${xmlText.length} bytes)`);

        if (!xmlText || xmlText.length === 0) {
          debugLog.push(`[${new Date().toLocaleTimeString()}] Received 0-byte payload for ${url}`);
          lastError = "Received empty 0-byte payload from Reddit";
          continue;
        }

        const posts = parseRedditRSS(xmlText, isSubreddit ? sanitizedSub : "search");
        debugLog.push(`[${new Date().toLocaleTimeString()}] Successfully parsed ${posts.length} posts from Atom XML`);

        if (posts.length > 0) {
          rssCache.set(cacheKey, { posts, timestamp: Date.now(), searchType });
          debugLog.push(`[${new Date().toLocaleTimeString()}] Cached ${posts.length} posts for "${cacheKey}" in server memory`);
          return {
            posts,
            debugLog,
            status: res.status,
            searchType,
            query: isSubreddit ? sanitizedSub : rawQuery
          };
        }
      } catch (err: any) {
        debugLog.push(`[${new Date().toLocaleTimeString()}] Exception during fetch: ${err.message}`);
        lastError = err.message;
      }
    }

    // Fallback to stale cache if rate limited or empty
    if (cached && cached.posts.length > 0) {
      debugLog.push(`[${new Date().toLocaleTimeString()}] Live fetch rate limited. Returning stale cache (${cached.posts.length} posts)`);
      return {
        posts: cached.posts,
        debugLog,
        status: 200,
        searchType,
        query: isSubreddit ? sanitizedSub : rawQuery
      };
    }

    return {
      posts: [],
      debugLog: [...debugLog, `[${new Date().toLocaleTimeString()}] All endpoints failed. Last error: ${lastError}`],
      status: 500,
      searchType,
      query: isSubreddit ? sanitizedSub : rawQuery
    };
  });
