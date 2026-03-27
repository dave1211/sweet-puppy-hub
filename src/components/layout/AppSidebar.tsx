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

/* ───── Nav section definitions ───── */

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

/* ───── Component ───── */

interface AppSidebarProps {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { signOut, user, isAdmin, isGuest } = useAuth();
  const { tierLabel } = useTier();

  // Track which sections are expanded (all open by default)
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
    const accentColor = section.accent ?? "primary";
    const hasActiveChild = section.items.some(i => isActive(i.path));

    return (
      <div key={section.id}>
        {/* Section header — clickable to collapse */}
        {!collapsed && (
          <button
            onClick={() => toggleSection(section.id)}
            className={cn(
              "flex items-center justify-between w-full px-2.5 pt-2 pb-1 text-[8px] font-mono tracking-widest transition-colors",
              hasActiveChild
                ? `text-${accentColor}`
                : `text-muted-foreground/50 hover:text-muted-foreground`
            )}
          >
            <span>{section.title}</span>
            <ChevronDown className={cn(
              "h-2.5 w-2.5 transition-transform",
              !isOpen && "-rotate-90"
            )} />
          </button>
        )}

        {/* Items */}
        {(collapsed || isOpen) && section.items.map((item) => {
          const active = isActive(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-2.5 py-2 rounded-md text-xs font-mono transition-all duration-150",
                active
                  ? section.accent
                    ? `bg-${accentColor}/10 text-${accentColor}`
                    : "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", active && (section.accent ? `text-${accentColor}` : "text-primary"))} />
              {!collapsed && (
                <>
                  <span className="truncate tracking-wide text-[11px]">{item.label.toUpperCase()}</span>
                  {item.badge && (
                    <span className="text-[7px] font-mono px-1 py-0 rounded bg-primary/20 text-primary ml-auto">{item.badge}</span>
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
      collapsed ? "w-14" : "w-48"
    )}>
      <div className="flex-1 py-2 overflow-y-auto space-y-0.5 px-2">
        {SECTIONS.map(renderSection)}

        {/* Admin section — only for admins */}
        {isAdmin && (
          <>
            {!collapsed && <div className="border-t border-terminal-amber/20 my-1.5" />}
            {renderSection(ADMIN_SECTION)}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border">
        {/* Tier + role badge */}
        {user && !collapsed && (
          <div className={cn(
            "px-4 py-1.5 text-[9px] font-mono flex items-center gap-1.5",
            isAdmin
              ? "text-terminal-amber bg-terminal-amber/5"
              : "text-primary bg-primary/5"
          )}>
            {isAdmin ? <ShieldAlert className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {tierLabel} {isAdmin && "· ADMIN"}
          </div>
        )}
        {isGuest && !collapsed && (
          <div className="px-4 py-1.5 text-[9px] font-mono text-muted-foreground bg-muted/20 flex items-center gap-1.5">
            <Info className="h-3 w-3" /> GUEST (READ-ONLY)
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-2 text-muted-foreground hover:text-terminal-red transition-colors text-xs font-mono w-full"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="text-[11px]">{isGuest ? "SIGN IN" : "SIGN OUT"}</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-2 border-t border-border text-muted-foreground hover:text-foreground transition-colors hidden md:flex items-center justify-center"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
