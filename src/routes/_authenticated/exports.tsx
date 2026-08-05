import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { FileDown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/exports")({
  head: () => ({ meta: [{ title: "Exports — LeadAI" }, { name: "description", content: "Download history for your generated lead lists." }] }),
  component: Exports,
});

function Exports() {
  const { data } = useQuery({
    queryKey: ["exports"],
    queryFn: async () => (await supabase.from("exports").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Exports</h1>
      <Card className="divide-y divide-border">
        {(data ?? []).map((x: any) => (
          <div key={x.id} className="p-4 flex items-center gap-3">
            <FileDown className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1"><div className="font-medium text-sm">{x.filename}</div><div className="text-xs text-muted-foreground">{new Date(x.created_at).toLocaleString()} · {x.row_count} rows</div></div>
            <span className="uppercase text-xs px-2 py-0.5 rounded-full border">{x.format}</span>
          </div>
        ))}
        {!data?.length && <div className="p-8 text-center text-muted-foreground">No exports yet.</div>}
      </Card>
    </div>
  );
}
