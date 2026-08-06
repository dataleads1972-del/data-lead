import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { analyzeSingleRecord } from "@/lib/ai.functions";
import { LeadAnalysisResult } from "@/lib/ai/ai-provider.types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AISourceBadge } from "./AISourceBadge";
import { toast } from "sonner";
import {
  Sparkles,
  RefreshCw,
  Brain,
  ExternalLink,
  BookmarkPlus,
  Flame,
  Zap,
  CheckCircle2,
} from "lucide-react";

interface AIIntelligenceDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: any;
  rawRecord?: any;
  initialAnalysis?: LeadAnalysisResult | null;
}

export function AIIntelligenceDrawer({
  open,
  onOpenChange,
  lead,
  rawRecord,
  initialAnalysis,
}: AIIntelligenceDrawerProps) {
  const queryClient = useQueryClient();
  const [analysis, setAnalysis] = useState<LeadAnalysisResult | null>(initialAnalysis || null);
  const [providerInfo, setProviderInfo] = useState<{ provider: string; model: string; cached: boolean } | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: async (force: boolean) => {
      const res = await analyzeSingleRecord({
        data: {
          lead_id: lead?.id,
          raw_record: rawRecord || lead,
          force_reanalyze: force,
        },
      });
      return res;
    },
    onSuccess: (data) => {
      setAnalysis(data.analysis);
      setProviderInfo({ provider: data.provider, model: data.model, cached: data.cached });
      toast.success(`AI Analysis complete via ${data.provider} (${data.model})!`);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["intent-leads"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "AI Analysis failed");
    },
  });

  const currentAnalysis = analysis || initialAnalysis;
  const score = currentAnalysis?.leadScore ?? 0;

  let scoreTier = { label: "🔥 VERY HIGH INTENT", color: "text-orange-400" };
  if (score >= 90) {
    scoreTier = { label: "🔥 VERY HIGH INTENT", color: "text-orange-400" };
  } else if (score >= 75) {
    scoreTier = { label: "⚡ HIGH INTENT", color: "text-amber-400" };
  } else if (score >= 50) {
    scoreTier = { label: "MEDIUM INTENT", color: "text-blue-400" };
  } else if (score >= 25) {
    scoreTier = { label: "LOW INTENT", color: "text-gray-400" };
  } else {
    scoreTier = { label: "NOT A LEAD", color: "text-gray-500" };
  }

  const sourceName = lead?.source || rawRecord?.source || "Unknown";
  const sourceUrl = lead?.website || rawRecord?.sourceUrl || lead?.social_profiles?.source_url || rawRecord?.permalink;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-background p-6 space-y-6">
        {/* Top Header */}
        <SheetHeader className="pb-4 border-b border-border/60">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-pulse">🧠</span>
              <div>
                <SheetTitle className="text-base font-extrabold tracking-wider text-foreground">
                  AI LEAD INTELLIGENCE
                </SheetTitle>
                <p className="text-[11px] text-muted-foreground">Automated Commercial Intent & B2B Lead Scoring</p>
              </div>
            </div>
            <AISourceBadge source={sourceName} sourceUrl={sourceUrl} />
          </div>
        </SheetHeader>

        {/* Trigger Analysis if none performed yet */}
        {!currentAnalysis && !analyzeMutation.isPending && (
          <div className="p-8 text-center space-y-4 border border-dashed border-orange-500/30 rounded-2xl bg-orange-500/5 my-4">
            <Sparkles className="h-10 w-10 text-orange-400 mx-auto animate-bounce" />
            <div>
              <h3 className="font-bold text-base text-foreground">Evaluate Intent Signals</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                Run live multi-LLM evaluation (OpenRouter, NVIDIA NIM, xAI Grok fallback) to extract buying intent, problem, and urgency.
              </p>
            </div>
            <Button
              onClick={() => analyzeMutation.mutate(false)}
              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold gap-2 px-6 shadow-lg shadow-orange-500/20"
            >
              <Brain className="h-4 w-4" /> Run AI Intelligence Analysis
            </Button>
          </div>
        )}

        {/* Loading State */}
        {analyzeMutation.isPending && (
          <div className="p-12 text-center space-y-4 rounded-2xl bg-card border border-orange-500/20 shadow-inner">
            <div className="relative h-12 w-12 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-orange-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
              <Brain className="absolute inset-0 m-auto h-5 w-5 text-orange-400 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">Evaluating Intent & Commercial Signals...</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Routing query via Primary AI Provider with automatic failover fallback...
              </p>
            </div>
          </div>
        )}

        {/* EXACT CLIENT SPECIFICATION AI INTELLIGENCE CARD UI */}
        {currentAnalysis && !analyzeMutation.isPending && (
          <div className="rounded-2xl border-2 border-orange-500/40 bg-card/90 backdrop-blur-md shadow-2xl p-5 space-y-5 relative overflow-hidden">
            {/* Glowing Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500" />

            {/* Card Header & Provider Badge */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2 font-black text-sm tracking-wider text-foreground">
                <span className="text-base">🧠</span> AI LEAD INTELLIGENCE
              </div>

              {providerInfo && (
                <Badge variant="outline" className="text-[10px] font-mono bg-secondary/80 text-orange-400 border-orange-500/30">
                  {providerInfo.provider} ({providerInfo.model}) {providerInfo.cached ? "• cached" : ""}
                </Badge>
              )}
            </div>

            {/* Lead Score Gauge & Intent Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Lead Score</span>
                <span className="text-3xl font-black text-foreground tracking-tight">{currentAnalysis.leadScore} <span className="text-sm font-semibold text-muted-foreground">/ 100</span></span>
              </div>
              
              {/* Score Progress Bar */}
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(5, currentAnalysis.leadScore))}%` }}
                />
              </div>

              <div className={`text-sm font-black tracking-wide pt-1 flex items-center gap-1.5 ${scoreTier.color}`}>
                {scoreTier.label}
              </div>
            </div>

            {/* Structured Field Items */}
            <div className="space-y-4 text-xs">
              {/* Intent */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Intent</div>
                <div className="font-bold text-foreground text-sm capitalize">
                  {currentAnalysis.intent.replace(/_/g, " ")}
                </div>
              </div>

              {/* Opportunity */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Opportunity</div>
                <div className="font-bold text-orange-400 text-sm">
                  {currentAnalysis.opportunity || "Commercial Lead Opportunity"}
                </div>
              </div>

              {/* Problem */}
              {currentAnalysis.problem && (
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Problem</div>
                  <div className="font-medium text-foreground bg-secondary/60 p-3 rounded-xl border border-border/60 leading-relaxed">
                    {currentAnalysis.problem}
                  </div>
                </div>
              )}

              {/* Need */}
              {currentAnalysis.need && (
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Need</div>
                  <div className="font-medium text-foreground bg-orange-500/10 p-3 rounded-xl border border-orange-500/25 leading-relaxed">
                    {currentAnalysis.need}
                  </div>
                </div>
              )}

              {/* Grid Metrics */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Buying Signal */}
                <div className="p-3 rounded-xl bg-secondary/40 border border-border/40 space-y-1">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Buying Signal</div>
                  <div className="font-bold text-orange-400 capitalize">
                    ● {currentAnalysis.buyingSignal.replace(/_/g, " ")}
                  </div>
                </div>

                {/* Buying Stage */}
                <div className="p-3 rounded-xl bg-secondary/40 border border-border/40 space-y-1">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Buying Stage</div>
                  <div className="font-bold text-foreground capitalize">
                    {currentAnalysis.buyingStage.replace(/_/g, " ")}
                  </div>
                </div>

                {/* Urgency */}
                <div className="p-3 rounded-xl bg-secondary/40 border border-border/40 space-y-1">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Urgency</div>
                  <div className="font-bold text-amber-400 capitalize">
                    ● {currentAnalysis.urgency}
                  </div>
                </div>

                {/* Sentiment */}
                <div className="p-3 rounded-xl bg-secondary/40 border border-border/40 space-y-1">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sentiment</div>
                  <div className="font-bold text-foreground capitalize">
                    {currentAnalysis.sentiment}
                  </div>
                </div>
              </div>

              {/* AI Confidence */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">AI Confidence</div>
                <div className="font-black text-foreground text-base">
                  {currentAnalysis.confidence}%
                </div>
              </div>

              {/* Keywords */}
              {currentAnalysis.keywords && currentAnalysis.keywords.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Keywords</div>
                  <div className="font-medium text-orange-300 bg-secondary/50 p-2.5 rounded-xl border border-border/40 text-xs tracking-wide">
                    {currentAnalysis.keywords.join(" • ")}
                  </div>
                </div>
              )}

              {/* WHY THIS IS A LEAD */}
              <div className="space-y-1.5 pt-3 border-t border-border/60">
                <div className="text-[11px] font-black tracking-widest text-orange-400 uppercase flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5" /> WHY THIS IS A LEAD
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed italic bg-secondary/50 p-3.5 rounded-xl border border-border/60">
                  "{currentAnalysis.reason}"
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-3 border-t border-border/60">
              <Button
                size="sm"
                onClick={() => toast.success("Lead saved to Workspace!")}
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs gap-1.5 font-bold shadow-md"
              >
                <BookmarkPlus className="h-3.5 w-3.5" /> Save Lead
              </Button>

              {sourceUrl && (
                <Button size="sm" variant="outline" asChild className="flex-1 text-xs gap-1.5 font-semibold">
                  <a href={sourceUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" /> View Source
                  </a>
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={() => analyzeMutation.mutate(true)}
                disabled={analyzeMutation.isPending}
                className="h-8 text-xs px-2.5 hover:bg-orange-500/10 text-orange-400"
                title="Re-analyze lead"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${analyzeMutation.isPending ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
