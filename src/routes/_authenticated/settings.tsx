import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  getThreadsConnection,
  disconnectThreads,
  testThreadsProfile,
  getThreadsConfig,
} from "@/lib/threads.functions";

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

  const [threadsConnection, setThreadsConnection] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  const fetchConnection = async () => {
    try {
      const conn = await getConnectionFn();
      setThreadsConnection(conn);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    supabase.from("profiles").select("*").maybeSingle().then(({ data }) => {
      if (data) { setName(data.full_name || ""); setOrg(data.organization || ""); setCredits(data.credits_remaining); }
    });
    fetchConnection();

    // Check query params for Threads OAuth status redirects
    const params = new URLSearchParams(window.location.search);
    const threadsStatus = params.get("threads");
    if (threadsStatus === "success") {
      toast.success("Successfully connected to Threads!");
      // Clean query params
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchConnection();
    } else if (threadsStatus === "error") {
      const msg = params.get("message") || "Authorization failed";
      toast.error(`Threads OAuth error: ${msg}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const save = async () => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("profiles").update({ full_name: name, organization: org }).eq("id", u.user!.id);
    if (error) toast.error(error.message); else toast.success("Saved");
  };

  const connectThreads = async () => {
    setLoadingConfig(true);
    try {
      const config = await getConfigFn();
      const { data: u } = await supabase.auth.getUser();
      if (!config.appId || !config.redirectUri) {
        toast.error("Threads App ID or Redirect URI is not configured on the server.");
        return;
      }
      
      const statePayload = btoa(JSON.stringify({
        userId: u.user!.id,
        origin: window.location.origin
      }));
      
      const oauthUrl = `https://threads.net/oauth/authorize?client_id=${config.appId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=threads_basic&response_type=code&state=${statePayload}`;
      window.location.href = oauthUrl;
    } catch (e: any) {
      toast.error(e.message || "Failed to load Threads configuration.");
    } finally {
      setLoadingConfig(false);
    }
  };

  const disconnect = async () => {
    try {
      await disconnectFn();
      setThreadsConnection(null);
      setProfileData(null);
      toast.success("Disconnected Threads account successfully.");
    } catch (e: any) {
      toast.error(e.message || "Failed to disconnect.");
    }
  };

  const runTest = async () => {
    setTestingConnection(true);
    try {
      const data = await testProfileFn();
      setProfileData(data);
      toast.success("Threads API Profile query succeeded!");
    } catch (e: any) {
      toast.error(e.message || "Failed to retrieve profile data.");
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="font-medium">Profile</h2>
            <div><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Organization</Label><Input value={org} onChange={(e) => setOrg(e.target.value)} /></div>
            <Button onClick={save} className="w-full">Save changes</Button>
          </Card>

          <Card className="p-6">
            <h2 className="font-medium mb-2">Credits</h2>
            <div className="text-3xl font-semibold">{credits}</div>
            <p className="text-sm text-muted-foreground mt-1">Credits are consumed as agents run searches (~1 credit per 5 leads).</p>
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

                <div className="space-y-2">
                  <Button onClick={runTest} disabled={testingConnection} className="w-full text-xs h-9">
                    {testingConnection ? "Running Query Test..." : "Run Threads Profile API Test"}
                  </Button>

                  {profileData && (
                    <div className="p-4 rounded-lg bg-muted text-[11px] space-y-3 font-mono border border-border">
                      <div className="flex items-start gap-3">
                        {profileData.threads_profile_picture_url && (
                          <img src={profileData.threads_profile_picture_url} alt="Profile" className="h-10 w-10 rounded-full border border-border" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-foreground">@{profileData.username}</div>
                          {profileData.name && <div className="text-muted-foreground">{profileData.name}</div>}
                          {profileData.threads_biography && <div className="text-muted-foreground mt-1 text-[10px] italic leading-tight">{profileData.threads_biography}</div>}
                        </div>
                      </div>
                      <pre className="text-[9px] overflow-auto max-h-40 bg-card p-3 rounded border border-border mt-2 leading-relaxed">
                        {JSON.stringify(profileData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Button onClick={connectThreads} disabled={loadingConfig} className="w-full mt-4">
                {loadingConfig ? "Redirecting to Meta Threads..." : "Connect Threads Account"}
              </Button>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
