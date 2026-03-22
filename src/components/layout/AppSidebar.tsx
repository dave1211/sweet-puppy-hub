import {
  LayoutDashboard, BarChart3, Rocket, Crosshair, Wallet,
  Users, Brain, ShieldAlert, Star, Bell, PieChart, Sliders, Settings, ChevronLeft, ChevronRight, Flame, Info
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";

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
  { label: "Launchpad", path: "/launchpad", icon: Flame },
  { label: "About", path: "/about", icon: Info },
  { label: "Settings", path: "/settings", icon: Settings },
];

interface AppSidebarProps {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "border-r border-border bg-sidebar shrink-0 flex flex-col h-full transition-all duration-200 overflow-hidden",
      collapsed ? "w-14" : "w-48"
    )}>
      <div className="flex-1 py-2 overflow-y-auto space-y-0.5 px-2">
        {NAV.map((item) => {
          const active = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-2.5 py-2 rounded-md text-xs font-mono transition-all duration-150",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
              {!collapsed && (
                <span className="truncate tracking-wide text-[11px]">{item.label.toUpperCase()}</span>
              )}
            </NavLink>
          );
        })}
      </div>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-2 border-t border-border text-muted-foreground hover:text-foreground transition-colors hidden md:flex items-center justify-center"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
