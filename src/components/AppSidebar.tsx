import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Search, Database, History, FolderKanban, FileDown, Settings, LogOut, MapPin, Sparkles } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/Logo";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "New Search", url: "/search", icon: Search },
  { title: "Directory Agent", url: "/directory", icon: MapPin },
  { title: "All Leads", url: "/results", icon: Database },
  { title: "Intent Leads", url: "/intent-leads", icon: Sparkles },
  { title: "History", url: "/history", icon: History },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Exports", url: "/exports", icon: FileDown },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name, credits_remaining").maybeSingle();
      return data;
    },
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8 rounded-lg" />
          {!collapsed && <span className="font-semibold tracking-tight">LeadAI</span>}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => {
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
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed && (
          <div className="mb-2 rounded-lg bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-500/20 p-3">
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
