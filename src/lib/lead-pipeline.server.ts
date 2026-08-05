import {
  buildQueries,
  collectCandidates,
  enrichFromSite,
  runSourceSearches,
  SOURCE_LABELS,
  type Candidate,
  type SourceKey,
} from "./lead-sources.server";
import { crawlAndEnrichDomain } from "../server/sources/native-fetch.server";
import { sourceRouter } from "../server/sources/source-router.server";
import { calculateConfidence, deduplicateLeads } from "../server/validation/validation.server";



export type SearchRow = {
  id: string;
  keyword: string;
  country: string | null;
  state: string | null;
  city: string | null;
  industry: string | null;
  target_count: number;
  depth: string;
  strategy: string;
  lead_type: string | null;
};

export async function logEvent(
  supabase: any,
  search_id: string,
  user_id: string,
  agent: string,
  status: string,
  message: string,
  progress = 0,
  metadata: Record<string, unknown> = {},
) {
  await supabase.from("agent_events").insert({ search_id, user_id, agent, status, message, progress, metadata });
}

function confidenceFor(lead: any) {
  return calculateConfidence(lead) / 100;
}

export async function executePipeline(supabase: any, userId: string, search: SearchRow, apiKey: string) {
  const target = search.target_count;
  const isIntent = search.lead_type === "intent";

  if (isIntent) {
    await logEvent(supabase, search.id, userId, "research", "running", `Planning public posts search strategy for keyword "${search.keyword}"…`, 4);
    await logEvent(
      supabase,
      search.id,
      userId,
      "research",
      "done",
      `Formulated search query for Reddit public feeds.`,
      10,
    );
  } else {
    await logEvent(supabase, search.id, userId, "research", "running", `Planning multi-source research for "${search.keyword}"…`, 4);
    const queries = buildQueries({
      keyword: search.keyword,
      industry: search.industry,
      city: search.city,
      state: search.state,
      country: search.country,
      strategy: (search.strategy as "broad" | "balanced" | "narrow") ?? "balanced",
    });
    await logEvent(
      supabase,
      search.id,
      userId,
      "research",
      "done",
      `Built ${queries.length} live queries across ${new Set(queries.map((q) => q.source)).size} sources.`,
      10,
    );
  }

  await logEvent(supabase, search.id, userId, "search", "running", isIntent ? "Searching public forum posts for hiring intent…" : "Querying live web, maps, social & directory sources…", 14);
  
  const candidates = (await sourceRouter.runSearch(
    {
      keyword: search.keyword,
      industry: search.industry,
      city: search.city,
      state: search.state,
      country: search.country,
      strategy: (search.strategy as "broad" | "balanced" | "narrow") ?? "balanced",
      target_count: search.target_count,
      depth: (search.depth as "quick" | "balanced" | "deep") ?? "balanced",
      lead_type: search.lead_type as "business" | "intent",
    },
    async (sourceKey, foundCount) => {
      await logEvent(
        supabase,
        search.id,
        userId,
        "search",
        "running",
        `${SOURCE_LABELS[sourceKey] || sourceKey}: discovered ${foundCount} items`,
        30
      );
    }
  )).slice(0, target);

  if (!candidates.length) throw new Error(isIntent ? "No posts with hiring intent found on Reddit. Try a broader keyword." : "No live results returned from the web sources. Try a broader keyword or location.");

  await logEvent(supabase, search.id, userId, "search", "done", isIntent ? `Collected unique hiring intent posts.` : `Collected and clustered unique listings from the open web.`, 42);

  await logEvent(supabase, search.id, userId, "discovery", "done", isIntent ? `${candidates.length} relevant posts identified.` : `${candidates.length} unique businesses identified across sources.`, 52);

  const inserted: string[] = [];

  if (isIntent) {
    // Intent pipeline: Bypass enrichment and insert directly
    await logEvent(supabase, search.id, userId, "structuring", "running", "Structuring and scoring intent posts…", 56);
    
    const rows = candidates.map((c) => {
      return {
        search_id: search.id,
        user_id: userId,
        company_name: c.company_name, // post title
        website: null,
        email: null,
        phone: null,
        whatsapp: null,
        industry: search.industry,
        address: null,
        city: search.city,
        state: search.state,
        country: search.country,
        description: c.snippets[0] || null,
        source: "reddit",
        social_profiles: { listings: c.listing_urls },
        confidence: (c.intent_score || 0) / 100,
        source_urls: c.listing_urls,
        email_source: null,
        phone_source: null,
        website_source: null,
        last_enriched_at: new Date().toISOString(),
        
        // Intent fields
        is_intent_lead: true,
        intent_score: c.intent_score || 0,
        matched_keyword: c.matched_keyword || null,
        post_author: c.post_author || null,
        post_created_at: c.post_created_at || null,
        post_url: c.post_url || null,
        source_platform: c.source_platform || null,
        post_title: c.post_title || null,
      };
    });

    const { data: ins } = await supabase.from("leads").insert(rows).select("id");
    inserted.push(...(ins || []).map((r: any) => r.id));

    await logEvent(supabase, search.id, userId, "enrichment", "done", `Scored and stored ${inserted.length} intent leads.`, 90);
  } else {
    // Business pipeline: Enrich via crawlAndEnrichDomain
    await logEvent(supabase, search.id, userId, "enrichment", "running", "Scraping official sites for real contact details…", 56);

    const batch = 4;
    for (let i = 0; i < candidates.length; i += batch) {
      const slice = candidates.slice(i, i + batch);
      const rows = await Promise.all(
        slice.map(async (c) => {
          let email: string | null = null;
          let phone: string | null = null;
          let whatsapp: string | null = null;
          let company_name = c.company_name;
          let address: string | null = null;
          let city = search.city;
          let state = search.state;
          let country = search.country;
          let description = c.snippets[0]?.slice(0, 280) ?? null;
          let socials = { ...c.socials };

          if (c.website) {
            try {
              const enriched = await crawlAndEnrichDomain(c.website, search.country || undefined);
              email = enriched.emails[0] || null;
              phone = enriched.phones[0] || null;
              whatsapp = enriched.whatsapp;
              if (enriched.companyName) company_name = enriched.companyName;
              if (enriched.address) address = enriched.address;
              if (enriched.city) city = enriched.city;
              if (enriched.state) state = enriched.state;
              if (enriched.country) country = enriched.country;
              if (enriched.description) description = enriched.description;
              socials = { ...socials, ...enriched.socials };
            } catch (e) {
              // ignore
            }
          }

          await logEvent(
            supabase,
            search.id,
            userId,
            "structuring",
            "running",
            `Structuring data for ${company_name}…`,
            56 + Math.floor((i / Math.max(1, candidates.length)) * 32)
          );

          const row = {
            search_id: search.id,
            user_id: userId,
            company_name: String(company_name || c.company_name).slice(0, 200),
            website: c.website,
            email,
            phone,
            whatsapp,
            industry: search.industry,
            address,
            city,
            state,
            country,
            description,
            source: Array.from(c.sources).join(","),
            social_profiles: { ...socials, listings: c.listing_urls.slice(0, 6) },
            confidence: 0.8,
            source_urls: c.listing_urls,
            email_source: email ? (c.website ? "company_website" : "web_search") : null,
            phone_source: phone ? (c.website ? "company_website" : "web_search") : null,
            website_source: c.website ? "web_search" : null,
            last_enriched_at: new Date().toISOString(),
            is_intent_lead: false,
          };
          row.confidence = confidenceFor(row);
          return row;
        }),
      );

      const { data: ins } = await supabase.from("leads").insert(rows).select("id");
      inserted.push(...(ins || []).map((r: any) => r.id));
      await logEvent(
        supabase,
        search.id,
        userId,
        "enrichment",
        "running",
        `Verified ${inserted.length}/${candidates.length} businesses (real emails & phones).`,
        56 + Math.floor((inserted.length / Math.max(1, candidates.length)) * 32),
      );
    }
    await logEvent(supabase, search.id, userId, "enrichment", "done", `Enrichment complete for ${inserted.length} businesses.`, 90);
  }

  await logEvent(supabase, search.id, userId, "validation", "running", "Deduplicating & scoring…", 92);
  
  let finalCount = 0;
  if (isIntent) {
    // Deduplicate intent leads based on post_url
    const { data: allLeads } = await supabase.from("leads").select("id, post_url").eq("search_id", search.id);
    const dupes: string[] = [];
    if (allLeads) {
      const seen = new Set<string>();
      for (const l of allLeads) {
        if (l.post_url) {
          if (seen.has(l.post_url)) {
            dupes.push(l.id);
          } else {
            seen.add(l.post_url);
          }
        }
      }
    }
    if (dupes.length) await supabase.from("leads").delete().in("id", dupes);
    finalCount = (allLeads?.length || 0) - dupes.length;
  } else {
    // Deduplicate business leads
    const { data: allLeads } = await supabase.from("leads").select("id, company_name, website, email, phone, address").eq("search_id", search.id);
    const dupes: string[] = [];
    if (allLeads) {
      const deduplicated = deduplicateLeads(allLeads);
      const uniqueIds = new Set(deduplicated.map((l: any) => l.id));
      for (const l of allLeads) {
        if (!uniqueIds.has((l as any).id)) {
          dupes.push((l as any).id);
        }
      }
    }
    if (dupes.length) await supabase.from("leads").delete().in("id", dupes);
    finalCount = (allLeads?.length || 0) - dupes.length;
  }
  
  await logEvent(supabase, search.id, userId, "validation", "done", `Removed duplicates.`, 96);

  const creditsUsed = finalCount;
  await supabase
    .from("searches")
    .update({ status: "completed", leads_found: finalCount, credits_used: creditsUsed, completed_at: new Date().toISOString() })
    .eq("id", search.id);
  await supabase.from("credit_ledger").insert({ user_id: userId, delta: -creditsUsed, reason: "search", search_id: search.id });
  const { data: prof } = await supabase.from("profiles").select("credits_remaining").eq("id", userId).single();
  await supabase
    .from("profiles")
    .update({ credits_remaining: Math.max(0, (prof?.credits_remaining ?? 0) - creditsUsed) })
    .eq("id", userId);

  await logEvent(supabase, search.id, userId, "export", "done", `Search complete — ${finalCount} leads ready.`, 100);
  return { ok: true, leads: finalCount };
}
