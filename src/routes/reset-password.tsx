import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { checkPassword } from "@/lib/password";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — LeadAI" }, { name: "description", content: "Set a new password for your LeadAI account." }] }),
  component: Reset,
});

function Reset() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const submit = async () => {
    setLoading(true);
    const pwError = await checkPassword(password);
    if (pwError) {
      setLoading(false);
      return toast.error(pwError);
    }
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Password updated"); navigate({ to: "/dashboard" }); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-6 space-y-4">
        <h1 className="text-xl font-semibold">Set new password</h1>
        <div><Label>New password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <Button className="w-full" onClick={submit} disabled={loading || password.length < 8}>Update password</Button>
      </Card>
    </div>
  );
}
