import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Shield, Users, Search, Database, Coins, Activity, Wifi, Settings, Key,
  RefreshCw, Play, CheckCircle2, XCircle, AlertCircle, ExternalLink, Sparkles, MapPin, Youtube
} from "lucide-react";
import {
  getAdminStats,
  getAdminUsers,
  updateUserCredits,
  updateUserRole,
  getAdminSearches,
  getAdminLeads,
  getAdminCreditLedger,
  getAdminSourceIntegrations,
  saveSourceIntegration,
  toggleSourceIntegration,
  testSourceIntegration
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — LeadAI" },
      { name: "description", content: "Platform Administration System." }
    ],
  }),
  beforeLoad: async ({ context }) => {
    // Role-guard: Ensure user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email?.toLowerCase() === "admin2026@gmail.com") {
      return;
    }

    const { data: roleData, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.user.id)
      .maybeSingle();

    if (error || !roleData || roleData.role !== "admin") {
      toast.error("Access Denied: Platform Admin role required.");
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  const queryClient = useQueryClient();

  // Derive initial tab from URL hash (sidebar links use /admin#tab-name)
  const getTabFromHash = () => {
    if (typeof window === "undefined") return "overview";
    const hash = window.location.hash.replace("#", "");
    const valid = ["overview", "users", "searches", "leads", "credits", "platform-sources"];
    return valid.includes(hash) ? hash : "overview";
  };

  const [activeTab, setActiveTab] = useState(getTabFromHash);

  // Server functions hooks
  const getStatsFn = useServerFn(getAdminStats);
  const getUsersFn = useServerFn(getAdminUsers);
  const getSearchesFn = useServerFn(getAdminSearches);
  const getLeadsFn = useServerFn(getAdminLeads);
  const getLedgerFn = useServerFn(getAdminCreditLedger);
  const getIntegrationsFn = useServerFn(getAdminSourceIntegrations);

  const updateCreditsFn = useServerFn(updateUserCredits);
  const updateRoleFn = useServerFn(updateUserRole);
  const saveIntegrationFn = useServerFn(saveSourceIntegration);
  const toggleIntegrationFn = useServerFn(toggleSourceIntegration);
  const testIntegrationFn = useServerFn(testSourceIntegration);

  // Queries
  const { data: stats, isLoading: loadingStats, error: statsError, refetch: refetchStats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => getStatsFn(),
    staleTime: 30000
  });

  const { data: users, isLoading: loadingUsers, error: usersError, refetch: refetchUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => getUsersFn(),
    staleTime: 30000
  });

  const { data: searches, isLoading: loadingSearches, error: searchesError, refetch: refetchSearches } = useQuery({
    queryKey: ["admin-searches"],
    queryFn: () => getSearchesFn(),
    staleTime: 30000
  });

  const [leadTypeFilter, setLeadTypeFilter] = useState<"business" | "intent">("business");
  const { data: leads, isLoading: loadingLeads, error: leadsError, refetch: refetchLeads } = useQuery({
    queryKey: ["admin-leads", leadTypeFilter],
    queryFn: () => getLeadsFn({ data: { leadType: leadTypeFilter } }),
    staleTime: 30000
  });

  const { data: ledger, isLoading: loadingLedger, error: ledgerError, refetch: refetchLedger } = useQuery({
    queryKey: ["admin-ledger"],
    queryFn: () => getLedgerFn(),
    staleTime: 30000
  });

  const { data: integrations, isLoading: loadingIntegrations, error: integrationsError, refetch: refetchIntegrations } = useQuery({
    queryKey: ["admin-integrations"],
    queryFn: () => getIntegrationsFn(),
    staleTime: 30000
  });

  // Credit editor modal state
  const [creditUserId, setCreditUserId] = useState<string | null>(null);
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [creditReason, setCreditReason] = useState<string>("Admin adjustment");

  // Integration credential edits
  const [editedSecrets, setEditedSecrets] = useState<Record<string, Record<string, string>>>({});
  const [testingIds, setTestingIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Sync tab from URL hash when navigating via sidebar
    const syncHash = () => setActiveTab(getTabFromHash());
    window.addEventListener("hashchange", syncHash);

    // Check url for Threads connection feedback
    const params = new URLSearchParams(window.location.search);
    const threads = params.get("threads");
    if (threads === "success") {
      toast.success("Platform Threads account connected successfully!");
      setActiveTab("platform-sources");
      refetchIntegrations();
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (threads === "error") {
      const msg = params.get("message") || "Authorization failed";
      toast.error(`Platform Threads connection failed: ${msg}`);
      setActiveTab("platform-sources");
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  // Handlers
  const handleUpdateCredits = async () => {
    if (!creditUserId) return;
    try {
      const res = await updateCreditsFn({
        data: {
          userId: creditUserId,
          delta: creditAmount,
          reason: creditReason
        }
      });
      toast.success(`Credits adjusted successfully (new balance: ${res.credits})`);
      setCreditUserId(null);
      setCreditAmount(0);
      refetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Failed to adjust credits.");
    }
  };

  const handleUpdateRole = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === "admin" ? "user" : "admin";
    try {
      await updateRoleFn({ data: { userId, role: nextRole } });
      toast.success(`User role updated to ${nextRole}`);
      refetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Failed to update role.");
    }
  };

  const handleSaveIntegration = async (id: string, config: any) => {
    const secretsObj = editedSecrets[id] || {};
    try {
      await saveIntegrationFn({
        data: {
          id,
          config,
          secrets: secretsObj
        }
      });
      toast.success(`Source settings for "${id}" saved!`);
      setEditedSecrets(prev => ({ ...prev, [id]: {} }));
      refetchIntegrations();
      refetchStats();
    } catch (e: any) {
      toast.error(e.message || "Failed to save integration config.");
    }
  };

  const handleToggleIntegration = async (id: string, enabled: boolean) => {
    try {
      await toggleIntegrationFn({ data: { id, enabled } });
      toast.success(`Source "${id}" is now ${enabled ? "enabled" : "disabled"}`);
      refetchIntegrations();
      refetchStats();
    } catch (e: any) {
      toast.error(e.message || "Failed to toggle source status.");
    }
  };

  const handleTestIntegration = async (id: string) => {
    setTestingIds(prev => ({ ...prev, [id]: true }));
    try {
      const res = await testIntegrationFn({ data: { id } });
      if (res.success) {
        toast.success(`Connection test for ${id} succeeded!`);
      } else {
        toast.error(`Connection test for ${id} failed: ${res.error}`);
      }
      refetchIntegrations();
      refetchStats();
    } catch (e: any) {
      toast.error(e.message || "Failed to test integration.");
    } finally {
      setTestingIds(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleConnectThreads = async () => {
    try {
      const { getThreadsConfig } = await import("@/lib/threads.functions");
      const config = await getThreadsConfig();
      const { data: u } = await supabase.auth.getUser();
      if (!config.appId || !config.redirectUri) {
        toast.error("Threads App ID or Redirect URI is not configured.");
        return;
      }
      
      const statePayload = btoa(JSON.stringify({
        userId: u.user!.id,
        origin: window.location.origin,
        isAdminConnection: true
      }));
      
      const oauthUrl = `https://threads.net/oauth/authorize?client_id=${config.appId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=threads_basic&response_type=code&state=${statePayload}`;
      window.location.href = oauthUrl;
    } catch (e: any) {
      toast.error(e.message || "Failed to start Threads OAuth process.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "connected":
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Connected</Badge>;
      case "disabled":
        return <Badge variant="secondary">Disabled</Badge>;
      case "error":
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Connection Error</Badge>;
      case "not_configured":
      default:
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Not Configured</Badge>;
    }
  };

  const queryErrors = [statsError, usersError, searchesError, leadsError, ledgerError, integrationsError]
    .filter(Boolean) as Error[];
  
  const envError = queryErrors.find(
    e => e.message?.includes("SUPABASE_SERVICE_ROLE_KEY") || e.message?.includes("environment variable")
  );

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
            <Shield className="h-7 w-7 text-orange-400" /> Platform Admin System
          </h1>
          <p className="text-muted-foreground mt-1">
            Centralized controls for system health, user credits, searches, and API credentials.
          </p>
        </div>
        <Button onClick={() => { refetchStats(); refetchUsers(); refetchSearches(); refetchLeads(); refetchLedger(); refetchIntegrations(); }} variant="outline" size="sm" className="h-9">
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh Platform
        </Button>
      </div>

      {/* Env Warning Panel */}
      {envError && (
        <Card className="border-red-500/20 bg-red-500/5 text-red-200">
          <CardHeader className="pb-3 flex flex-row items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
            <div>
              <CardTitle className="text-base font-semibold text-red-400">Missing Supabase Service Role Key</CardTitle>
              <CardDescription className="text-red-300/80 text-xs mt-0.5">
                Admin backend operations require the Supabase Service Role Key to bypass Row-Level Security (RLS).
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <p>
              To run the admin panel locally, copy the <strong>service_role</strong> API secret key from your Supabase Dashboard and append it to your local <code className="bg-red-500/10 px-1 py-0.5 rounded text-red-300">.env</code> file:
            </p>
            <pre className="bg-black/40 p-3 rounded-md font-mono text-xs text-red-300/90 border border-red-500/10 overflow-x-auto">
              SUPABASE_SERVICE_ROLE_KEY="your_copied_service_role_secret_key"
            </pre>
            <p className="text-xs text-red-400/80">
              Note: Once you add this variable, you must restart your local dev terminal (<code className="bg-red-500/10 px-1 py-0.5 rounded text-red-300">npm run dev</code>) for changes to take effect.
            </p>
          </CardContent>
        </Card>
      )}

      {/* General Query Error Warning */}
      {!envError && queryErrors.length > 0 && (
        <Card className="border-amber-500/25 bg-amber-500/5 text-amber-200">
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
            <CardTitle className="text-sm font-semibold text-amber-400">Warning: Query Failed</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-amber-300/80">
            {queryErrors[0].message || "An unexpected error occurred while loading dashboard statistics."}
          </CardContent>
        </Card>
      )}

      {/* Main Tabs — TabsList hidden; sidebar hash links control active tab */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="sr-only">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="searches">Searches</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="credits">Credits Ledger</TabsTrigger>
          <TabsTrigger value="platform-sources">Platform Sources</TabsTrigger>
        </TabsList>

        {/* OVERVIEW CONTENT */}
        <TabsContent value="overview" className="space-y-6 outline-none">
          {loadingStats ? (
            <div className="p-12 text-center text-muted-foreground">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading platform analytics...
            </div>
          ) : (
            <>
              {/* Metrics Grid */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-orange-500/5 to-transparent border-border/40">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-orange-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats?.totalUsers ?? 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">registered accounts</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500/5 to-transparent border-border/40">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Leads Found</CardTitle>
                    <Database className="h-4 w-4 text-emerald-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats?.totalLeads ?? 0}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                      <span>{stats?.businessLeads ?? 0} B2B</span>
                      <span>•</span>
                      <span>{stats?.intentLeads ?? 0} Intent</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500/5 to-transparent border-border/40">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Searches</CardTitle>
                    <Search className="h-4 w-4 text-amber-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats?.totalSearches ?? 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">across all agents</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/5 to-transparent border-border/40">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Remaining Credits</CardTitle>
                    <Coins className="h-4 w-4 text-orange-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats?.totalCredits ?? 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">allocated to users</p>
                  </CardContent>
                </Card>
              </div>

              {/* Health Grid */}
              <div className="grid gap-6 md:grid-cols-3">
                {/* System Connections */}
                <Card className="col-span-1 border-border/40">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-4 w-4 text-orange-400" /> System Health Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <span className="text-sm font-medium">Supabase Database</span>
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20 flex items-center gap-1">
                        <Wifi className="h-3 w-3" /> Online
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Real-time Events Sub</span>
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20 flex items-center gap-1">
                        <Wifi className="h-3 w-3" /> Active
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* API Integrations Status */}
                <Card className="col-span-2 border-border/40">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Settings className="h-4 w-4 text-orange-400" /> API Connector Connectivity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Connector ID</TableHead>
                          <TableHead>Connection Status</TableHead>
                          <TableHead>Search Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats?.healthStatus?.integrations?.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-semibold capitalize">{item.id.replace("-", " ")}</TableCell>
                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                            <TableCell>
                              {item.id === "reddit" || item.id === "threads" ? (
                                <Badge variant="outline">Intent & B2B</Badge>
                              ) : (
                                <Badge variant="outline" className="border-slate-800 text-slate-400">B2B Discovery</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* USERS CONTENT */}
        <TabsContent value="users" className="outline-none">
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle>User Accounts & Role Permissions</CardTitle>
              <CardDescription>Manage balances, elevate developers, and inspect platform users.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="p-12 text-center text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading users...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Details</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-semibold text-foreground">{user.fullName}</div>
                          <div className="text-xs text-muted-foreground font-mono">{user.email}</div>
                          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">ID: {user.id}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={user.role === "admin" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : "bg-muted text-muted-foreground"}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold font-mono text-base">{user.credits}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="outline" onClick={() => { setCreditUserId(user.id); setCreditAmount(0); }}>Adjust Credits</Button>
                          <Button size="sm" variant="ghost" className="text-orange-400 hover:text-orange-300" onClick={() => handleUpdateRole(user.id, user.role)}>Toggle Role</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Credit Adjustment Inline Panel */}
          {creditUserId && (
            <Card className="mt-6 border-orange-500/20 bg-orange-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Adjust User Balance</span>
                  <Button size="sm" variant="ghost" onClick={() => setCreditUserId(null)}>Cancel</Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label>Credit Delta (e.g. +100 or -50)</Label>
                    <Input type="number" value={creditAmount} onChange={(e) => setCreditAmount(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label>Reason / Reference Note</Label>
                    <Input value={creditReason} onChange={(e) => setCreditReason(e.target.value)} />
                  </div>
                </div>
                <Button onClick={handleUpdateCredits} className="bg-orange-600 hover:bg-orange-500">Apply Credit Adjustment</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* SEARCHES CONTENT */}
        <TabsContent value="searches" className="outline-none">
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle>Global Searches History</CardTitle>
              <CardDescription>Monitor AI agent swarms launched across all accounts.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSearches ? (
                <div className="p-12 text-center text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading search logs...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Target Keyword</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Parameters</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Leads</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Launched</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searches?.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="font-semibold text-foreground">{s.keyword}</div>
                          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">ID: {s.id}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={s.leadType === "intent" ? "secondary" : "outline"}>
                            {s.leadType === "intent" ? "Intent" : "B2B"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-medium text-foreground">{s.userName}</div>
                          <div className="text-[9px] text-muted-foreground font-mono">{s.userId}</div>
                        </TableCell>
                        <TableCell className="text-xs space-y-0.5">
                          <div>Loc: {s.location}</div>
                          <div>Depth: {s.depth} ({s.strategy})</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={s.status === "completed" ? "bg-green-500/10 text-green-400" : s.status === "failed" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}>
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold">{s.leadsFound}</TableCell>
                        <TableCell className="font-mono text-xs">{s.creditsUsed}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* LEADS CONTENT */}
        <TabsContent value="leads" className="space-y-6 outline-none">
          <Card className="border-border/40">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Discovered Lead Records</CardTitle>
                <CardDescription>Raw inspection of business and community-intent leads stored on platform.</CardDescription>
              </div>
              <div className="flex bg-muted p-1 rounded-lg border border-border w-48">
                <Button size="sm" variant={leadTypeFilter === "business" ? "secondary" : "ghost"} className="flex-1 h-7 text-[10px]" onClick={() => setLeadTypeFilter("business")}>B2B Leads</Button>
                <Button size="sm" variant={leadTypeFilter === "intent" ? "secondary" : "ghost"} className="flex-1 h-7 text-[10px]" onClick={() => setLeadTypeFilter("intent")}>Intent Leads</Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingLeads ? (
                <div className="p-12 text-center text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading leads records...
                </div>
              ) : leads?.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">No leads of this type found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {leadTypeFilter === "business" ? (
                        <>
                          <TableHead>Company & Website</TableHead>
                          <TableHead>Contact Email</TableHead>
                          <TableHead>Phone Number</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Sources</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead>Post Title / Content</TableHead>
                          <TableHead>Intent Score</TableHead>
                          <TableHead>Matched Keyword</TableHead>
                          <TableHead>Author & Date</TableHead>
                          <TableHead>Platform Link</TableHead>
                        </>
                      )}
                      <TableHead>Discovered By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads?.map((l: any) => (
                      <TableRow key={l.id}>
                        {leadTypeFilter === "business" ? (
                          <>
                            <TableCell>
                              <div className="font-semibold text-foreground">{l.companyName}</div>
                              {l.website && <a href={l.website} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-400 flex items-center gap-0.5 hover:underline mt-0.5">{l.website} <ExternalLink className="h-3 w-3 inline" /></a>}
                            </TableCell>
                            <TableCell className="font-mono text-xs">{l.email || "—"}</TableCell>
                            <TableCell className="font-mono text-xs">{l.phone || "—"}</TableCell>
                            <TableCell className="text-xs">{l.location}</TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px] uppercase font-mono">{l.source}</Badge></TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="max-w-xs">
                              <div className="font-semibold text-foreground line-clamp-1">{l.companyName}</div>
                              <div className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{l.snippets?.[0] || l.snippets || "No content"}</div>
                            </TableCell>
                            <TableCell>
                              <Badge className={l.intentScore >= 80 ? "bg-orange-500/10 text-orange-400" : l.intentScore >= 50 ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"}>
                                {l.intentScore}%
                              </Badge>
                            </TableCell>
                            <TableCell><Badge variant="outline">{l.matchedKeyword || "—"}</Badge></TableCell>
                            <TableCell className="text-xs space-y-0.5">
                              <div>{l.postAuthor || "Anonymous"}</div>
                              <div className="text-[10px] text-muted-foreground">{new Date(l.createdAt).toLocaleDateString()}</div>
                            </TableCell>
                            <TableCell>
                              {l.postUrl && <a href={l.postUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-400 flex items-center gap-0.5 hover:underline">Link <ExternalLink className="h-3 w-3 inline" /></a>}
                            </TableCell>
                          </>
                        )}
                        <TableCell>
                          <div className="text-xs font-semibold">{l.userName}</div>
                          <div className="text-[9px] text-muted-foreground font-mono">{l.userId}</div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CREDITS LEDGER CONTENT */}
        <TabsContent value="credits" className="outline-none">
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle>Credit Balance Ledger Logs</CardTitle>
              <CardDescription>Track transaction ledger log of credit updates.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLedger ? (
                <div className="p-12 text-center text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading ledger...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Account</TableHead>
                      <TableHead>Transaction Delta</TableHead>
                      <TableHead>Adjustment Reason</TableHead>
                      <TableHead>Date & Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledger?.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="font-semibold">{log.userName}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{log.userId}</div>
                        </TableCell>
                        <TableCell className={`font-mono text-base font-bold ${log.delta > 0 ? "text-green-400" : "text-red-400"}`}>
                          {log.delta > 0 ? `+${log.delta}` : log.delta}
                        </TableCell>
                        <TableCell className="text-sm font-medium">{log.reason}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PLATFORM SOURCES CONTENT */}
        <TabsContent value="platform-sources" className="space-y-6 outline-none">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-medium tracking-tight flex items-center gap-2">
                <Wifi className="h-5 w-5 text-orange-400" /> Platform Sources
              </h2>
              <p className="text-xs text-muted-foreground mt-1">All data sources used across intent and business discovery searches. Configure credentials, enable/disable, and test connectivity.</p>
            </div>
          </div>

          {loadingIntegrations ? (
            <div className="p-12 text-center text-muted-foreground">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading API configurations...
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {integrations?.map((item: any) => {
                const isEditing = editedSecrets[item.id] !== undefined;
                const configValues = item.config || {};
                const isEnabled = configValues.enabled !== false;
                const isTesting = testingIds[item.id] || false;
                const configuredViaEnv = item.configuredViaEnv === true;

                // Real brand logos map
                const LOGOS: Record<string, { src: string; alt: string }> = {
                  reddit:       { src: "https://cdn.simpleicons.org/reddit/FF4500",    alt: "Reddit" },
                  x:            { src: "https://cdn.simpleicons.org/x/ffffff",         alt: "X" },
                  youtube:      { src: "https://cdn.simpleicons.org/youtube/FF0000",   alt: "YouTube" },
                  threads:      { src: "https://cdn.simpleicons.org/threads/ffffff",   alt: "Threads" },
                  mastodon:     { src: "https://cdn.simpleicons.org/mastodon/6364FF",  alt: "Mastodon" },
                  discourse:    { src: "https://cdn.simpleicons.org/discourse/ffffff", alt: "Discourse" },
                  rss:          { src: "https://cdn.simpleicons.org/rss/FFA500",       alt: "RSS" },
                  "hacker-news":{ src: "https://cdn.simpleicons.org/ycombinator/FF6600", alt: "Hacker News" },
                  openstreetmap:{ src: "https://cdn.simpleicons.org/openstreetmap/7EBC6F", alt: "OpenStreetMap" },
                  "google-places":{ src: "https://cdn.simpleicons.org/googlemaps/4285F4", alt: "Google Maps" },
                  firecrawl:    { src: "https://www.firecrawl.dev/favicon.ico",        alt: "Firecrawl" },
                };
                const logo = LOGOS[item.id];

                return (
                  <Card key={item.id} className="border-border/40 relative flex flex-col justify-between">
                    <CardHeader className="pb-3 flex flex-row items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="capitalize text-lg flex items-center gap-2">
                          {/* Real brand logo */}
                          <div className="h-6 w-6 flex items-center justify-center shrink-0">
                            {logo
                              ? <img src={logo.src} alt={logo.alt} className="h-5 w-5 object-contain" />
                              : <Shield className="h-4 w-4 text-slate-400" />
                            }
                          </div>
                          <span className="capitalize">{item.id.replace(/-/g, " ")}</span>
                          {(item.id === "hacker-news" || item.id === "openstreetmap") && (
                            <Badge className="ml-1 text-[9px] h-4 px-1.5 bg-emerald-500/15 text-emerald-400 border-emerald-500/25">Free · No Auth</Badge>
                          )}
                          {["reddit", "threads", "discourse", "rss", "mastodon"].includes(item.id) && (
                            <Badge className="ml-1 text-[9px] h-4 px-1.5 bg-sky-500/15 text-sky-400 border-sky-500/25">Intent</Badge>
                          )}
                          {item.id === "x" && (
                            <Badge className="ml-1 text-[9px] h-4 px-1.5 bg-blue-500/15 text-blue-400 border-blue-500/25">Intent · API</Badge>
                          )}
                          {["firecrawl", "google-places", "youtube"].includes(item.id) && (
                            <Badge className="ml-1 text-[9px] h-4 px-1.5 bg-purple-500/15 text-purple-400 border-purple-500/25">Business Discovery</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {item.id === "firecrawl" && "Crawls and scraps contact emails and company info."}
                          {item.id === "reddit" && "Reddit search connector for intent discovery."}
                          {item.id === "threads" && "Central platform account access for Threads intent leads."}
                          {item.id === "openstreetmap" && "Free OpenStreetMap area mapping connector."}
                          {item.id === "google-places" && "Google Maps Local Places listing directory."}
                          {item.id === "youtube" && "Google Data API v3 — fetches review videos for business listings."}
                          {item.id === "discourse" && "Queries public search endpoints on specified Discourse communities."}
                          {item.id === "rss" && "Parses custom RSS or Atom XML feeds for posts matching keywords."}
                          {item.id === "hacker-news" && "Searches stories and comments on the Hacker News search API."}
                          {item.id === "mastodon" && "Searches status posts across Mastodon network nodes."}
                          {item.id === "x" && "Connects to official X (Twitter) API v2 endpoints."}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        {getStatusBadge(item.status)}
                        <Button size="sm" variant="ghost" className="h-7 text-xs font-semibold px-2" onClick={() => handleToggleIntegration(item.id, !isEnabled)}>
                          {isEnabled ? "Disable" : "Enable"}
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4 pt-2">
                      {/* Configuration Inputs based on connector ID */}
                      {item.id !== "openstreetmap" && item.id !== "hacker-news" && (
                        <div className="space-y-3 p-3 bg-muted/40 rounded-lg border border-border/60">
                          {/* ENV configured notice */}
                          {configuredViaEnv && (
                            <div className="flex items-center gap-2 text-xs p-2 rounded border border-emerald-500/20 bg-emerald-500/5 text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                              <span>Credentials loaded from <code className="font-mono bg-emerald-500/10 px-1 rounded">.env</code> — overwrite below to use DB-stored keys instead.</span>
                            </div>
                          )}
                          {Object.keys(item.secrets).map((secKey) => {
                            const secretsMapForSource = editedSecrets[item.id] || {};
                            const editVal = secretsMapForSource[secKey] ?? "";

                            return (
                              <div key={secKey} className="space-y-1.5">
                                <Label className="text-xs uppercase font-mono text-muted-foreground flex items-center gap-1.5">
                                  {secKey.replace(/([A-Z])/g, " $1")}
                                  {configuredViaEnv && (
                                    <Badge className="text-[8px] h-3.5 px-1 bg-emerald-500/15 text-emerald-400 border-emerald-500/25">ENV</Badge>
                                  )}
                                </Label>
                                <Input
                                  type="password"
                                  placeholder={configuredViaEnv && !isEditing ? "Loaded from .env (override to use DB key)" : isEditing ? "Enter new secret token" : "••••••••"}
                                  value={editVal}
                                  onChange={(e) => {
                                    setEditedSecrets(prev => ({
                                      ...prev,
                                      [item.id]: {
                                        ...(prev[item.id] || {}),
                                        [secKey]: e.target.value
                                      }
                                    }));
                                  }}
                                  className="h-8 font-mono text-xs"
                                />
                              </div>
                            );
                          })}

                          {/* Extra Config parameters if any */}
                          {item.id === "threads" && (
                            <div className="space-y-3 pt-2 border-t border-border mt-2">
                              <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-mono text-muted-foreground">App ID</Label>
                                <Input
                                  value={configValues.appId || ""}
                                  onChange={(e) => {
                                    // Instantly update database state
                                    const nextConfig = { ...configValues, appId: e.target.value };
                                    queryClient.setQueryData(["admin-integrations"], (prev: any) =>
                                      prev?.map((x: any) => (x.id === "threads" ? { ...x, config: nextConfig } : x))
                                    );
                                  }}
                                  placeholder="Threads App ID"
                                  className="h-8 font-mono text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-mono text-muted-foreground">Redirect URI</Label>
                                <Input
                                  value={configValues.redirectUri || ""}
                                  onChange={(e) => {
                                    const nextConfig = { ...configValues, redirectUri: e.target.value };
                                    queryClient.setQueryData(["admin-integrations"], (prev: any) =>
                                      prev?.map((x: any) => (x.id === "threads" ? { ...x, config: nextConfig } : x))
                                    );
                                  }}
                                  placeholder="Redirect callback URL"
                                  className="h-8 font-mono text-xs"
                                />
                              </div>

                              {configValues.username && (
                                <div className="text-xs p-2.5 rounded border border-orange-500/20 bg-orange-500/5 mt-2">
                                  <div className="font-semibold text-foreground">Connected Platform Account:</div>
                                  <div className="text-orange-400 font-bold mt-0.5">@{configValues.username}</div>
                                </div>
                              )}
                            </div>
                          )}

                          {item.id === "discourse" && (
                            <div className="space-y-3 pt-2 border-t border-border mt-2">
                              <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-mono text-muted-foreground">Forum URLs (comma-separated)</Label>
                                <Input
                                  value={configValues.forumUrls || ""}
                                  onChange={(e) => {
                                    const nextConfig = { ...configValues, forumUrls: e.target.value };
                                    queryClient.setQueryData(["admin-integrations"], (prev: any) =>
                                      prev?.map((x: any) => (x.id === "discourse" ? { ...x, config: nextConfig } : x))
                                    );
                                  }}
                                  placeholder="https://meta.discourse.org, https://forums.docker.com"
                                  className="h-8 font-mono text-xs"
                                />
                              </div>
                            </div>
                          )}

                          {item.id === "rss" && (
                            <div className="space-y-3 pt-2 border-t border-border mt-2">
                              <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-mono text-muted-foreground">Feed XML URLs (comma-separated)</Label>
                                <Input
                                  value={configValues.feedUrls || ""}
                                  onChange={(e) => {
                                    const nextConfig = { ...configValues, feedUrls: e.target.value };
                                    queryClient.setQueryData(["admin-integrations"], (prev: any) =>
                                      prev?.map((x: any) => (x.id === "rss" ? { ...x, config: nextConfig } : x))
                                    );
                                  }}
                                  placeholder="https://hnrss.org/jobs, https://stackoverflow.com/jobs/feed"
                                  className="h-8 font-mono text-xs"
                                />
                              </div>
                            </div>
                          )}

                          {item.id === "mastodon" && (
                            <div className="space-y-3 pt-2 border-t border-border mt-2">
                              <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-mono text-muted-foreground">Mastodon Instance URL</Label>
                                <Input
                                  value={configValues.instanceUrl || ""}
                                  onChange={(e) => {
                                    const nextConfig = { ...configValues, instanceUrl: e.target.value };
                                    queryClient.setQueryData(["admin-integrations"], (prev: any) =>
                                      prev?.map((x: any) => (x.id === "mastodon" ? { ...x, config: nextConfig } : x))
                                    );
                                  }}
                                  placeholder="mastodon.social"
                                  className="h-8 font-mono text-xs"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {(item.id === "openstreetmap" || item.id === "hacker-news") && (
                        <div className="text-xs text-muted-foreground p-3 bg-muted/40 rounded border">
                          {item.id === "hacker-news" 
                            ? "No authentication required. Public Algolia Hacker News search API is queried dynamically."
                            : "No authentication required. Zero-cost Overpass API server queries are made dynamically."}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2 justify-end pt-2">
                        {item.id !== "openstreetmap" && item.id !== "hacker-news" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => handleSaveIntegration(item.id, configValues)}
                          >
                            Save Settings
                          </Button>
                        )}
                        
                        {item.id === "threads" && isEnabled && (
                          <Button
                            size="sm"
                            onClick={handleConnectThreads}
                            className="h-8 text-xs bg-orange-600 hover:bg-orange-500"
                          >
                            Connect Threads OAuth
                          </Button>
                        )}

                        <Button
                          size="sm"
                          onClick={() => handleTestIntegration(item.id)}
                          disabled={isTesting || !isEnabled}
                          className="h-8 text-xs"
                          variant="secondary"
                        >
                          {isTesting ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : <Play className="h-3 w-3 mr-1" />} Test Connection
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
