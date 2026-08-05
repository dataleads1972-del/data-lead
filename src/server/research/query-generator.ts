import { getModifiers } from "./industry-templates";

export interface QueryParams {
  keyword: string;
  industry?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  strategy: "broad" | "balanced" | "narrow";
}

export function generateQueries(params: QueryParams): string[] {
  const keyword = params.keyword.trim();
  const locationParts = [params.city, params.state, params.country]
    .map(p => p?.trim())
    .filter(Boolean);
  const locationStr = locationParts.join(" ");

  // Narrow strategy uses only direct queries
  if (params.strategy === "narrow") {
    const baseQuery = locationStr ? `${keyword} ${locationStr}` : keyword;
    return [baseQuery];
  }

  // Get modifiers based on industry
  const modifiers = getModifiers(params.industry);
  const queries = new Set<string>();

  // Main direct queries
  queries.add(locationStr ? `${keyword} ${locationStr}` : keyword);
  if (params.industry) {
    const indBase = locationStr ? `${params.industry} ${locationStr}` : params.industry;
    queries.add(indBase);
    queries.add(`${keyword} ${params.industry} ${locationStr}`.trim());
  }

  // Use a subset of modifiers depending on strategy to prevent runaway searches
  // balanced: up to 3 modifiers, broad: up to 5 modifiers
  const limit = params.strategy === "broad" ? 5 : 3;
  const activeModifiers = modifiers.slice(0, limit);

  for (const modifier of activeModifiers) {
    if (locationStr) {
      queries.add(`${keyword} ${modifier} ${locationStr}`);
    } else {
      queries.add(`${keyword} ${modifier}`);
    }
  }

  // Broad strategy adds some extra discovery phrases
  if (params.strategy === "broad" && locationStr) {
    queries.add(`top ${keyword} in ${locationStr}`);
    queries.add(`best ${keyword} providers ${locationStr}`);
  }

  return Array.from(queries);
}
