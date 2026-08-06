import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  getThreadsConnection,
  disconnectThreads,
  testThreadsProfile,
  getThreadsConfig,
} from "@/lib/threads.functions";
import { elevateToAdmin } from "@/lib/admin.functions";
import { getAIConfig, updateAIConfig } from "@/lib/ai.functions";
import { OPENROUTER_FREE_MODELS } from "@/lib/ai/openrouter-models";
import { Brain, Shield, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — LeadAI" }, { name: "description", content: "Manage your profile and workspace preferences." }] }),
  component: Settings,
});

function Settings() {
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [credits, setCredits] = useState(0);
  
  // Threads state and hooks
  const getConnectionFn = useServerFn(getThreadsConnection);
  const disconnectFn = useServerFn(disconnectThreads);
  const testProfileFn = useServerFn(testThreadsProfile);
  const getConfigFn = useServerFn(getThreadsConfig);
  const elevateFn = useServerFn(elevateToAdmin);
  const getAIConfigFn = useServerFn(getAIConfig);
  const updateAIConfigFn = useServerFn(updateAIConfig);

  const [threadsConnection, setThreadsConnection] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [elevating, setElevating] = useState(false);

  // AI Configuration State
  const [aiEnabled, setAiEnabled] = useState(true);
  const [primaryProvider, setPrimaryProvider] = useState<"xai" | "openrouter" | "nvidia">("openrouter");
  const [primaryModel, setPrimaryModel] = useState("meta-llama/llama-3.3-70b-instruct");
  const [fallbackProvider, setFallbackProvider] = useState<"xai" | "openrouter" | "nvidia">("xai");
  const [fallbackModel, setFallbackModel] = useState("grok-beta");
  const [savingAI, setSavingAI] = useState(false);

  const handleElevate = async () => {
    setElevating(true);
    try {
      await elevateFn();
      toast.success("Account elevated to Admin successfully!");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e: any) {
      toast.error(e.message || "Failed to elevate account.");
    } finally {
      setElevating(false);
    }
  };

  const fetchConnection = async () => {
    try {
      const conn = await getConnectionFn();
      setThreadsConnection(conn);
    } catch (e) {
      // ignore
    }
  };

  const fetchAIConfigData = async () => {
    try {
      const cfg = await getAIConfigFn();
      setAiEnabled(cfg.isEnabled);
      setPrimaryProvider(cfg.primaryProvider);
      setPrimaryModel(cfg.primaryModel);
      if (cfg.fallbackProvider) setFallbackProvider(cfg.fallbackProvider);
      if (cfg.fallbackModel) setFallbackModel(cfg.fallbackModel);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    supabase.from("profiles").select("*").maybeSingle().then(({ data }) => {
      if (data) { setName(data.full_name || ""); setOrg(data.organization || ""); setCredits(data.credits_remaining); }
    });
    fetchConnection();
    fetchAIConfigData();
  }, []);

  const save = async () => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("profiles").update({ full_name: name, organization: org }).eq("id", u.user!.id);
    if (error) toast.error(error.message); else toast.success("Saved");
  };

  const saveAIConfig = async () => {
    setSavingAI(true);
    try {
      await updateAIConfigFn({
        data: {
          primary_provider: primaryProvider,
          primary_model: primaryModel,
          fallback_provider: fallbackProvider,
          fallback_model: fallbackModel,
          is_enabled: aiEnabled,
        },
      });
      toast.success("AI Configuration updated successfully!");
    } catch (e: any) {
      toast.error(e.message || "Failed to update AI configuration");
    } finally {
      setSavingAI(false);
    }
  };

  const connectThreads = async () => {
    setLoadingConfig(true);
    try {
      const config = await getConfigFn();
      if (!config.appId || !config.redirectUri) {
        toast.error("Threads App ID or Redirect URI is not configured on the server.");
        return;
      }
      const state = Math.random().toString(36).substring(2);
      const authUrl = `https://threads.net/oauth/authorize?client_id=${config.appId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=threads_basic,threads_content_publish&response_type=code&state=${state}`;
      window.location.href = authUrl;
    } catch (e: any) {
      toast.error(e.message || "Failed to initiate Threads auth flow");
    } finally {
      setLoadingConfig(false);
    }
  };

  const disconnect = async () => {
    try {
      await disconnectFn();
      setThreadsConnection(null);
      setProfileData(null);
      toast.success("Disconnected Threads profile.");
    } catch (e: any) {
      toast.error(e.message || "Failed to disconnect Threads profile.");
    }
  };

  const runTest = async () => {
    setTestingConnection(true);
    try {
      const res = await testProfileFn();
      setProfileData(res);
      toast.success("Successfully queried Threads Profile API!");
    } catch (e: any) {
      toast.error(e.message || "Failed to fetch Threads profile data.");
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage workspace settings and integrations.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="font-medium">Profile Details</h2>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label>Organization</Label>
              <Input value={org} onChange={(e) => setOrg(e.target.value)} placeholder="Acme Inc." />
            </div>
            <Button onClick={save} className="w-full">Save changes</Button>
          </Card>

          <Card className="p-6">
            <h2 className="font-medium mb-2">Credits</h2>
            <div className="text-3xl font-semibold">{credits}</div>
            <p className="text-sm text-muted-foreground mt-1">Credits are consumed as agents run searches (~1 credit per 5 leads).</p>
          </Card>

          {/* AI Intelligence Configuration Panel */}
          <Card className="p-6 space-y-4 border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-orange-400" />
                <h2 className="font-semibold text-foreground">AI Intelligence Engine</h2>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="ai-toggle" className="text-xs text-muted-foreground">Enabled</Label>
                <Switch id="ai-toggle" checked={aiEnabled} onCheckedChange={setAiEnabled} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Configure primary and fallback LLM models. Free high-context OpenRouter models are pre-loaded below.
            </p>

            <div className="space-y-4 pt-2">
              {/* Primary Provider */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Primary Provider</Label>
                <Select value={primaryProvider} onValueChange={(v: "xai" | "openrouter" | "nvidia") => setPrimaryProvider(v)}>
                  <SelectTrigger className="bg-background text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openrouter">OpenRouter API</SelectItem>
                    <SelectItem value="nvidia">NVIDIA NIM API (High Token)</SelectItem>
                    <SelectItem value="xai">xAI (Grok)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* OpenRouter Model Presets */}
              {primaryProvider === "openrouter" && (
                <div className="space-y-1.5 p-3 rounded-lg bg-secondary/40 border border-border/40">
                  <Label className="text-xs font-medium text-orange-400 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Select OpenRouter Model Preset
                  </Label>
                  <Select value={primaryModel} onValueChange={setPrimaryModel}>
                    <SelectTrigger className="bg-background text-xs">
                      <SelectValue placeholder="Select OpenRouter model" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPENROUTER_FREE_MODELS.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          <span className="flex items-center justify-between gap-2 w-full text-xs">
                            <span className="font-medium">{m.name}</span>
                            <span className="text-[10px] text-muted-foreground">({m.contextWindow} • {m.rating})</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Primary Model ID</Label>
                <Input
                  value={primaryModel}
                  onChange={(e) => setPrimaryModel(e.target.value)}
                  placeholder="meta/llama-3.3-70b-instruct"
                  className="bg-background text-xs font-mono"
                />
              </div>

              {/* Fallback Provider */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Fallback Provider (Optional)</Label>
                <Select value={fallbackProvider} onValueChange={(v: "xai" | "openrouter" | "nvidia") => setFallbackProvider(v)}>
                  <SelectTrigger className="bg-background text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nvidia">NVIDIA NIM API (High Token)</SelectItem>
                    <SelectItem value="xai">xAI (Grok)</SelectItem>
                    <SelectItem value="openrouter">OpenRouter API</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Fallback Model ID</Label>
                <Input
                  value={fallbackModel}
                  onChange={(e) => setFallbackModel(e.target.value)}
                  placeholder="grok-beta"
                  className="bg-background text-xs font-mono"
                />
              </div>

              <Button
                onClick={saveAIConfig}
                disabled={savingAI}
                className="w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white font-medium text-xs h-9"
              >
                {savingAI ? "Saving Configuration..." : "Save AI Configuration"}
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 space-y-4 flex flex-col justify-between">
            <div>
              <h2 className="font-medium mb-1">Threads Integration</h2>
              <p className="text-xs text-muted-foreground">
                Authorize your Threads profile to test Meta API OAuth authentication scopes and endpoints.
              </p>
            </div>

            {threadsConnection ? (
              <div className="space-y-4 pt-2">
                <div className="flex flex-col gap-2 p-3 rounded-lg border border-violet-500/20 bg-violet-500/5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Connected Account</span>
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  </div>
                  <div className="font-semibold text-foreground">@{threadsConnection.username}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">ID: {threadsConnection.threads_user_id}</div>
                  <Button variant="outline" size="sm" onClick={disconnect} className="mt-1 w-full text-xs h-8 text-red-400 border-red-500/10 hover:bg-red-500/10">
                    Disconnect Account
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={connectThreads} disabled={loadingConfig} className="w-full mt-4">
                {loadingConfig ? "Redirecting to Meta Threads..." : "Connect Threads Account"}
              </Button>
            )}
          </Card>

          <Card className="p-6 border-violet-500/20 bg-violet-500/5">
            <h2 className="font-medium mb-2 text-violet-400">Developer Zone</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Elevate your user account to Platform Admin for testing permissions and dashboard views.
            </p>
            <Button onClick={handleElevate} disabled={elevating} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold">
              {elevating ? "Elevating Account..." : "Elevate to Admin"}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
