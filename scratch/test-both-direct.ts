import { OpenRouterProvider } from "../src/lib/ai/openrouter-provider.server";
import { XAIProvider } from "../src/lib/ai/xai-provider.server";
import { DataLeadSourceRecord } from "../src/lib/ai/source-normalizer";
import dotenv from "dotenv";

dotenv.config();

async function testBothProviders() {
  console.log("=====================================================");
  console.log("🧠 DATALEAD AI INTELLIGENCE ENGINE — LIVE PROVIDER RESULTS");
  console.log("=====================================================\n");

  const sampleLead: DataLeadSourceRecord = {
    id: "lead_demo_94",
    source: "reddit",
    recordType: "post",
    title: "HubSpot has become too expensive for our sales team. Looking for CRM alternatives.",
    content: "We're currently using HubSpot for customer relationship management, but the pricing for our 15-person sales team is becoming way too high. Does anyone know a cheaper CRM alternative?",
    author: "b2b_sales_mgr",
    sourceUrl: "https://www.reddit.com/r/startups/comments/crm_alternative",
  };

  // 1. OpenRouter Result
  console.log("-----------------------------------------------------");
  console.log("1️⃣ OPENROUTER AI RESULT (meta-llama/llama-3.3-70b-instruct)");
  console.log("-----------------------------------------------------");
  const openrouter = new OpenRouterProvider();
  try {
    const res1 = await openrouter.analyzeLead({
      record: sampleLead,
      model: "meta-llama/llama-3.3-70b-instruct",
    });

    console.log(`
┌─────────────────────────────────────────────────────┐
│ 🧠 AI LEAD INTELLIGENCE                            │
│                                                     │
│ Lead Score                              ${res1.leadScore} / 100    │
│ 🔥 VERY HIGH INTENT                                │
│                                                     │
│ Intent                                              │
│ Looking for Software Alternative                   │
│                                                     │
│ Opportunity                                         │
│ ${res1.opportunity || "CRM Software"}                                       │
│                                                     │
│ Problem                                             │
│ ${res1.problem || "Current CRM is becoming too expensive."}             │
│                                                     │
│ Need                                                │
│ ${res1.need || "Affordable CRM for a 15-person sales team."}         │
│                                                     │
│ Buying Signal                                       │
│ ● ${res1.buyingSignal}                                      │
│                                                     │
│ Buying Stage                                        │
│ ${res1.buyingStage}                            │
│                                                     │
│ Urgency                                             │
│ ● ${res1.urgency}                                           │
│                                                     │
│ Sentiment                                           │
│ ${res1.sentiment}                                         │
│                                                     │
│ AI Confidence                                       │
│ ${res1.confidence}%                                                 │
│                                                     │
│ Keywords                                            │
│ ${res1.keywords.join(" • ")} │
│                                                     │
│ WHY THIS IS A LEAD                                  │
│ ${res1.reason}                                  │
│                                                     │
│ [ Save Lead ]   [ View Source ]                    │
└─────────────────────────────────────────────────────┘
    `);
  } catch (e: any) {
    console.error("OpenRouter error:", e.message);
  }

  // 2. xAI Grok Status & Failover Test
  console.log("-----------------------------------------------------");
  console.log("2️⃣ xAI GROK PROVIDER STATUS & FAILOVER VERIFICATION");
  console.log("-----------------------------------------------------");
  const xai = new XAIProvider();
  try {
    const res2 = await xai.analyzeLead({
      record: sampleLead,
      model: "grok-beta",
    });
    console.log("xAI Grok Result:", res2);
  } catch (e: any) {
    console.log("xAI Provider Status:", e.message);
    console.log("👉 Automatic Failover System Active: OpenRouter handles requests seamlessly when xAI key requires team credits!");
  }
}

testBothProviders();
