import { Activity } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { TierSelector } from "./TierSelector";
import { WalletConnectButton } from "./WalletConnectButton";
import tannerIcon from "@/assets/tanner-icon.png";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/" },
  { label: "Watchlist", path: "/watchlist" },
  { label: "Alerts", path: "/alerts" },
  { label: "$Tanner", path: "/token" },
  { label: "Pricing", path: "/pricing" },
  { label: "Rewards", path: "/rewards" },
  { label: "Sniper", path: "/sniper" },
  { label: "Launchpad", path: "/launchpad" },
  { label: "Merch", path: "/merch" },
  { label: "XRPL", path: "/xrpl" },
  { label: "Admin", path: "/merch/admin" },
];

export function TerminalHeader() {
  const location = useLocation();

  return (
    <header className="border-b border-border px-4 py-3 md:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={tannerIcon} alt="Tanner icon" className="h-5 w-5 rounded-full object-cover" loading="lazy" />
            <span className="font-mono text-lg font-bold tracking-tight text-foreground">
              TANNER<span className="text-primary">TERMINAL</span>
            </span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1 ml-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-mono transition-colors",
                  location.pathname === item.path ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                {item.label.toUpperCase()}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <TierSelector />
          <WalletConnectButton />
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
            <Activity className="h-3 w-3 text-terminal-green animate-pulse-glow" />
            <span>LIVE</span>
          </div>
        </div>
      </div>
      <nav className="flex sm:hidden items-center gap-1 mt-2 -mx-1 overflow-x-auto">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "text-center px-2 py-1.5 rounded-md text-[11px] font-mono transition-colors shrink-0",
              location.pathname === item.path ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            {item.label.toUpperCase()}
          </Link>
        ))}
      </nav>
    </header>
  );
}
