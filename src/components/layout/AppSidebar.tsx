import {
  LayoutDashboard, BarChart3, Rocket, Crosshair, Wallet,
  Users, Brain, ShieldAlert, Star, Bell, PieChart, Sliders, Settings,
  ChevronLeft, ChevronRight, ChevronDown, Flame, Info, Sparkles, LogOut,
  Coins, Globe, Layers, Crown, Siren, Eye, Activity
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTier } from "@/contexts/TierContext";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
  accent?: string;
}

const SECTIONS: NavSection[] = [
  {
    id: "core",
    title: "TERMINAL",
    items: [
      { label: "Dashboard", path: "/", icon: LayoutDashboard },
      { label: "Scanner", path: "/scanner", icon: Crosshair, badge: "NEW" },
      { label: "Live Pairs", path: "/live-pairs", icon: BarChart3 },
      { label: "AI Signals", path: "/ai-signals", icon: Brain },
    ],
  },
  {
    id: "trading",
    title: "TRADING",
    items: [
      { label: "Sniper Mode", path: "/sniper-mode", icon: Crosshair },
      { label: "New Launches", path: "/new-launches", icon: Rocket },
      { label: "Launchpad", path: "/launchpad", icon: Flame },
      { label: "Copy Trade", path: "/copy-trade", icon: Users },
      { label: "Strategies", path: "/strategies", icon: Sliders },
    ],
  },
  {
    id: "portfolio",
    title: "PORTFOLIO",
    items: [
      { label: "Portfolio", path: "/portfolio", icon: PieChart },
      { label: "Holdings", path: "/holdings", icon: Layers },
      { label: "Wallet Tracker", path: "/wallet-tracker", icon: Wallet },
      { label: "Watchlist", path: "/watchlist", icon: Star },
    ],
  },
  {
    id: "safety",
    title: "SAFETY",
    items: [
      { label: "Risk Scanner", path: "/risk-scanner", icon: ShieldAlert },
      { label: "Alerts", path: "/alerts", icon: Bell },
      { label: "SOL Burn", path: "/sol-burn", icon: Flame },
    ],
  },
  {
    id: "multichain",
    title: "MULTI-CHAIN",
    items: [
      { label: "Multi-Chain Hub", path: "/multichain", icon: Globe },
      { label: "XRPL Ledger", path: "/xrpl", icon: Activity },
    ],
  },
  {
    id: "extras",
    title: "MORE",
    items: [
      { label: "Claim SOL", path: "/claim-sol", icon: Coins },
      { label: "Meme Gen", path: "/memes", icon: Sparkles },
      { label: "Pricing", path: "/pricing", icon: Crown },
      { label: "About", path: "/about", icon: Info },
      { label: "Settings", path: "/settings", icon: Settings },
    ],
  },
];

const ADMIN_SECTION: NavSection = {
  id: "admin",
  title: "ADMIN",
  accent: "terminal-amber",
  items: [
    { label: "War Room", path: "/war-room", icon: Siren },
  ],
};

interface AppSidebarProps {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { signOut, user, isAdmin, isGuest } = useAuth();
  const { tierLabel } = useTier();

  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(SECTIONS.map(s => s.id).concat("admin"))
  );

  const toggleSection = useCallback((id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const renderSection = (section: NavSection) => {
    const isOpen = openSections.has(section.id);
    const hasActiveChild = section.items.some(i => isActive(i.path));

    return (
      <div key={section.id} className="mb-1">
        {!collapsed && (
          <button
            onClick={() => toggleSection(section.id)}
            className={cn(
              "flex items-center justify-between w-full px-3 pt-3 pb-1.5 text-[8px] font-mono tracking-[0.15em] transition-colors",
              hasActiveChild
                ? "text-primary"
                : "text-muted-foreground/40 hover:text-muted-foreground/60"
            )}
          >
            <span>{section.title}</span>
            <ChevronDown className={cn(
              "h-2.5 w-2.5 transition-transform duration-200",
              !isOpen && "-rotate-90"
            )} />
          </button>
        )}

        {(collapsed || isOpen) && section.items.map((item) => {
          const active = isActive(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-[11px] font-mono transition-all duration-150 mx-1",
                active
                  ? "bg-primary/10 text-primary border border-primary/15"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
              )}
            >
              <item.icon className={cn("h-3.5 w-3.5 shrink-0", active && "text-primary")} />
              {!collapsed && (
                <>
                  <span className="truncate tracking-wide">{item.label.toUpperCase()}</span>
                  {item.badge && (
                    <span className="text-[7px] font-mono px-1.5 py-0.5 rounded-full bg-primary/15 text-primary ml-auto">{item.badge}</span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    );
  };

  return (
    <aside className={cn(
      "border-r border-border bg-sidebar shrink-0 flex flex-col h-full transition-all duration-200 overflow-hidden",
      collapsed ? "w-14" : "w-52"
    )}>
      <div className="flex-1 py-2 overflow-y-auto px-1">
        {SECTIONS.map(renderSection)}

        {isAdmin && (
          <>
            {!collapsed && <div className="border-t border-terminal-amber/15 mx-3 my-1" />}
            {renderSection(ADMIN_SECTION)}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border">
        {user && !collapsed && (
          <div className={cn(
            "px-4 py-2 text-[9px] font-mono flex items-center gap-1.5",
            isAdmin
              ? "text-terminal-amber bg-terminal-amber/5"
              : "text-primary/70 bg-primary/3"
          )}>
            {isAdmin ? <ShieldAlert className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            <span>{tierLabel} {isAdmin && "· ADMIN"}</span>
          </div>
        )}
        {isGuest && !collapsed && (
          <div className="px-4 py-2 text-[9px] font-mono text-muted-foreground/60 bg-muted/10 flex items-center gap-1.5">
            <Info className="h-3 w-3" /> GUEST (READ-ONLY)
          </div>
        )}

        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-2.5 text-muted-foreground/60 hover:text-terminal-red transition-colors text-xs font-mono w-full"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && <span className="text-[10px]">{isGuest ? "SIGN IN" : "SIGN OUT"}</span>}
        </button>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-2 border-t border-border text-muted-foreground/40 hover:text-foreground transition-colors hidden md:flex items-center justify-center"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>
    </aside>
  );
}
