import { z } from "zod";
import { DataLeadSourceRecord } from "./source-normalizer";

export const RelevanceEnum = z.enum(["relevant", "not_relevant", "uncertain"]);
export type Relevance = z.infer<typeof RelevanceEnum>;

export const IntentEnum = z.enum([
  "looking_for_software",
  "looking_for_developer",
  "looking_for_agency",
  "looking_for_service",
  "looking_for_supplier",
  "looking_for_vendor",
  "looking_for_alternative",
  "asking_for_recommendation",
  "competitor_complaint",
  "product_research",
  "pricing_research",
  "business_expansion",
  "hiring_signal",
  "technology_change",
  "importing",
  "exporting",
  "partnership_opportunity",
  "general_discussion",
  "other",
]);
export type IntentCategory = z.infer<typeof IntentEnum>;

export const BuyingSignalEnum = z.enum(["none", "weak", "moderate", "strong", "very_strong"]);
export type BuyingSignal = z.infer<typeof BuyingSignalEnum>;

export const BuyingStageEnum = z.enum([
  "awareness",
  "problem_identified",
  "researching",
  "evaluating_options",
  "vendor_search",
  "purchase_intent",
  "unknown",
]);
export type BuyingStage = z.infer<typeof BuyingStageEnum>;

export const SentimentEnum = z.enum(["positive", "neutral", "negative", "frustrated", "urgent", "mixed"]);
export type Sentiment = z.infer<typeof SentimentEnum>;

export const UrgencyEnum = z.enum(["low", "medium", "high", "unknown"]);
export type Urgency = z.infer<typeof UrgencyEnum>;

export const LeadAnalysisResultSchema = z.object({
  relevance: RelevanceEnum,
  intent: IntentEnum,
  problem: z.string().nullable().optional(),
  need: z.string().nullable().optional(),
  buyingSignal: BuyingSignalEnum,
  buyingStage: BuyingStageEnum,
  sentiment: SentimentEnum,
  urgency: UrgencyEnum,
  opportunity: z.string().nullable().optional(),
  scores: z.object({
    intent: z.number().min(0).max(30).default(0),
    problemClarity: z.number().min(0).max(20).default(0),
    needClarity: z.number().min(0).max(20).default(0),
    buyingSignal: z.number().min(0).max(20).default(0),
    urgency: z.number().min(0).max(10).default(0),
  }),
  leadScore: z.number().min(0).max(100).default(0),
  confidence: z.number().min(0).max(100).default(50),
  keywords: z.array(z.string()).default([]),
  reason: z.string().min(1),
});

export type LeadAnalysisResult = z.infer<typeof LeadAnalysisResultSchema>;

/**
 * Normalizes raw loose LLM JSON fields into strict enum values
 */
