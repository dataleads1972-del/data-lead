import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FolderKanban, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({ meta: [{ title: "Projects — LeadAI" }, { name: "description", content: "Group your lead searches into projects." }] }),
  component: Projects,
});

function Projects() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => (await supabase.from("projects").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const create = async () => {
    if (!name) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("projects").insert({ name, description: desc, user_id: u.user!.id });
    if (error) toast.error(error.message);
    else { setOpen(false); setName(""); setDesc(""); qc.invalidateQueries({ queryKey: ["projects"] }); }
  };
  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New project</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New project</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
              <Button onClick={create} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {(projects ?? []).map((p: any) => (
          <Card key={p.id} className="p-5 group">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
                <FolderKanban className="h-5 w-5 text-violet-300" />
              </div>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={async () => {
                await supabase.from("projects").delete().eq("id", p.id);
                qc.invalidateQueries({ queryKey: ["projects"] });
              }}><Trash2 className="h-4 w-4" /></Button>
            </div>
            <h3 className="font-medium mt-3">{p.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{p.description || "No description"}</p>
          </Card>
        ))}
        {!projects?.length && <div className="col-span-3 p-8 text-center text-muted-foreground border border-dashed rounded-lg">No projects yet.</div>}
      </div>
    </div>
  );
}
