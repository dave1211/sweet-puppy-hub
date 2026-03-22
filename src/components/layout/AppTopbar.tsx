import { Search, Bell, Settings, Zap, ChevronDown, Clock } from "lucide-react";
import { useState, useEffect } from "react";

export function AppTopbar() {
  const [search, setSearch] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm px-3 py-0 relative z-20 shrink-0">
      <div className="flex items-center h-12 gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Zap className="h-4 w-4 text-primary" />
            <div className="absolute inset-0 blur-sm bg-primary/20 rounded-full" />
          </div>
          <span className="font-mono text-sm font-bold tracking-tight text-foreground hidden sm:inline">
            TANNER<span className="text-primary">TERMINAL</span>
          </span>
        </div>

        <div className="h-5 w-px bg-border/60 hidden md:block" />

        {/* Search */}
        <div className="flex-1 max-w-md relative hidden sm:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search token, wallet, contract..."
            className="w-full bg-muted/50 border border-border rounded pl-8 pr-3 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/30"
          />
        </div>

        {/* Chain selector */}
        <div className="relative hidden md:block">
          <button className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-muted/50 border border-border text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
            <span>All Chains</span>
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        <div className="flex-1 sm:hidden" />

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-terminal-green animate-pulse-glow" />
            <span className="text-[9px] font-mono text-muted-foreground tracking-wider">LIVE</span>
          </div>

          <div className="hidden lg:flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{time}</span>
          </div>

          <button className="relative p-1.5 rounded hover:bg-muted/50 transition-colors">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-destructive flex items-center justify-center">
              <span className="text-[7px] font-mono text-white font-bold">4</span>
            </span>
          </button>

          <button className="p-1.5 rounded hover:bg-muted/50 transition-colors">
            <Settings className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
}