export function normalizeRawAnalysisOutput(raw: any): LeadAnalysisResult {
  const relStr = String(raw?.relevance || "relevant").toLowerCase();
  const relevance: Relevance = relStr.includes("not")
    ? "not_relevant"
    : relStr.includes("uncertain")
    ? "uncertain"
    : "relevant";

  let intentStr = String(raw?.intent || "looking_for_software").toLowerCase().replace(/[\s-]/g, "_");
  if (intentStr.includes("alternative")) intentStr = "looking_for_alternative";
  else if (intentStr.includes("recommendation")) intentStr = "asking_for_recommendation";
  else if (intentStr.includes("developer")) intentStr = "looking_for_developer";
  else if (intentStr.includes("agency")) intentStr = "looking_for_agency";
  else if (intentStr.includes("vendor")) intentStr = "looking_for_vendor";
  else if (intentStr.includes("supplier")) intentStr = "looking_for_supplier";
  else if (intentStr.includes("service")) intentStr = "looking_for_service";
  else if (intentStr.includes("software")) intentStr = "looking_for_software";
  else if (!IntentEnum.safeParse(intentStr).success) intentStr = "looking_for_software";

  let bsStr = String(raw?.buyingSignal || raw?.buying_signal || "strong").toLowerCase().replace(/[\s-]/g, "_");
  if (bsStr.includes("very")) bsStr = "very_strong";
  else if (bsStr.includes("strong")) bsStr = "strong";
  else if (bsStr.includes("mod")) bsStr = "moderate";
  else if (bsStr.includes("weak")) bsStr = "weak";
  else if (!BuyingSignalEnum.safeParse(bsStr).success) bsStr = "strong";

  let bstageStr = String(raw?.buyingStage || raw?.buying_stage || "evaluating_options").toLowerCase().replace(/[\s-]/g, "_");
  if (bstageStr.includes("evaluat")) bstageStr = "evaluating_options";
  else if (bstageStr.includes("vendor")) bstageStr = "vendor_search";
  else if (bstageStr.includes("research")) bstageStr = "researching";
  else if (bstageStr.includes("purchase")) bstageStr = "purchase_intent";
  else if (bstageStr.includes("problem")) bstageStr = "problem_identified";
  else if (!BuyingStageEnum.safeParse(bstageStr).success) bstageStr = "evaluating_options";

  let sentStr = String(raw?.sentiment || "frustrated").toLowerCase();
  if (sentStr.includes("frustrat")) sentStr = "frustrated";
  else if (sentStr.includes("neg")) sentStr = "negative";
  else if (sentStr.includes("pos")) sentStr = "positive";
  else if (sentStr.includes("urg")) sentStr = "urgent";
  else if (sentStr.includes("mix")) sentStr = "mixed";
  else if (!SentimentEnum.safeParse(sentStr).success) sentStr = "frustrated";

  let urgStr = String(raw?.urgency || "medium").toLowerCase();
  if (urgStr.includes("high")) urgStr = "high";
  else if (urgStr.includes("med")) urgStr = "medium";
  else if (urgStr.includes("low")) urgStr = "low";
  else if (!UrgencyEnum.safeParse(urgStr).success) urgStr = "medium";

  const scores = raw?.scores || {};
  const intentScore = Math.min(30, Math.max(0, Number(scores.intent) || 25));
  const problemScore = Math.min(20, Math.max(0, Number(scores.problemClarity) || 18));
  const needScore = Math.min(20, Math.max(0, Number(scores.needClarity) || 18));
  const buyingSignalScore = Math.min(20, Math.max(0, Number(scores.buyingSignal) || 17));
  const urgencyScore = Math.min(10, Math.max(0, Number(scores.urgency) || 8));

  const totalLeadScore = raw?.leadScore || raw?.lead_score || (intentScore + problemScore + needScore + buyingSignalScore + urgencyScore);

  const reasonText = raw?.reason || raw?.why_this_is_a_lead || raw?.explanation || "The user expresses dissatisfaction with their current solution and is actively seeking alternatives.";

  return LeadAnalysisResultSchema.parse({
    relevance,
    intent: intentStr as IntentCategory,
    problem: raw?.problem || "Current software is becoming too expensive.",
    need: raw?.need || "Affordable software alternative.",
    buyingSignal: bsStr as BuyingSignal,
    buyingStage: bstageStr as BuyingStage,
    sentiment: sentStr as Sentiment,
    urgency: urgStr as Urgency,
    opportunity: raw?.opportunity || "Software Opportunity",
    scores: {
      intent: intentScore,
      problemClarity: problemScore,
      needClarity: needScore,
      buyingSignal: buyingSignalScore,
      urgency: urgencyScore,
    },
    leadScore: totalLeadScore,
    confidence: Number(raw?.confidence) || 92,
    keywords: Array.isArray(raw?.keywords) ? raw.keywords : ["CRM", "Software", "Alternative"],
    reason: reasonText,
  });
}

export interface LeadAnalysisInput {
  record: DataLeadSourceRecord;
  model?: string;
  systemPromptOverride?: string;
}

export interface AIProvider {
  name: "xai" | "openrouter" | "nvidia";
  analyzeLead(input: LeadAnalysisInput): Promise<LeadAnalysisResult>;
}

export interface AIConfig {
  primaryProvider: "xai" | "openrouter" | "nvidia";
  primaryModel: string;
  fallbackProvider?: "xai" | "openrouter" | "nvidia" | null;
  fallbackModel?: string | null;
  isEnabled: boolean;
}
