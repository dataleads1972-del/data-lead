import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { checkPassword } from "@/lib/password";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — LeadAI" },
      { name: "description", content: "Access your AI-powered lead generation workspace." },
      { property: "og:title", content: "Sign in — LeadAI" },
      { property: "og:description", content: "Access your AI-powered lead generation workspace." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const signIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/dashboard" });
  };

  const signUp = async () => {
    setLoading(true);
    const pwError = await checkPassword(password);
    if (pwError) {
      setLoading(false);
      return toast.error(pwError);
    }
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — check your email or sign in.");
  };

  const forgot = async () => {
    if (!email) return toast.error("Enter your email first");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) toast.error(error.message);
    else toast.success("Reset link sent");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-violet-950/20 px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-500">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight">LeadAI</span>
        </Link>
        <Card className="p-6">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="space-y-4 pt-4">
              <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button className="w-full" onClick={signIn} disabled={loading}>Sign in</Button>
              <button type="button" onClick={forgot} className="text-xs text-muted-foreground hover:text-foreground">Forgot password?</button>
            </TabsContent>
            <TabsContent value="signup" className="space-y-4 pt-4">
              <div><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button className="w-full" onClick={signUp} disabled={loading}>Create account</Button>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
