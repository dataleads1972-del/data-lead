import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Mail,
  Phone,
  Globe,
  MapPin,
  Sparkles,
  ExternalLink,
  Table as TableIcon,
  LayoutGrid,
  Check,
  Copy,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Search,
  FilterX,
  Brain,
} from "lucide-react";
import { toast } from "sonner";
import { AIIntelligenceDrawer } from "@/components/AIIntelligenceDrawer";
import { AISourceBadge } from "@/components/AISourceBadge";
import { analyzeBatchRecords } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/results")({
  head: () => ({
    meta: [
      { title: "All leads — LeadAI" },
      { name: "description", content: "Every enriched lead across your searches." },
    ],
  }),
  component: Results,
});

export function QualityBadge({ score }: { score: number }) {
  const rounded = Math.round((score || 0) * 100);
  let text = "Low Data";
  let variantClass = "bg-red-500/10 text-red-400 border-red-500/20";

  if (rounded >= 90) {
    text = "Excellent";
    variantClass = "bg-green-500/10 text-green-400 border-green-500/20";
  } else if (rounded >= 75) {
    text = "High Quality";
    variantClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  } else if (rounded >= 50) {
    text = "Medium Quality";
    variantClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  }

  return (
    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${variantClass}`}>
      {text} ({rounded}%)
    </span>
  );
}

const AGGREGATOR_PATTERN = /(wikipedia|reddit|quora|medium|pinterest|tripadvisor|glassdoor|indeed|amazon|ebay|blogspot|wordpress|github|slideshare|scribd|youtube|facebook|instagram|linkedin|twitter|x\.com|yelp|crunchbase|google|hhs\.gov|cms\.gov|nih\.gov|cdc\.gov|directory|registry|listings|yellowpages)/i;

function Results() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [minQuality, setMinQuality] = useState<string>("all");
  const [hasEmailOnly, setHasEmailOnly] = useState<boolean>(false);
  const [hasPhoneOnly, setHasPhoneOnly] = useState<boolean>(false);
  const [showAggregators, setShowAggregators] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [aiDrawerLead, setAiDrawerLead] = useState<any | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Batch Selection State
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());

  const { data: leads, isLoading } = useQuery({
    queryKey: ["all-leads"],
    queryFn: async () =>
      (await supabase.from("leads").select("*").or("is_intent_lead.eq.false,is_intent_lead.is.null").order("created_at", { ascending: false }).limit(1000)).data ?? [],
  });

  // Batch AI Analysis Mutation
  const batchAnalyzeMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return await analyzeBatchRecords({ data: { lead_ids: ids } });
    },
    onSuccess: (data) => {
      toast.success(`Batch AI Analysis complete for ${data.processed} leads!`);
      setSelectedLeadIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["all-leads"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Batch AI Analysis failed");
    },
  });

  const filtered = useMemo(() => {
    let list = leads || [];
    if (q) {
      const s = q.toLowerCase();
      list = list.filter((l: any) =>
        [l.company_name, l.industry, l.city, l.country, l.description, l.source].some((v: any) =>
          (v || "").toLowerCase().includes(s)
        )
      );
    }
    if (minQuality !== "all") {
      const min = Number(minQuality);
      list = list.filter((l: any) => (l.confidence || 0) >= min);
    }
    if (hasEmailOnly) list = list.filter((l: any) => !!l.email);
    if (hasPhoneOnly) list = list.filter((l: any) => !!l.phone);
    if (!showAggregators) {
      list = list.filter((l: any) => !l.website || !AGGREGATOR_PATTERN.test(l.website));
    }
    return list;
  }, [leads, q, minQuality, hasEmailOnly, hasPhoneOnly, showAggregators]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.size === filtered.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(filtered.map((l: any) => l.id)));
    }
  };

  const toggleSelectLead = (id: string) => {
    const next = new Set(selectedLeadIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLeadIds(next);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Leads</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} leads gathered across your search queries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Batch Actions */}
          {selectedLeadIds.size > 0 && (
            <Button
              onClick={() => batchAnalyzeMutation.mutate(Array.from(selectedLeadIds))}
              disabled={batchAnalyzeMutation.isPending}
              size="sm"
              className="bg-gradient-to-r from-orange-500 to-amber-600 text-white text-xs gap-1.5 font-medium shadow-sm"
            >
              <Brain className={`h-3.5 w-3.5 ${batchAnalyzeMutation.isPending ? "animate-spin" : ""}`} />
              Analyze Selected ({selectedLeadIds.size})
            </Button>
          )}

          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-1">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setViewMode("table")}
            >
              <TableIcon className="h-3.5 w-3.5 mr-1" /> Table
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-3.5 w-3.5 mr-1" /> Grid
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-card/60 backdrop-blur border-border/60">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Search company, industry..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9 bg-background text-sm"
            />
          </div>

          <Select value={minQuality} onValueChange={setMinQuality}>
            <SelectTrigger className="bg-background text-xs">
              <SelectValue placeholder="Quality Threshold" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Quality Scores</SelectItem>
              <SelectItem value="0.75">High Quality (75%+)</SelectItem>
              <SelectItem value="0.90">Excellent (90%+)</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-4 text-xs font-medium">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <Checkbox checked={hasEmailOnly} onCheckedChange={(c) => setHasEmailOnly(!!c)} />
              <span>Email Only</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <Checkbox checked={hasPhoneOnly} onCheckedChange={(c) => setHasPhoneOnly(!!c)} />
              <span>Phone Only</span>
            </label>
          </div>

          <div className="flex items-center justify-end text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <Checkbox checked={showAggregators} onCheckedChange={(c) => setShowAggregators(!!c)} />
              <span className="text-muted-foreground">Show Directories</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Leads Content */}
      {viewMode === "table" ? (
        <Card className="border-border/60 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filtered.length > 0 && selectedLeadIds.size === filtered.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="py-4 font-semibold">Company</TableHead>
                  <TableHead className="py-4 font-semibold">Source</TableHead>
                  <TableHead className="py-4 font-semibold">AI Intelligence</TableHead>
                  <TableHead className="py-4 font-semibold">Contact</TableHead>
                  <TableHead className="py-4 font-semibold">Quality</TableHead>
                  <TableHead className="py-4 text-center font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l: any) => (
                  <TableRow
                    key={l.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer group"
                    onClick={() => setSelectedLead(l)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedLeadIds.has(l.id)}
                        onCheckedChange={() => toggleSelectLead(l.id)}
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-semibold text-foreground group-hover:text-orange-400 transition-colors">
                        {l.company_name}
                      </div>
                      {l.website && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Globe className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[180px]">{l.website.replace(/^(https?:\/\/)?(www\.)?/i, "")}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <AISourceBadge source={l.source || "Web"} sourceUrl={l.website} />
                    </TableCell>
                    <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                      {l.ai_lead_score !== undefined && l.ai_lead_score !== null ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAiDrawerLead(l)}
                          className="h-7 text-xs font-semibold bg-orange-500/10 text-orange-400 border-orange-500/20 gap-1 rounded-full px-2.5"
                        >
                          <Brain className="h-3 w-3" /> Score {l.ai_lead_score}/100
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAiDrawerLead(l)}
                          className="h-7 text-xs text-muted-foreground hover:text-orange-400 gap-1"
                        >
                          <Brain className="h-3 w-3" /> Analyze AI
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-xs font-mono">
                      {l.email || l.phone || <span className="text-muted-foreground/30">—</span>}
                    </TableCell>
                    <TableCell className="py-4">
                      <QualityBadge score={l.confidence || 0} />
                    </TableCell>
                    <TableCell className="py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedLead(l)}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!filtered.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground italic">
                      <FilterX className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                      No leads match your active filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        /* GRID VIEW */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l: any) => (
            <Card
              key={l.id}
              className="p-5 flex flex-col justify-between hover:border-orange-500/40 hover:bg-orange-500/5 transition-all cursor-pointer group"
              onClick={() => setSelectedLead(l)}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-orange-400 transition-colors leading-tight">
                      {l.company_name}
                    </h3>
                    <div className="mt-1">
                      <AISourceBadge source={l.source || "Web"} sourceUrl={l.website} />
                    </div>
                  </div>
                  <QualityBadge score={l.confidence || 0} />
                </div>

                <div className="space-y-2 text-xs border-t border-border pt-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 text-orange-400" />
                    <span className="font-mono text-foreground truncate">
                      {l.email || <span className="text-muted-foreground/30 italic">No email</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 text-orange-400" />
                    <span className="text-foreground">
                      {l.phone || <span className="text-muted-foreground/30 italic">No phone</span>}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                {l.ai_lead_score !== undefined && l.ai_lead_score !== null ? (
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-xs">
                    AI Score: {l.ai_lead_score}/100
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">Not analyzed</span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAiDrawerLead(l)}
                  className="h-8 text-xs gap-1"
                >
                  <Brain className="h-3.5 w-3.5 text-orange-400" /> AI Intelligence
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* LEAD DETAILS SHEET */}
      <Sheet open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto space-y-6">
          {selectedLead && (
            <>
              <SheetHeader className="border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <QualityBadge score={selectedLead.confidence || 0} />
                  <AISourceBadge source={selectedLead.source || "Web"} />
                </div>
                <SheetTitle className="text-2xl font-bold mt-2">
                  {selectedLead.company_name}
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-3">
                <Button
                  onClick={() => {
                    const l = selectedLead;
                    setSelectedLead(null);
                    setAiDrawerLead(l);
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white gap-2"
                >
                  <Brain className="h-4 w-4" /> Open AI Intelligence Findings
                </Button>
              </div>

              {/* Contact Details */}
              <div className="space-y-3 border-t border-border pt-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Contact Info</h4>
                <div className="flex justify-between items-center bg-muted/40 p-2.5 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-orange-400" />
                    <span className="font-mono text-sm">
                      {selectedLead.email || <span className="text-muted-foreground/30 italic">No email</span>}
                    </span>
                  </div>
                  {selectedLead.email && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(selectedLead.email, "Email")}>
                      {copiedField === "Email" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  )}
                </div>

                <div className="flex justify-between items-center bg-muted/40 p-2.5 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-orange-400" />
                    <span className="text-sm">
                      {selectedLead.phone || <span className="text-muted-foreground/30 italic">No phone</span>}
                    </span>
                  </div>
                  {selectedLead.phone && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(selectedLead.phone, "Phone")}>
                      {copiedField === "Phone" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </div>

              {/* Location & Overview */}
              {selectedLead.description && (
                <div className="space-y-2 border-t border-border pt-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Business Overview</h4>
                  <p className="text-sm leading-relaxed text-muted-foreground bg-muted/20 p-3 rounded-lg border border-border/40">
                    {selectedLead.description}
                  </p>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* AI INTELLIGENCE DRAWER */}
      {aiDrawerLead && (
        <AIIntelligenceDrawer
          open={!!aiDrawerLead}
          onOpenChange={(open) => !open && setAiDrawerLead(null)}
          lead={aiDrawerLead}
        />
      )}
    </div>
  );
}
