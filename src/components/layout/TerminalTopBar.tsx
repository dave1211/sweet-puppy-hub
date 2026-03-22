import { Activity, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarketStore } from "@/stores/marketStore";
import { useUIStore } from "@/stores/uiStore";
import { XRPLWalletButton } from "@/components/trading/XRPLWalletButton";
import { PairSelector } from "@/components/trading/PairSelector";

export function TerminalTopBar() {
  const { activePair, lastPrice, change24h, high24h, low24h, volume24h, network } =
    useMarketStore();
  const { activeTab, setActiveTab } = useUIStore();

  const isPositive = change24h >= 0;

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm px-3 py-0 relative z-10">
      <div className="flex items-center h-11 gap-3">
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

        {/* Pair selector */}
        <PairSelector />

        {/* Ticker stats */}
        <div className="hidden xl:flex items-center gap-5 text-[10px] font-mono ml-2">
          <TickerStat label="LAST" value={lastPrice > 0 ? lastPrice.toFixed(5) : "—"} className={isPositive ? "text-primary" : "text-destructive"} />
          <TickerStat label="24H" value={change24h !== 0 ? `${isPositive ? "+" : ""}${change24h.toFixed(2)}%` : "—"} className={isPositive ? "text-primary" : "text-destructive"} />
          <TickerStat label="H" value={high24h > 0 ? high24h.toFixed(5) : "—"} />
          <TickerStat label="L" value={low24h > 0 ? low24h.toFixed(5) : "—"} />
          <TickerStat label="VOL" value={volume24h > 0 ? `${(volume24h / 1_000_000).toFixed(2)}M` : "—"} />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Tabs */}
        <div className="hidden sm:flex items-center gap-0.5 bg-muted/50 rounded p-0.5">
          {(["trade", "portfolio", "orders"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3 py-1 text-[9px] font-mono uppercase tracking-wider rounded transition-all duration-150",
                activeTab === tab
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Wallet */}
        <XRPLWalletButton />

        {/* Network status */}
        <div className="hidden sm:flex items-center gap-1.5">
          <div className="relative">
            <Activity
              className={cn(
                "h-3 w-3",
                network.connected ? "text-primary" : "text-destructive"
              )}
            />
            {network.connected && (
              <div className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
            )}
          </div>
          <span className={cn(
            "text-[9px] font-mono tracking-wider",
            network.connected ? "text-primary/80" : "text-destructive/80"
          )}>
            {network.connected ? "LIVE" : "OFF"}
          </span>
        </div>
      </div>
    </header>
  );
}

function TickerStat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-muted-foreground/60">{label}</span>
      <span className={cn("font-medium text-foreground", className)}>{value}</span>
    </div>
  );
}
