import { OpenRouterProvider } from "../src/lib/ai/openrouter-provider.server";
import { DataLeadSourceRecord } from "../src/lib/ai/source-normalizer";
import dotenv from "dotenv";

dotenv.config();

async function testFreeModels() {
  console.log("=== TESTING OPENROUTER FREE MODELS ===");
  const openrouter = new OpenRouterProvider();

  const sampleLead: DataLeadSourceRecord = {
    id: "free_test_01",
    source: "reddit",
    recordType: "post",
    title: "Looking for CRM software recommendations for a 15-person sales team",
    content: "Our team is moving away from spreadsheets. What is the best CRM software for a 15-person sales team?",
    author: "founder_123",
  };

  const modelsToTest = [
    "meta-llama/llama-3.3-70b-instruct",
    "google/gemma-2-27b-it:free",
    "openrouter/auto",
  ];

  for (const model of modelsToTest) {
    console.log(`\nTesting Model: ${model}...`);
    try {
      const res = await openrouter.analyzeLead({ record: sampleLead, model });
      console.log(`✅ ${model} SUCCESS! Lead Score: ${res.leadScore}/100, Intent: ${res.intent}, Need: ${res.need}`);
    } catch (e: any) {
      console.error(`❌ ${model} ERROR:`, e.message);
    }
  }
}

testFreeModels();
