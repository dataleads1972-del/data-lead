import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { tradeRouterServer } from "@/server/trade/trade-router.server";
import { TradeFilterParams, TradeRecord } from "./trade-data/trade-data.types";

const SearchTradeInput = z.object({
  country: z.string().min(1),
  providerId: z.string().min(1),
  tradeDirection: z.enum(["imports", "exports", "both"]).default("both"),
  companyQuery: z.string().optional(),
  productQuery: z.string().optional(),
  hsCode: z.string().optional(),
  originCountry: z.string().optional(),
  destinationCountry: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const searchTradeData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => SearchTradeInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const params: TradeFilterParams = {
      country: data.country,
      providerId: data.providerId,
      tradeDirection: data.tradeDirection,
      companyQuery: data.companyQuery,
      productQuery: data.productQuery,
      hsCode: data.hsCode,
      originCountry: data.originCountry,
      destinationCountry: data.destinationCountry,
      dateFrom: data.dateFrom,
      dateTo: data.dateTo,
    };

    const { records, totalCount } = await tradeRouterServer.executeTradeSearch(params);

    // Log trade search to database
    await (supabase as any).from("trade_searches").insert({
      user_id: userId,
      country: data.country,
      provider_id: data.providerId,
      direction: data.tradeDirection,
      product_query: data.productQuery || null,
      hs_code: data.hsCode || null,
      company_query: data.companyQuery || null,
      origin_country: data.originCountry || null,
      destination_country: data.destinationCountry || null,
      results_count: totalCount,
    });

    return {
      success: true,
      records,
      totalCount,
    };
  });

const SaveTradeLeadInput = z.object({
  tradeRecord: z.any(),
});

export const saveTradeRecordAsLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => SaveTradeLeadInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const rec: TradeRecord = data.tradeRecord;

    if (rec.recordCategory !== "company") {
      throw new Error("Only company-level trade records can be saved as leads.");
    }

    const companyName = rec.importer?.name || rec.exporter?.name;
    if (!companyName) {
      throw new Error("No identifiable company name found in trade record.");
    }

    // Check if user has an active search or create a dummy trade search container
    let searchId: string | null = null;
    const { data: existingSearch } = await (supabase as any)
      .from("searches")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (existingSearch) {
      searchId = existingSearch.id;
    } else {
      const { data: newSearch } = await (supabase as any)
        .from("searches")
        .insert({
          user_id: userId,
          keyword: `Trade Data: ${companyName}`,
          country: rec.importer?.country || rec.exporter?.country || rec.sourceCountry || "Global",
          target_count: 1,
          status: "completed",
        })
        .select("id")
        .single();
      searchId = newSearch?.id || null;
    }

    if (!searchId) {
      throw new Error("Failed to link search container for lead.");
    }

    const address = rec.importer?.address || rec.exporter?.address || "";
    const country = rec.importer?.country || rec.exporter?.country || rec.sourceCountry || "United States";
    const tradeActivity = rec.importer ? "Importer" : "Exporter";
    const productDesc = rec.product || "International Commodities";
    const hsCode = rec.hsCode || "";

    const description = `Trade Activity: ${tradeActivity} | Products: ${productDesc} | HS Code: ${hsCode} | Origin: ${rec.originCountry || "N/A"} -> Dest: ${rec.destinationCountry || "N/A"} | Value: $${rec.tradeValue ? rec.tradeValue.toLocaleString() : "N/A"}`;

    const { data: lead, error } = await (supabase as any)
      .from("leads")
      .insert({
        search_id: searchId,
        user_id: userId,
        company_name: companyName,
        website: rec.sourceUrl || null,
        email: null, // DO NOT invent emails or phone numbers
        phone: null,
        industry: productDesc,
        address: address || null,
        country: country,
        description: description,
        source: `Import & Export Database (${rec.source})`,
        confidence: 0.85,
        social_profiles: {
          trade_role: tradeActivity,
          hs_code: hsCode,
          source_url: rec.sourceUrl,
          retrieved_at: rec.retrievedAt || new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to save trade lead: ${error.message}`);

    return {
      success: true,
      lead,
    };
  });
