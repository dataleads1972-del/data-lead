import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
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
  ExternalLink,
  Search,
  FilterX,
  User,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/intent-leads")({
  head: () => ({
    meta: [
      { title: "Intent Leads — LeadAI" },
      { name: "description", content: "Discovered buying intent posts across public communities." },
    ],
  }),
  component: IntentLeadsDashboard,
});

function IntentScoreBadge({ score }: { score: number }) {
  let colorClass = "bg-red-500/10 text-red-400 border-red-500/20";
  let text = "Low Intent";

  if (score >= 80) {
    colorClass = "bg-violet-500/10 text-violet-400 border-violet-500/20";
    text = "High Intent";
  } else if (score >= 50) {
    colorClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
    text = "Medium Intent";
  }

  return (
    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${colorClass}`}>
      {text} ({score}%)
    </span>
  );
}

function IntentLeadsDashboard() {
  const [q, setQ] = useState("");
  const [minScore, setMinScore] = useState<number>(40);
  const [platform, setPlatform] = useState<string>("all");
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  const { data: leads, isLoading } = useQuery({
    queryKey: ["intent-leads"],
    queryFn: async () =>
      (
        await supabase
          .from("leads")
          .select("*")
          .eq("is_intent_lead", true)
          .order("created_at", { ascending: false })
          .limit(1000)
      ).data ?? [],
  });

  const filtered = useMemo(() => {
    let list = leads || [];

    // 1. Text Search Filter
    if (q) {
      const s = q.toLowerCase();
      list = list.filter((l: any) =>
        [l.company_name, l.description, l.matched_keyword, l.post_author].some((v: any) =>
          (v || "").toLowerCase().includes(s)
        )
      );
    }

    // 2. Intent Score Slider Filter
    if (minScore > 0) {
      list = list.filter((l: any) => (l.intent_score || 0) >= minScore);
    }

    // 3. Platform Filter
    if (platform !== "all") {
      list = list.filter(
        (l: any) => (l.source_platform || "").toLowerCase() === platform.toLowerCase()
      );
    }

    return list;
  }, [leads, q, minScore, platform]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const highIntent = filtered.filter((l: any) => (l.intent_score || 0) >= 80).length;
    const avgScore =
      total > 0
        ? Math.round(
            filtered.reduce((acc: number, cur: any) => acc + (cur.intent_score || 0), 0) / total
          )
        : 0;

    return { total, highIntent, avgScore };
  }, [filtered]);

  const toggleExpand = (id: string) => {
    setExpandedLead((prev) => (prev === id ? null : id));
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Buying Intent Discovery</h1>
          <p className="text-muted-foreground mt-1">
            Realtime feed of public forum posts indicating immediate hiring or purchasing intent.
          </p>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="p-5 bg-gradient-to-br from-violet-500/5 to-transparent border-violet-500/10 flex flex-col justify-between">
          <span className="text-sm font-medium text-muted-foreground">Total Signals Discovered</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold tracking-tight text-violet-300">{stats.total}</span>
            <span className="text-xs text-muted-foreground">matching filters</span>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/10 flex flex-col justify-between">
          <span className="text-sm font-medium text-muted-foreground">High Intent Signals (&gt;= 80%)</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold tracking-tight text-emerald-400">
              {stats.highIntent}
            </span>
            <span className="text-xs text-muted-foreground">
              ({stats.total > 0 ? Math.round((stats.highIntent / stats.total) * 100) : 0}% ratio)
            </span>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/10 flex flex-col justify-between">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-400" /> Average Intent Score
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold tracking-tight text-amber-400">
              {stats.avgScore}%
            </span>
            <span className="text-xs text-muted-foreground">weighted accuracy</span>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-5 space-y-6">
        <div className="grid gap-4 md:grid-cols-3 items-end">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search keyword, author, snippet..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-10"
            />
          </div>

          <div>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue placeholder="All platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="reddit">Reddit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span>Min Intent Score</span>
              <span>{minScore}%</span>
            </div>
            <Slider
              value={[minScore]}
              onValueChange={(v) => setMinScore(v[0])}
              min={10}
              max={90}
              step={5}
            />
          </div>
        </div>

        {(q || minScore > 40 || platform !== "all") && (
          <div className="flex items-center gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQ("");
                setMinScore(40);
                setPlatform("all");
              }}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              <FilterX className="h-3 w-3 mr-1.5" />
              Reset filters
            </Button>
          </div>
        )}
      </Card>

      {/* List Container */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="h-6 w-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            Loading intent signals...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground space-y-2">
            <div>No matching intent signals found.</div>
            <p className="text-xs text-muted-foreground/60 max-w-sm mx-auto">
              Try adjusting your query or launching a new "Buying Intent Discovery" search from the
              search dashboard.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((lead: any) => {
              const isExpanded = expandedLead === lead.id;
              const postDate = lead.post_created_at
                ? new Date(lead.post_created_at).toLocaleDateString()
                : "Unknown date";
              return (
                <div
                  key={lead.id}
                  className="p-5 hover:bg-card/40 transition-colors flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center flex-wrap gap-2">
                        <Badge variant="outline" className="border-violet-500/20 text-violet-400 bg-violet-500/5">
                          {lead.matched_keyword || "hiring"}
                        </Badge>
                        <Badge variant="secondary" className="text-xs font-normal">
                          {lead.source_platform || "Reddit"}
                        </Badge>
                        <IntentScoreBadge score={lead.intent_score || 0} />
                      </div>
                      <h2 className="text-base font-semibold tracking-tight text-foreground line-clamp-2">
                        {lead.post_title || lead.company_name}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      {lead.post_url && (
                        <Button asChild size="sm" variant="outline" className="h-8">
                          <a
                            href={lead.post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs"
                          >
                            Original Post <ArrowUpRight className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => toggleExpand(lead.id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {lead.post_author || "Anonymous"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {postDate}
                    </span>
                  </div>

                  {/* Body Snippet */}
                  <div
                    className={`text-sm text-muted-foreground bg-muted/30 border border-border/50 rounded-lg p-4 font-sans leading-relaxed transition-all ${
                      isExpanded ? "line-clamp-none block" : "line-clamp-2"
                    }`}
                  >
                    {lead.description || "No post body snippet available."}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
