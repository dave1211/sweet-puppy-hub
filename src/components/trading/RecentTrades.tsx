import { useMarketStore } from "@/stores/marketStore";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import { useMemo } from "react";

export function RecentTrades() {
  const trades = useMarketStore((s) => s.recentTrades);

  // Generate mock trades if empty
  const displayTrades = useMemo(() => {
    if (trades.length > 0) return trades;
    return generateMockTrades(20);
  }, [trades]);

  return (
    <div className="terminal-panel flex flex-col h-full">
      <div className="terminal-panel-header">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-muted-foreground/50" />
          <span className="terminal-panel-title">Recent Trades</span>
        </div>
      </div>

      <div className="grid grid-cols-3 px-3 py-1 text-[8px] font-mono text-muted-foreground/40 uppercase tracking-wider">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Time</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {displayTrades.slice(0, 25).map((trade) => (
          <div
            key={trade.id}
            className="grid grid-cols-3 px-3 py-[2px] text-[10px] font-mono hover:bg-muted/20 transition-colors"
          >
            <span
              className={cn(
                "tabular-nums",
                trade.side === "buy" ? "text-primary/80" : "text-destructive/80"
              )}
            >
              {trade.price.toFixed(5)}
            </span>
            <span className="text-right text-foreground/60 tabular-nums">
              {trade.size.toFixed(0)}
            </span>
            <span className="text-right text-muted-foreground/40 tabular-nums">
              {new Date(trade.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function generateMockTrades(count: number) {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    id: `mock-${i}`,
    price: 2.35 + (Math.random() - 0.5) * 0.01,
    size: Math.random() * 10000 + 100,
    side: Math.random() > 0.5 ? "buy" as const : "sell" as const,
    timestamp: now - i * 3000,
    txHash: `MOCK${i}`,
  }));
}
