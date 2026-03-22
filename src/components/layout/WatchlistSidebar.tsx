import { Star, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarketStore } from "@/stores/marketStore";

export function WatchlistSidebar() {
  const { availablePairs, activePair, setActivePair, lastPrice } = useMarketStore();

  // Generate mock price changes for visual interest
  const mockChanges: Record<string, number> = {
    "XRP/USD": 2.41,
    "XRP/EUR": -0.87,
    "XRP/BTC": 1.15,
    "CSC/XRP": -2.33,
    "SOLO/XRP": 4.72,
  };

  return (
    <div className="py-1">
      {availablePairs.map((pair) => {
        const isActive = pair.label === activePair.label;
        const change = mockChanges[pair.label] ?? 0;
        const isUp = change >= 0;

        return (
          <button
            key={pair.label}
            onClick={() => setActivePair(pair)}
            className={cn(
              "w-full flex items-center justify-between px-2.5 py-2 text-[11px] font-mono transition-all duration-100 group",
              isActive
                ? "bg-primary/8 border-l-2 border-l-primary"
                : "border-l-2 border-l-transparent hover:bg-muted/30"
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Star
                className={cn(
                  "h-2.5 w-2.5 shrink-0 transition-colors",
                  isActive ? "text-primary fill-primary/50" : "text-muted-foreground/30 group-hover:text-muted-foreground/60"
                )}
              />
              <span className={cn(
                "font-medium truncate",
                isActive ? "text-primary" : "text-foreground"
              )}>
                {pair.label}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className={cn(
                "text-[9px] tabular-nums",
                isUp ? "text-primary/70" : "text-destructive/70"
              )}>
                {isUp ? "+" : ""}{change.toFixed(2)}%
              </span>
              {isUp ? (
                <TrendingUp className="h-2.5 w-2.5 text-primary/50" />
              ) : (
                <TrendingDown className="h-2.5 w-2.5 text-destructive/50" />
              )}
            </div>
          </button>
        );
      })}

      <div className="px-3 pt-4 pb-2">
        <div className="h-px bg-border/40 mb-3" />
        <div className="text-[8px] font-mono text-muted-foreground/40 uppercase tracking-[0.12em]">
          Watchlist
        </div>
        <p className="text-[9px] text-muted-foreground/30 font-mono mt-1.5 leading-relaxed">
          Connect wallet to save favorites
        </p>
      </div>
    </div>
  );
}
