import { Search, Settings, Zap, Clock, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { WalletConnectButton } from "@/components/terminal/WalletConnectButton";
import { NotificationCenter } from "@/components/alerts/NotificationCenter";

interface AppTopbarProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export function AppTopbar({ onToggleSidebar, sidebarOpen }: AppTopbarProps) {
  const [search, setSearch] = useState("");
  const [time, setTime] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && search.trim().length > 20) {
      navigate(`/token/${search.trim()}`);
      setSearch("");
    }
  };

  return (
    <header className="border-b border-border bg-card/90 backdrop-blur-md px-4 py-0 relative z-20 shrink-0">
      <div className="flex items-center h-12 gap-3">
        {/* Mobile hamburger */}
        <button onClick={onToggleSidebar} className="p-1.5 rounded-md hover:bg-muted/50 transition-colors md:hidden">
          {sidebarOpen ? <X className="h-4 w-4 text-muted-foreground" /> : <Menu className="h-4 w-4 text-muted-foreground" />}
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Zap className="h-4 w-4 text-primary" />
            <div className="absolute inset-0 blur-sm bg-primary/20 rounded-full" />
          </div>
          <span className="font-mono text-sm font-bold tracking-tight text-foreground hidden sm:inline">
            TANNER<span className="text-primary">TERMINAL</span>
          </span>
        </Link>

        <div className="h-5 w-px bg-border/40 hidden md:block" />

        {/* Search */}
        <div className="flex-1 max-w-md relative hidden sm:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search token, wallet, contract..."
            className="w-full bg-muted/30 border border-border/50 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/30 transition-all"
          />
        </div>

        <div className="flex-1 sm:hidden" />

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md bg-terminal-green/5 border border-terminal-green/10">
            <div className="status-dot status-dot-live" />
            <span className="text-[9px] font-mono text-terminal-green/80 tracking-wider">LIVE</span>
          </div>

          <div className="hidden lg:flex items-center gap-1 text-[10px] font-mono text-muted-foreground/60">
            <Clock className="h-3 w-3" />
            <span className="tabular-nums">{time}</span>
          </div>

          <NotificationCenter />

          <Link to="/settings" className="p-1.5 rounded-md hover:bg-muted/50 transition-colors">
            <Settings className="h-4 w-4 text-muted-foreground" />
          </Link>

          <WalletConnectButton />
        </div>
      </div>
    </header>
  );
}
