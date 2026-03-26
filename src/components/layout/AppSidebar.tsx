import {
  LayoutDashboard, BarChart3, Rocket, Crosshair, Wallet,
  Users, Brain, ShieldAlert, Star, Bell, PieChart, Sliders, Settings,
  ChevronLeft, ChevronRight, Flame, Info, Sparkles, LogOut, Coins, Globe, Layers,
  Crown, Siren
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const NAV_SOLANA = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Live Pairs", path: "/live-pairs", icon: BarChart3 },
  { label: "New Launches", path: "/new-launches", icon: Rocket },
  { label: "Sniper Mode", path: "/sniper-mode", icon: Crosshair },
  { label: "Wallet Tracker", path: "/wallet-tracker", icon: Wallet },
  { label: "Holdings", path: "/holdings", icon: Layers },
  { label: "Copy Trade", path: "/copy-trade", icon: Users },
  { label: "AI Signals", path: "/ai-signals", icon: Brain },
  { label: "Risk Scanner", path: "/risk-scanner", icon: ShieldAlert },
  { label: "Your SOL Claim", path: "/claim-sol", icon: Coins },
  { label: "Burning SOL", path: "/sol-burn", icon: Flame },
  { label: "Watchlist", path: "/watchlist", icon: Star },
  { label: "Alerts", path: "/alerts", icon: Bell },
  { label: "Portfolio", path: "/portfolio", icon: PieChart },
  { label: "Strategies", path: "/strategies", icon: Sliders },
  { label: "Launchpad", path: "/launchpad", icon: Flame },
  { label: "Pricing", path: "/pricing", icon: Crown },
];

const NAV_MULTICHAIN = [
  { label: "Multi-Chain Hub", path: "/multichain", icon: Globe },
  { label: "XRPL Ledger", path: "/xrpl", icon: Layers },
];

const NAV_OTHER = [
  { label: "Meme Gen", path: "/memes", icon: Sparkles },
  { label: "About", path: "/about", icon: Info },
  { label: "Settings", path: "/settings", icon: Settings },
];

const NAV_ADMIN = [
  { label: "War Room", path: "/war-room", icon: Siren },
];

interface AppSidebarProps {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { signOut, user, isAdmin, isGuest } = useAuth();

  return (
    <aside className={cn(
      "border-r border-border bg-sidebar shrink-0 flex flex-col h-full transition-all duration-200 overflow-hidden",
      collapsed ? "w-14" : "w-48"
    )}>
      <div className="flex-1 py-2 overflow-y-auto space-y-0.5 px-2">
        {!collapsed && <p className="text-[8px] font-mono text-muted-foreground/50 tracking-widest px-2.5 pt-1 pb-0.5">SOLANA</p>}
        {NAV_SOLANA.map((item) => {
          const active = location.pathname === item.path;
          return (
            <NavLink key={item.path} to={item.path} onClick={onNavigate}
              className={cn("flex items-center gap-3 px-2.5 py-2 rounded-md text-xs font-mono transition-all duration-150",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}>
              <item.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
              {!collapsed && <span className="truncate tracking-wide text-[11px]">{item.label.toUpperCase()}</span>}
            </NavLink>
          );
        })}
        {!collapsed && <div className="border-t border-border/30 my-1.5" />}
        {!collapsed && <p className="text-[8px] font-mono text-muted-foreground/50 tracking-widest px-2.5 pt-1 pb-0.5">MULTI-CHAIN</p>}
        {NAV_MULTICHAIN.map((item) => {
          const active = location.pathname === item.path;
          return (
            <NavLink key={item.path} to={item.path} onClick={onNavigate}
              className={cn("flex items-center gap-3 px-2.5 py-2 rounded-md text-xs font-mono transition-all duration-150",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}>
              <item.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
              {!collapsed && <span className="truncate tracking-wide text-[11px]">{item.label.toUpperCase()}</span>}
            </NavLink>
          );
        })}
        {!collapsed && <div className="border-t border-border/30 my-1.5" />}
        {NAV_OTHER.map((item) => {
          const active = location.pathname === item.path;
          return (
            <NavLink key={item.path} to={item.path} onClick={onNavigate}
              className={cn("flex items-center gap-3 px-2.5 py-2 rounded-md text-xs font-mono transition-all duration-150",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}>
              <item.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
              {!collapsed && <span className="truncate tracking-wide text-[11px]">{item.label.toUpperCase()}</span>}
            </NavLink>
          );
        })}
        {isAdmin && (
          <>
            {!collapsed && <div className="border-t border-terminal-amber/20 my-1.5" />}
            {!collapsed && <p className="text-[8px] font-mono text-terminal-amber/60 tracking-widest px-2.5 pt-1 pb-0.5">ADMIN</p>}
            {NAV_ADMIN.map((item) => {
              const active = location.pathname === item.path;
              return (
                <NavLink key={item.path} to={item.path} onClick={onNavigate}
                  className={cn("flex items-center gap-3 px-2.5 py-2 rounded-md text-xs font-mono transition-all duration-150",
                    active ? "bg-terminal-amber/10 text-terminal-amber" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}>
                  <item.icon className={cn("h-4 w-4 shrink-0", active && "text-terminal-amber")} />
                  {!collapsed && <span className="truncate tracking-wide text-[11px]">{item.label.toUpperCase()}</span>}
                </NavLink>
              );
            })}
          </>
        )}
      </div>
      <div className="border-t border-border">
        {user && isAdmin && !collapsed && (
          <div className="px-4 py-1.5 text-[9px] font-mono text-terminal-amber bg-terminal-amber/5 flex items-center gap-1.5">
            <ShieldAlert className="h-3 w-3" /> ADMIN
          </div>
        )}
        {isGuest && !collapsed && (
          <div className="px-4 py-1.5 text-[9px] font-mono text-muted-foreground bg-muted/20 flex items-center gap-1.5">
            <Info className="h-3 w-3" /> GUEST (READ-ONLY)
          </div>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-2 text-muted-foreground hover:text-terminal-red transition-colors text-xs font-mono w-full"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="text-[11px]">{isGuest ? "SIGN IN" : "SIGN OUT"}</span>}
        </button>
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
