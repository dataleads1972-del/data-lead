import { NVIDIAProvider } from "../src/lib/ai/nvidia-provider.server";
import { DataLeadSourceRecord } from "../src/lib/ai/source-normalizer";
import dotenv from "dotenv";

dotenv.config();

async function testNvidia() {
  console.log("=== TESTING NVIDIA NIM API PROVIDER ===");
  console.log("NVIDIA_API_KEY present:", !!process.env.NVIDIA_API_KEY);

  const sampleLead: DataLeadSourceRecord = {
    id: "nvidia_test_01",
    source: "reddit",
    recordType: "post",
    title: "Looking for CRM software recommendations for a 15-person sales team",
    content: "We are currently using HubSpot for customer relationship management but the pricing for our 15-person sales team is becoming unsustainable. Does anyone have recommendations for an affordable CRM alternative?",
    author: "founder_123",
  };

  const nvidia = new NVIDIAProvider();

  try {
    const res = await nvidia.analyzeLead({
      record: sampleLead,
      model: "meta/llama-3.3-70b-instruct",
    });

    console.log("✅ NVIDIA NIM API Response Successful!");
    console.log("Lead Score:", res.leadScore);
    console.log("Intent:", res.intent);
    console.log("Opportunity:", res.opportunity);
    console.log("Problem:", res.problem);
    console.log("Need:", res.need);
    console.log("Buying Signal:", res.buyingSignal);
    console.log("Buying Stage:", res.buyingStage);
    console.log("Urgency:", res.urgency);
    console.log("Sentiment:", res.sentiment);
    console.log("Confidence:", res.confidence);
    console.log("Keywords:", res.keywords.join(" • "));
    console.log("Why this is a lead:", res.reason);
  } catch (e: any) {
    console.error("❌ NVIDIA NIM API Error:", e.message);
  }
}

testNvidia();
