import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import * as XLSX from "xlsx";

const Input = z.object({
  search_id: z.string().uuid(),
  format: z.enum(["csv", "xlsx"]),
});

export const exportLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: leads } = await supabase
      .from("leads")
      .select("company_name, website, email, phone, industry, address, city, state, country, description, source, confidence, source_urls, email_source, phone_source, website_source, last_enriched_at, is_intent_lead, intent_score, matched_keyword, post_author, post_created_at, post_url, source_platform, post_title")
      .eq("search_id", data.search_id)
      .eq("user_id", userId);
    const rows = leads || [];
    const { data: search } = await supabase.from("searches").select("keyword").eq("id", data.search_id).single();
    const safe = (search?.keyword || "leads").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const filename = `${safe}-${Date.now()}.${data.format}`;
    let content: string;
    let mime: string;
    if (data.format === "csv") {
      const ws = XLSX.utils.json_to_sheet(rows);
      content = XLSX.utils.sheet_to_csv(ws);
      mime = "text/csv";
    } else {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Leads");
      const b64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
      content = b64;
      mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    }
    await supabase.from("exports").insert({
      user_id: userId,
      search_id: data.search_id,
      format: data.format,
      filename,
      row_count: rows.length,
    });
    return { filename, mime, content, encoding: data.format === "csv" ? "utf8" : "base64", count: rows.length };
  });
