const GATEWAY = "https://connector-gateway.lovable.dev/firecrawl/v2";

async function call<T>(path: string, body: unknown, apiKey?: string): Promise<T> {
  const directKey = apiKey || process.env.FIRECRAWL_API_KEY;
  const lovableKey = process.env.LOVABLE_API_KEY;
  
  if (directKey) {
    const res = await fetch(`https://api.firecrawl.dev/v1${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${directKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Firecrawl direct request failed [${res.status}]: ${text.slice(0, 400)}`);
    }
    return (await res.json()) as T;
  } else if (lovableKey) {
    const res = await fetch(`https://connector-gateway.lovable.dev/firecrawl/v2${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Firecrawl Lovable gateway failed [${res.status}]: ${text.slice(0, 400)}`);
    }
    return (await res.json()) as T;
  } else {
    throw new Error("Firecrawl is not connected (missing FIRECRAWL_API_KEY or LOVABLE_API_KEY)");
  }
}

export type SearchHit = {
  url: string;
  title?: string;
  description?: string;
  markdown?: string;
};

export async function firecrawlSearch(
  query: string,
  opts: { limit?: number; country?: string; scrape?: boolean; apiKey?: string } = {},
): Promise<SearchHit[]> {
  const payload: Record<string, unknown> = {
    query,
    limit: opts.limit ?? 10,
  };
  if (opts.country) payload.country = opts.country;
  if (opts.scrape) payload.scrapeOptions = { formats: ["markdown"], onlyMainContent: true };

  const json = await call<any>("/search", payload, opts.apiKey);
  const rows: SearchHit[] = Array.isArray(json?.data)
    ? json.data
    : (json?.data?.web ?? json?.web ?? json?.data?.results ?? []);
  return Array.isArray(rows) ? rows.filter((r) => r && typeof r.url === "string") : [];
}

export async function firecrawlScrape(url: string, apiKey?: string): Promise<{ markdown: string; title?: string } | null> {
  try {
    const json = await call<any>("/scrape", {
      url,
      formats: ["markdown"],
      onlyMainContent: true,
      timeout: 20000,
    }, apiKey);
    const doc = json.data ?? json;
    const markdown: string = doc?.markdown ?? "";
    return { markdown, title: doc?.metadata?.title };
  } catch {
    return null;
  }
}
