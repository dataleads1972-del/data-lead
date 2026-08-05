import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { executePipeline, logEvent } from "./lead-pipeline.server";

const StartInput = z.object({
  keyword: z.string().min(1),
  country: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  target_count: z.number().int().min(5).max(200).default(30),
  depth: z.enum(["quick", "balanced", "deep"]).default("balanced"),
  strategy: z.enum(["broad", "balanced", "narrow"]).default("balanced"),
  project_id: z.string().uuid().optional().nullable(),
  lead_type: z.enum(["business", "intent"]).default("business"),
});


export const startSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => StartInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: search, error } = await supabase
      .from("searches")
      .insert({
        user_id: userId,
        project_id: data.project_id ?? null,
        keyword: data.keyword,
        country: data.country ?? null,
        state: data.state ?? null,
        city: data.city ?? null,
        industry: data.industry ?? null,
        target_count: data.target_count,
        depth: data.depth,
        strategy: data.strategy,
        status: "running",
        started_at: new Date().toISOString(),
        lead_type: data.lead_type,
      })
      .select()
      .single();
    if (error || !search) throw new Error(error?.message || "Failed to create search");
    return { id: search.id as string };
  });

export const runSearchPipeline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ search_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY || "";

    const { data: search } = await supabase.from("searches").select("*").eq("id", data.search_id).eq("user_id", userId).single();
    if (!search) throw new Error("Search not found");

    try {
      return await executePipeline(supabase, userId, search as any, apiKey);
    } catch (e: any) {
      await supabase.from("searches").update({ status: "failed", completed_at: new Date().toISOString() }).eq("id", search.id);
      await logEvent(supabase, search.id, userId, "research", "failed", e?.message || "Pipeline failed", 100);
      throw e;
    }
  });


export const deleteSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase.from("searches").delete().eq("id", data.id).eq("user_id", context.userId);
    return { ok: true };
  });
