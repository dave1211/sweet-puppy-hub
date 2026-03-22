import { useMarketStore } from "@/stores/marketStore";
import { cn } from "@/lib/utils";

export function RecentTrades() {
  const trades = useMarketStore((s) => s.recentTrades);

  return (
    <div className="border border-border rounded bg-card flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border">
        <span className="text-xs font-mono font-bold text-foreground">RECENT TRADES</span>
      </div>

      <div className="grid grid-cols-3 px-3 py-1 text-[9px] font-mono text-muted-foreground uppercase border-b border-border/50">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Time</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {trades.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[10px] font-mono text-muted-foreground/50">
              Waiting for trades…
            </p>
          </div>
        ) : (
          trades.slice(0, 30).map((trade) => (
            <div
              key={trade.id}
              className="grid grid-cols-3 px-3 py-0.5 text-[10px] font-mono"
            >
              <span
                className={cn(
                  trade.side === "buy" ? "text-primary" : "text-destructive"
                )}
              >
                {trade.price.toFixed(5)}
              </span>
              <span className="text-right text-foreground">
                {trade.size.toFixed(2)}
              </span>
              <span className="text-right text-muted-foreground">
                {new Date(trade.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
