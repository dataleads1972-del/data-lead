import { AIService } from "../src/lib/ai/ai-service.server";
import { DataLeadSourceRecord } from "../src/lib/ai/source-normalizer";
import dotenv from "dotenv";

dotenv.config();

async function runServiceTest() {
  console.log("=== DATALEAD AI SERVICE & AUTOMATIC FAILOVER TEST ===");

  const mockSupabase: any = {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null }),
          }),
        }),
        maybeSingle: async () => ({
          data: {
            primary_provider: "xai", // Set failing provider as primary to test failover
            primary_model: "grok-2-1212",
            fallback_provider: "openrouter",
            fallback_model: "meta-llama/llama-3.3-70b-instruct",
            is_enabled: true,
          },
        }),
      }),
      insert: async () => ({ error: null }),
      update: () => ({
        eq: () => ({
          eq: async () => ({ error: null }),
        }),
      }),
    }),
  };

  const sampleLead: DataLeadSourceRecord = {
    id: "test_lead_failover_001",
    source: "reddit",
    recordType: "post",
    title: "HubSpot has become too expensive for us. We are looking for software alternatives.",
    content: "We are currently using HubSpot for customer relationship management but the pricing for our 15-person sales team is becoming unsustainable. Does anyone have recommendations for an affordable CRM alternative?",
    author: "saas_founder_99",
    sourceUrl: "https://www.reddit.com/r/startups/comments/test_lead",
    metadata: {
      subreddit: "startups",
    },
  };

  const aiService = new AIService();

  console.log("\nSimulating call with Primary Provider = xAI (0 credits -> 403 error) and Fallback = OpenRouter...");

  try {
    const res = await aiService.analyzeLeadRecord(mockSupabase, "user_123", sampleLead, undefined, true);
    console.log("\n🎉 AUTOMATIC FAILOVER SUCCESSFUL!");
    console.log(`Executed Provider: ${res.provider} (${res.model})`);
    console.log("Lead Score:", res.result.leadScore);
    console.log("Intent:", res.result.intent);
    console.log("Opportunity:", res.result.opportunity);
    console.log("Problem:", res.result.problem);
    console.log("Need:", res.result.need);
    console.log("Buying Signal:", res.result.buyingSignal);
    console.log("Buying Stage:", res.result.buyingStage);
    console.log("Urgency:", res.result.urgency);
    console.log("Sentiment:", res.result.sentiment);
    console.log("AI Confidence:", res.result.confidence);
    console.log("Keywords:", res.result.keywords.join(" • "));
    console.log("Why this is a lead:", res.result.reason);
  } catch (e: any) {
    console.error("❌ Failover failed:", e.message);
  }
}

runServiceTest();
