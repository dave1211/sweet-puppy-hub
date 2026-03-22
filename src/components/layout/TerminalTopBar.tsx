import { Activity, Zap, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarketStore } from "@/stores/marketStore";
import { useWalletStore } from "@/stores/walletStore";
import { useUIStore } from "@/stores/uiStore";
import { XRPLWalletButton } from "@/components/trading/XRPLWalletButton";
import { PairSelector } from "@/components/trading/PairSelector";

export function TerminalTopBar() {
  const { activePair, lastPrice, change24h, high24h, low24h, volume24h, network } =
    useMarketStore();
  const { activeTab, setActiveTab } = useUIStore();

  const isPositive = change24h >= 0;

  return (
    <header className="border-b border-border bg-card px-4 py-2">
      <div className="flex items-center justify-between gap-4">
        {/* Left: logo + pair */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-mono text-base font-bold tracking-tight text-foreground">
              TANNER<span className="text-primary">TERMINAL</span>
            </span>
          </div>

          <div className="hidden md:block h-6 w-px bg-border" />

          <PairSelector />
        </div>

        {/* Center: ticker stats */}
        <div className="hidden lg:flex items-center gap-6 text-xs font-mono">
          <div>
            <span className="text-muted-foreground mr-1">LAST</span>
            <span className={cn("font-bold", isPositive ? "text-primary" : "text-destructive")}>
              {lastPrice > 0 ? lastPrice.toFixed(5) : "—"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground mr-1">24H</span>
            <span className={cn(isPositive ? "text-primary" : "text-destructive")}>
              {change24h !== 0 ? `${isPositive ? "+" : ""}${change24h.toFixed(2)}%` : "—"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground mr-1">HIGH</span>
            <span className="text-foreground">{high24h > 0 ? high24h.toFixed(5) : "—"}</span>
          </div>
          <div>
            <span className="text-muted-foreground mr-1">LOW</span>
            <span className="text-foreground">{low24h > 0 ? low24h.toFixed(5) : "—"}</span>
          </div>
          <div>
            <span className="text-muted-foreground mr-1">VOL</span>
            <span className="text-foreground">
              {volume24h > 0 ? `${(volume24h / 1_000_000).toFixed(2)}M` : "—"}
            </span>
          </div>
        </div>

        {/* Right: tabs + wallet + status */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center border border-border rounded overflow-hidden">
            {(["trade", "portfolio", "orders"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3 py-1.5 text-[10px] font-mono uppercase transition-colors",
                  activeTab === tab
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <XRPLWalletButton />

          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
            <Activity
              className={cn(
                "h-3 w-3",
                network.connected ? "text-primary animate-pulse" : "text-destructive"
              )}
            />
            <span>{network.connected ? "LIVE" : "OFF"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
