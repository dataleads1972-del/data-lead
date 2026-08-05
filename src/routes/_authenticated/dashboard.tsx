import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Database, History, Sparkles, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — LeadAI" }, { name: "description", content: "Your AI lead generation workspace." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [{ count: searches }, { count: leads }, { data: recent }] = await Promise.all([
        supabase.from("searches").select("*", { count: "exact", head: true }),
        supabase.from("leads").select("*", { count: "exact", head: true }),
        supabase.from("searches").select("id, keyword, leads_found, status, created_at").order("created_at", { ascending: false }).limit(5),
      ]);
      return { searches: searches ?? 0, leads: leads ?? 0, recent: recent ?? [] };
    },
  });

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground mt-1">Deploy AI agents to discover, enrich, and validate your next leads.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Search} label="Total searches" value={stats?.searches ?? 0} />
        <StatCard icon={Database} label="Leads generated" value={stats?.leads ?? 0} />
        <StatCard icon={TrendingUp} label="Success rate" value="98%" />
      </div>

      <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-sm text-orange-400"><Sparkles className="h-4 w-4" /> Ready to hunt</div>
            <h2 className="text-2xl font-semibold mt-2">Start a new AI-powered search</h2>
            <p className="text-muted-foreground mt-1 max-w-lg">Six agents work in parallel to research the market, discover companies, enrich contacts, and deliver a validated lead list.</p>
          </div>
          <Button asChild size="lg"><Link to="/search"><Search className="h-4 w-4 mr-2" />New Search</Link></Button>
        </div>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent searches</h2>
          <Button asChild variant="ghost" size="sm"><Link to="/history"><History className="h-4 w-4 mr-2" />View all</Link></Button>
        </div>
        <Card className="divide-y divide-border">
          {(stats?.recent ?? []).length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No searches yet — start your first one.</div>
          ) : (
            stats?.recent.map((s: any) => (
              <Link key={s.id} to="/search/$id" params={{ id: s.id }} className="flex items-center justify-between p-4 hover:bg-accent/50 transition">
                <div>
                  <div className="font-medium">{s.keyword}</div>
                  <div className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{s.leads_found} leads</span>
                  <StatusBadge status={s.status} />
                </div>
              </Link>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-transparent flex items-center justify-center">
          <Icon className="h-5 w-5 text-orange-400" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
      </div>
    </Card>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: any = {
    completed: "bg-green-500/15 text-green-400 border-green-500/30",
    running: "bg-blue-500/15 text-blue-400 border-blue-500/30 animate-pulse",
    queued: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    failed: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return <span className={`px-2 py-0.5 text-xs rounded-full border ${colors[status] || ""}`}>{status}</span>;
}
