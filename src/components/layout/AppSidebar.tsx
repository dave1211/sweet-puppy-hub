import {
  LayoutDashboard, BarChart3, Rocket, Crosshair, Wallet,
  Users, Brain, ShieldAlert, Star, Bell, PieChart, Sliders, Settings
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const NAV = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Live Pairs", path: "/live-pairs", icon: BarChart3 },
  { label: "New Launches", path: "/new-launches", icon: Rocket },
  { label: "Sniper Mode", path: "/sniper-mode", icon: Crosshair },
  { label: "Wallet Tracker", path: "/wallet-tracker", icon: Wallet },
  { label: "Copy Trade", path: "/copy-trade", icon: Users },
  { label: "AI Signals", path: "/ai-signals", icon: Brain },
  { label: "Risk Scanner", path: "/risk-scanner", icon: ShieldAlert },
  { label: "Watchlist", path: "/watchlist", icon: Star },
  { label: "Alerts", path: "/alerts", icon: Bell },
  { label: "Portfolio", path: "/portfolio", icon: PieChart },
  { label: "Strategies", path: "/strategies", icon: Sliders },
  { label: "Settings", path: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.path}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-xs font-mono transition-all duration-150",
                          active
                            ? "bg-primary/10 text-primary border-l-2 border-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <item.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                        {!collapsed && (
                          <span className="truncate tracking-wide">{item.label.toUpperCase()}</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
