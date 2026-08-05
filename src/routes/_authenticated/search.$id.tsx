import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AGENTS, type AgentId } from "@/lib/agents";
import { ArrowRight, Download, Sparkles } from "lucide-react";
import { StatusBadge } from "./dashboard";
import { useServerFn } from "@tanstack/react-start";
import { exportLeads } from "@/lib/exports.functions";
import { toast } from "sonner";
import { QualityBadge } from "./results";


export const Route = createFileRoute("/_authenticated/search/$id")({
  head: () => ({ meta: [{ title: "Live agent workspace — LeadAI" }, { name: "description", content: "Watch AI agents research and enrich leads in real time." }] }),
  component: Live,
});

function Live() {
  const { id } = Route.useParams();
  const [search, setSearch] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const exportFn = useServerFn(exportLeads);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const [{ data: s }, { data: e }, { data: l }] = await Promise.all([
        supabase.from("searches").select("*").eq("id", id).maybeSingle(),
        supabase.from("agent_events").select("*").eq("search_id", id).order("created_at", { ascending: true }),
        supabase.from("leads").select("*").eq("search_id", id).order("created_at", { ascending: false }),
      ]);
      if (!alive) return;
      setSearch(s); setEvents(e || []); setLeads(l || []);
    };
    load();

    const ch = supabase
      .channel(`search:${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_events", filter: `search_id=eq.${id}` }, (p) => {
        if (p.eventType === "INSERT") setEvents((prev) => [...prev, p.new]);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads", filter: `search_id=eq.${id}` }, (p) => {
        setLeads((prev) => [p.new, ...prev]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "searches", filter: `id=eq.${id}` }, (p) => {
        setSearch(p.new);
      })
      .subscribe();

    return () => { alive = false; supabase.removeChannel(ch); };
  }, [id]);

  const latestByAgent: Record<string, any> = {};
  for (const e of events) latestByAgent[e.agent] = e;
  const overallProgress = events.length ? Math.max(...events.map((e) => e.progress || 0)) : 0;

  const doExport = async (format: "csv" | "xlsx") => {
    try {
      const res = await exportFn({ data: { search_id: id, format } });
      const blob = format === "csv"
        ? new Blob([res.content], { type: res.mime })
        : new Blob([Uint8Array.from(atob(res.content), (c) => c.charCodeAt(0))], { type: res.mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = res.filename; a.click(); URL.revokeObjectURL(url);
      toast.success(`Exported ${res.count} leads`);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 text-xs text-violet-300 mb-1"><Sparkles className="h-3 w-3 animate-pulse" /> Live workspace</div>
          <h1 className="text-2xl font-semibold">{search?.keyword || "Loading…"}</h1>
          <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            {search && <StatusBadge status={search.status} />}
            <span>{leads.length} leads found</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => doExport("csv")} disabled={!leads.length}><Download className="h-4 w-4 mr-2" />CSV</Button>
          <Button size="sm" onClick={() => doExport("xlsx")} disabled={!leads.length}><Download className="h-4 w-4 mr-2" />XLSX</Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-muted-foreground">Overall progress</span>
          <span className="font-medium">{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Agent status</h2>
          {AGENTS.map((a) => {
            const ev = latestByAgent[a.id];
            const active = ev?.status === "running";
            const done = ev?.status === "done";
            return (
              <Card key={a.id} className={`p-4 transition ${active ? "border-violet-500/50 shadow-[0_0_24px_-8px]" : ""}`} style={active ? { boxShadow: `0 0 30px -10px ${a.color}` } : {}}>
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${active ? "animate-pulse" : ""}`} style={{ background: `${a.color}20`, color: a.color }}>
                    <a.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">{a.name}</div>
                      <span className={`text-xs ${done ? "text-green-400" : active ? "text-violet-300" : "text-muted-foreground"}`}>
                        {ev?.status || "idle"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{ev?.message || a.desc}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Activity log</h2>
          <Card className="p-4 h-[520px] overflow-auto space-y-2 font-mono text-xs">
            {events.length === 0 && <div className="text-muted-foreground">Waiting for agents…</div>}
            {events.map((e) => {
              const a = AGENTS.find((x) => x.id === (e.agent as AgentId));
              return (
                <div key={e.id} className="flex items-start gap-2">
                  <span className="text-muted-foreground shrink-0">{new Date(e.created_at).toLocaleTimeString()}</span>
                  <span className="font-semibold shrink-0" style={{ color: a?.color }}>[{a?.name || e.agent}]</span>
                  <span>{e.message}</span>
                </div>
              );
            })}
          </Card>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground">Discovered leads ({leads.length})</h2>
          <Button asChild variant="ghost" size="sm"><Link to="/results">View all <ArrowRight className="h-4 w-4 ml-1" /></Link></Button>
        </div>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="p-3 font-medium">Company</th>
                  <th className="p-3 font-medium">Contact</th>
                  <th className="p-3 font-medium">Location</th>
                  <th className="p-3 font-medium">Source</th>
                  <th className="p-3 font-medium">Score</th>
                </tr>
              </thead>
              <tbody>
                {leads.slice(0, 20).map((l) => (
                  <tr key={l.id} className="border-t border-border hover:bg-accent/30 transition">
                    <td className="p-3">
                      <div className="font-medium">{l.company_name}</div>
                      <div className="text-xs text-muted-foreground">{l.website}</div>
                    </td>
                    <td className="p-3 text-xs">
                      <div>{l.email}</div>
                      <div className="text-muted-foreground">{l.phone}</div>
                    </td>
                    <td className="p-3 text-xs">{[l.city, l.country].filter(Boolean).join(", ")}</td>
                    <td className="p-3 text-xs text-muted-foreground">{l.source}</td>
                    <td className="p-3 text-xs">
                      <QualityBadge score={l.confidence || 0} />
                    </td>
                  </tr>
                ))}
                {!leads.length && (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Agents haven't discovered any leads yet…</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
