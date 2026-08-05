import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { StatusBadge } from "./dashboard";
import { useServerFn } from "@tanstack/react-start";
import { deleteSearch } from "@/lib/leads.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "Search history — LeadAI" }, { name: "description", content: "Review every AI search you've run." }] }),
  component: History,
});

function History() {
  const qc = useQueryClient();
  const del = useServerFn(deleteSearch);
  const { data: searches } = useQuery({
    queryKey: ["all-searches"],
    queryFn: async () => (await supabase.from("searches").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Search history</h1>
      <Card className="divide-y divide-border">
        {(searches ?? []).map((s: any) => (
          <div key={s.id} className="flex items-center justify-between gap-4 p-4">
            <Link to="/search/$id" params={{ id: s.id }} className="flex-1 min-w-0">
              <div className="font-medium truncate">{s.keyword}</div>
              <div className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()} · {s.leads_found} leads · {s.credits_used} credits</div>
            </Link>
            <StatusBadge status={s.status} />
            <Button variant="ghost" size="icon" onClick={async () => {
              await del({ data: { id: s.id } });
              qc.invalidateQueries({ queryKey: ["all-searches"] });
              toast.success("Deleted");
            }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        {!searches?.length && <div className="p-8 text-center text-muted-foreground">No searches yet.</div>}
      </Card>
    </div>
  );
}
