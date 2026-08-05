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

function parseRSS2JSON(data: any, subreddit: string) {
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

    return {
      id: item.guid || `rss2json_${i}`,
      subreddit,
      title: decodeHTMLEntities(item.title || ""),
      body: body.slice(0, 500),
      author,
      createdAt: item.pubDate || new Date().toISOString(),
      permalink: item.link || "",
      url: item.link || ""
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

    // Build target subreddits to fetch
    const subCandidates: string[] = [];
    if (isSubreddit) {
      subCandidates.push(sanitizedSub);
    } else {
      const cleanWord = rawQuery.replace(/[^a-z0-9]/gi, "").toLowerCase();
      if (cleanWord && cleanWord.length > 2) {
        subCandidates.push(cleanWord);
      }
      subCandidates.push("startups");
      subCandidates.push("SaaS");
      subCandidates.push("webdev");
    }

    let lastError = "";

    // Step 1: Direct RSS Fetch
    for (const sub of subCandidates) {
      const rssUrl = `https://www.reddit.com/r/${sub}/hot.rss`;
      try {
        debugLog.push(`[${new Date().toLocaleTimeString()}] Direct Fetching URL: ${rssUrl}`);
        const res = await fetch(rssUrl, {
          headers: {
            "User-Agent": USER_AGENT,
            "Accept": "application/atom+xml, application/xml, text/xml, */*"
          }
        });

        debugLog.push(`[${new Date().toLocaleTimeString()}] Direct Status: ${res.status} ${res.statusText}`);

        if (res.ok) {
          const xmlText = await res.text();
          if (xmlText && xmlText.length > 0) {
            let posts = parseRedditRSS(xmlText, sub);
            if (!isSubreddit && posts.length > 0) {
              const qLower = rawQuery.toLowerCase();
              const filtered = posts.filter(p => p.title.toLowerCase().includes(qLower) || p.body.toLowerCase().includes(qLower));
              if (filtered.length > 0) posts = filtered;
            }
            if (posts.length > 0) {
              rssCache.set(cacheKey, { posts, timestamp: Date.now(), searchType });
              debugLog.push(`[${new Date().toLocaleTimeString()}] Cached ${posts.length} posts via Direct RSS`);
              return { posts, debugLog, status: 200, searchType, query: isSubreddit ? sanitizedSub : rawQuery };
            }
          }
        } else {
          lastError = `Status ${res.status}`;
        }
      } catch (err: any) {
        debugLog.push(`[${new Date().toLocaleTimeString()}] Direct fetch exception: ${err.message}`);
        lastError = err.message;
      }
    }

    // Step 2: Cloud RSS Bridge Fallback (Bypasses Vercel datacenter IP 429/403 rate limits)
    debugLog.push(`[${new Date().toLocaleTimeString()}] Direct fetches rate limited on cloud IP. Running Cloud RSS Bridge...`);
    for (const sub of subCandidates) {
      try {
        const rssUrl = `https://www.reddit.com/r/${sub}/hot.rss`;
        const bridgeUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
        debugLog.push(`[${new Date().toLocaleTimeString()}] Bridge Fetching: ${bridgeUrl}`);

        const bridgeRes = await fetch(bridgeUrl);
        if (bridgeRes.ok) {
          const data = await bridgeRes.json();
          if (data.status === "ok" && data.items && data.items.length > 0) {
            let posts = parseRSS2JSON(data, sub);
            if (!isSubreddit && posts.length > 0) {
              const qLower = rawQuery.toLowerCase();
              const filtered = posts.filter(p => p.title.toLowerCase().includes(qLower) || p.body.toLowerCase().includes(qLower));
              if (filtered.length > 0) posts = filtered;
            }
            if (posts.length > 0) {
              rssCache.set(cacheKey, { posts, timestamp: Date.now(), searchType });
              debugLog.push(`[${new Date().toLocaleTimeString()}] Cached ${posts.length} posts via Cloud RSS Bridge`);
              return { posts, debugLog, status: 200, searchType, query: isSubreddit ? sanitizedSub : rawQuery };
            }
          }
        }
      } catch (bridgeErr: any) {
        debugLog.push(`[${new Date().toLocaleTimeString()}] Bridge exception for ${sub}: ${bridgeErr.message}`);
      }
    }

    // Fallback to stale cache if available
    if (cached && cached.posts.length > 0) {
      debugLog.push(`[${new Date().toLocaleTimeString()}] Live fetch rate limited. Returning stale cache (${cached.posts.length} posts)`);
      return { posts: cached.posts, debugLog, status: 200, searchType, query: isSubreddit ? sanitizedSub : rawQuery };
    }

    return {
      posts: [],
      debugLog: [...debugLog, `[${new Date().toLocaleTimeString()}] All endpoints failed. Last error: ${lastError}`],
      status: 500,
      searchType,
      query: isSubreddit ? sanitizedSub : rawQuery
    };
  });
