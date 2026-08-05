import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { startSearch, runSearchPipeline } from "@/lib/leads.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Search as SearchIcon } from "lucide-react";
import { AGENTS } from "@/lib/agents";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/search/")({
  head: () => ({ meta: [{ title: "New search — LeadAI" }, { name: "description", content: "Configure an AI-driven lead-gen search." }] }),
  component: NewSearch,
});

function NewSearch() {
  const nav = useNavigate();
  const start = useServerFn(startSearch);
  const run = useServerFn(runSearchPipeline);
  const [keyword, setKeyword] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [count, setCount] = useState(30);
  const [depth, setDepth] = useState<"quick" | "balanced" | "deep">("balanced");
  const [strategy, setStrategy] = useState<"broad" | "balanced" | "narrow">("balanced");
  const [leadType, setLeadType] = useState<"business" | "intent">("business");
  const [busy, setBusy] = useState(false);

  const launch = async () => {
    if (!keyword.trim()) return toast.error("Enter a keyword or industry");
    setBusy(true);
    try {
      const { id } = await start({ data: { keyword, industry: industry || null, country: country || null, city: city || null, target_count: count, depth, strategy, lead_type: leadType } });
      nav({ to: "/search/$id", params: { id } });
      run({ data: { search_id: id } }).catch((e) => toast.error(e.message));
    } catch (e: any) {
      toast.error(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 text-xs text-violet-300 mb-2"><Sparkles className="h-3 w-3" /> AI multi-agent</div>
        <h1 className="text-3xl font-semibold tracking-tight">Deploy your agent swarm</h1>
        <p className="text-muted-foreground mt-1">Describe your target. Six agents will collaborate to build a validated lead list.</p>
      </div>

      <Card className="p-6 space-y-6">
        <div className="space-y-2 border-b border-border pb-4">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Search Mode</Label>
          <div className="flex bg-muted p-1 rounded-lg border border-border w-full max-w-md">
            <Button
              type="button"
              variant={leadType === "business" ? "secondary" : "ghost"}
              className="flex-1 h-9 rounded-md text-xs font-semibold"
              onClick={() => setLeadType("business")}
            >
              Business Discovery (B2B)
            </Button>
            <Button
              type="button"
              variant={leadType === "intent" ? "secondary" : "ghost"}
              className="flex-1 h-9 rounded-md text-xs font-semibold"
              onClick={() => setLeadType("intent")}
            >
              Buying Intent Discovery
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>{leadType === "intent" ? "Hiring Role / Target Keywords" : "Keyword or business type"}</Label>
            <Input placeholder={leadType === "intent" ? "e.g. web developer, copywriter, UI designer" : "e.g. dental clinics, SaaS startups, coffee roasters"} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <div><Label>Industry (optional)</Label><Input placeholder="Healthcare" value={industry} onChange={(e) => setIndustry(e.target.value)} /></div>
          <div><Label>Country</Label><Input placeholder="United States" value={country} onChange={(e) => setCountry(e.target.value)} /></div>
          <div><Label>City / Region (optional)</Label><Input placeholder="San Francisco" value={city} onChange={(e) => setCity(e.target.value)} /></div>
          <div>
            <Label>Target leads: <span className="text-violet-300 font-semibold">{count}</span></Label>
            <Slider value={[count]} onValueChange={(v) => setCount(v[0])} min={10} max={100} step={5} className="mt-4" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Depth</Label>
            <Select value={depth} onValueChange={(v: any) => setDepth(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="quick">Quick — 1 pass</SelectItem>
                <SelectItem value="balanced">Balanced — recommended</SelectItem>
                <SelectItem value="deep">Deep — exhaustive research</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Strategy</Label>
            <Select value={strategy} onValueChange={(v: any) => setStrategy(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="broad">Broad — related industries</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="narrow">Narrow — strict match</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button size="lg" onClick={launch} disabled={busy} className="w-full">
          <SearchIcon className="h-4 w-4 mr-2" />
          {busy ? "Deploying agents…" : "Launch AI agents"}
        </Button>
      </Card>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Agents that will collaborate</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {AGENTS.map((a) => (
            <div key={a.id} className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card/50">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${a.color}20`, color: a.color }}>
                <a.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium">{a.name}</div>
                <div className="text-xs text-muted-foreground">{a.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
