import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Search, Database, History, FolderKanban, FileDown, Settings, LogOut, MapPin, Sparkles, Shield, Users, Coins, Activity, Wifi, ArrowLeft, BarChart3, MessageSquare } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/Logo";
import { useMemo } from "react";

const userItems = [
  { title: "Dashboard",       url: "/dashboard",     icon: LayoutDashboard },
  { title: "New Search",      url: "/search",        icon: Search },
  { title: "Directory Agent", url: "/directory",     icon: MapPin },
  { title: "All Leads",       url: "/results",       icon: Database },
  { title: "Intent Leads",    url: "/intent-leads",  icon: Sparkles },
  { title: "Reddit Posts",    url: "/reddit-posts",  icon: MessageSquare },
  { title: "History",         url: "/history",       icon: History },
  { title: "Projects",        url: "/projects",      icon: FolderKanban },
  { title: "Exports",         url: "/exports",       icon: FileDown },
  { title: "Settings",        url: "/settings",      icon: Settings },
];

// Admin-only nav items — these deep-link into admin tab via hash
const adminItems = [
  { title: "Overview",         url: "/admin#overview",          icon: BarChart3 },
  { title: "Users",            url: "/admin#users",             icon: Users },
  { title: "Searches",         url: "/admin#searches",          icon: Search },
  { title: "Leads",            url: "/admin#leads",             icon: Database },
  { title: "Credits Ledger",   url: "/admin#credits",           icon: Coins },
  { title: "Platform Sources", url: "/admin#platform-sources",  icon: Wifi },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();

  const isAdminPage = path === "/admin" || path.startsWith("/admin/");

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name, credits_remaining").maybeSingle();
      return data;
    },
  });

  const { data: userRole } = useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email?.toLowerCase() === "admin2026@gmail.com") {
        return "admin";
      }
      const { data } = await supabase.from("user_roles").select("role").maybeSingle();
      return data?.role || "user";
    },
  });

  const sidebarItems = useMemo(() => {
    if (userRole === "admin") {
      return [...userItems, { title: "Admin Panel", url: "/admin", icon: Shield }];
    }
    return userItems;
  }, [userRole]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8 rounded-lg" />
          {!collapsed && (
            <div>
              <span className="font-semibold tracking-tight">LeadAI</span>
              {isAdminPage && (
                <div className="text-[10px] text-orange-400 font-medium leading-none mt-0.5">Admin Panel</div>
              )}
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {isAdminPage ? (
          /* ── ADMIN NAV ── */
          <>
            <SidebarGroup>
              {!collapsed && (
                <SidebarGroupLabel className="flex items-center gap-1.5 text-orange-400/80">
                  <Shield className="h-3 w-3" /> Administration
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminItems.map((it) => {
                    const tabHash = it.url.split("#")[1];
                    const active = typeof window !== "undefined"
                      ? window.location.hash === `#${tabHash}` || (tabHash === "overview" && !window.location.hash)
                      : false;
                    return (
                      <SidebarMenuItem key={it.url}>
                        <SidebarMenuButton asChild isActive={active}>
                          <a href={it.url} className="flex items-center gap-2">
                            <it.icon className="h-4 w-4" />
                            {!collapsed && <span>{it.title}</span>}
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Back to workspace link */}
            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        {!collapsed && <span>Back to Workspace</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : (
          /* ── USER NAV ── */
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {sidebarItems.map((it) => {
                  const active = path === it.url || path.startsWith(it.url + "/");
                  return (
                    <SidebarMenuItem key={it.url}>
                      <SidebarMenuButton asChild isActive={active}>
                        <Link to={it.url} className="flex items-center gap-2">
                          <it.icon className="h-4 w-4" />
                          {!collapsed && <span>{it.title}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!isAdminPage && !collapsed && (
          <div className="mb-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 p-3">
            <div className="text-xs text-muted-foreground">Credits</div>
            <div className="text-lg font-semibold">{profile?.credits_remaining ?? "—"}</div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="justify-start gap-2"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/auth" });
          }}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sign out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

