import { Star, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarketStore } from "@/stores/marketStore";
import type { TradingPair } from "@/types/xrpl";

export function WatchlistSidebar() {
  const { availablePairs, activePair, setActivePair, lastPrice } = useMarketStore();

  return (
    <div className="p-2 space-y-1">
      <div className="px-2 py-1.5 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
        Pairs
      </div>
      {availablePairs.map((pair) => {
        const isActive = pair.label === activePair.label;
        return (
          <button
            key={pair.label}
            onClick={() => setActivePair(pair)}
            className={cn(
              "w-full flex items-center justify-between px-2 py-2 rounded text-xs font-mono transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-foreground hover:bg-muted"
            )}
          >
            <div className="flex items-center gap-2">
              <Star
                className={cn(
                  "h-3 w-3",
                  isActive ? "text-primary fill-primary" : "text-muted-foreground"
                )}
              />
              <span className="font-medium">{pair.label}</span>
            </div>
            {isActive && lastPrice > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {lastPrice.toFixed(4)}
              </span>
            )}
          </button>
        );
      })}

      <div className="px-2 py-3 mt-4">
        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">
          Watchlist
        </div>
        <p className="text-[10px] text-muted-foreground/60 font-mono">
          Connect wallet to save favorites
        </p>
      </div>
    </div>
  );
}
