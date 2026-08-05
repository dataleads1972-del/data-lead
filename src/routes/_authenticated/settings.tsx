import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — LeadAI" }, { name: "description", content: "Manage your profile and workspace preferences." }] }),
  component: Settings,
});

function Settings() {
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    supabase.from("profiles").select("*").maybeSingle().then(({ data }) => {
      if (data) { setName(data.full_name || ""); setOrg(data.organization || ""); setCredits(data.credits_remaining); }
    });
  }, []);

  const save = async () => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("profiles").update({ full_name: name, organization: org }).eq("id", u.user!.id);
    if (error) toast.error(error.message); else toast.success("Saved");
  };

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <Card className="p-6 space-y-4">
        <h2 className="font-medium">Profile</h2>
        <div><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><Label>Organization</Label><Input value={org} onChange={(e) => setOrg(e.target.value)} /></div>
        <Button onClick={save}>Save changes</Button>
      </Card>
      <Card className="p-6">
        <h2 className="font-medium mb-2">Credits</h2>
        <div className="text-3xl font-semibold">{credits}</div>
        <p className="text-sm text-muted-foreground mt-1">Credits are consumed as agents run searches (~1 credit per 5 leads).</p>
      </Card>
    </div>
  );
}
