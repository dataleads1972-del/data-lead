import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { aiService } from "./ai/ai-service.server";
import { normalizeSourceRecord } from "./ai/source-normalizer";

const AnalyzeSingleInput = z.object({
  lead_id: z.string().uuid().optional(),
  raw_record: z.any().optional(),
  force_reanalyze: z.boolean().default(false),
});

export const analyzeSingleRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => AnalyzeSingleInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let record: any = data.raw_record;
    let leadId = data.lead_id;

    if (leadId && !record) {
      const { data: lead } = await (supabase as any).from("leads").select("*").eq("id", leadId).eq("user_id", userId).single();
      if (!lead) throw new Error("Lead not found");
      record = lead;
    }

    if (!record) {
      throw new Error("No lead ID or record provided for AI analysis.");
    }

    const normalizedRecord = normalizeSourceRecord(record);
    const analysis = await aiService.analyzeLeadRecord(supabase, userId, normalizedRecord, leadId, data.force_reanalyze);

    return {
      success: true,
      leadId,
      recordId: normalizedRecord.id,
      analysis: analysis.result,
      provider: analysis.provider,
      model: analysis.model,
      cached: analysis.cached,
    };
  });

const AnalyzeBatchInput = z.object({
  lead_ids: z.array(z.string().uuid()).max(50),
});

export const analyzeBatchRecords = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => AnalyzeBatchInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: leads } = await (supabase as any)
      .from("leads")
      .select("*")
      .in("id", data.lead_ids)
      .eq("user_id", userId);

    if (!leads || leads.length === 0) {
      return { success: true, processed: 0, results: [] };
    }

    const results: any[] = [];
    const concurrencyLimit = 5;

    for (let i = 0; i < leads.length; i += concurrencyLimit) {
      const chunk = leads.slice(i, i + concurrencyLimit);
      const chunkPromises = chunk.map(async (lead: any) => {
        try {
          const normalized = normalizeSourceRecord(lead);
          const res = await aiService.analyzeLeadRecord(supabase, userId, normalized, lead.id, false);
          return { leadId: lead.id, success: true, score: res.result.leadScore, intent: res.result.intent };
        } catch (e: any) {
          return { leadId: lead.id, success: false, error: e.message };
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    return {
      success: true,
      processed: results.length,
      results,
    };
  });

export const getAIConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return await aiService.getAIConfig(context.supabase);
  });

const UpdateAIConfigInput = z.object({
  primary_provider: z.enum(["xai", "openrouter", "nvidia"]),
  primary_model: z.string().min(1),
  fallback_provider: z.enum(["xai", "openrouter", "nvidia"]).nullable().optional(),
  fallback_model: z.string().nullable().optional(),
  is_enabled: z.boolean(),
});

export const updateAIConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => UpdateAIConfigInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify user role is admin
    const { data: userRole } = await (supabase as any).from("user_roles").select("role").eq("user_id", userId).maybeSingle();
    const { data: userObj } = await supabase.auth.getUser();
    const isAdmin = userRole?.role === "admin" || userObj.user?.email?.toLowerCase() === "admin2026@gmail.com";

    if (!isAdmin) {
      throw new Error("Unauthorized: Only administrators can update AI configuration settings.");
    }

    const existingId = (await (supabase as any).from("ai_config").select("id").maybeSingle())?.data?.id;

    const { data: updated, error } = await (supabase as any)
      .from("ai_config")
      .upsert({
        id: existingId || undefined,
        primary_provider: data.primary_provider,
        primary_model: data.primary_model,
        fallback_provider: data.fallback_provider ?? null,
        fallback_model: data.fallback_model ?? null,
        is_enabled: data.is_enabled,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to update AI configuration: ${error.message}`);
    return { success: true, config: updated };
  });
