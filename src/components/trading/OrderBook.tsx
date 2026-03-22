import { useMarketStore } from "@/stores/marketStore";
import { cn } from "@/lib/utils";

export function OrderBook() {
  const { orderBook, lastPrice } = useMarketStore();
  const maxTotal =
    Math.max(
      orderBook.asks[orderBook.asks.length - 1]?.total ?? 0,
      orderBook.bids[orderBook.bids.length - 1]?.total ?? 0,
      1
    );

  return (
    <div className="border border-border rounded bg-card flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-foreground">ORDER BOOK</span>
        <span className="text-[10px] font-mono text-muted-foreground">
          SPREAD {orderBook.spread.toFixed(5)} ({orderBook.spreadPct.toFixed(2)}%)
        </span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-3 px-3 py-1 text-[9px] font-mono text-muted-foreground uppercase border-b border-border/50">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      {/* Asks (reversed so lowest is at bottom) */}
      <div className="flex-1 overflow-hidden flex flex-col justify-end">
        {[...orderBook.asks].slice(0, 12).reverse().map((entry, i) => (
          <div key={`ask-${i}`} className="relative grid grid-cols-3 px-3 py-0.5 text-[10px] font-mono">
            <div
              className="absolute inset-0 bg-destructive/8"
              style={{ width: `${(entry.total / maxTotal) * 100}%`, right: 0, left: "auto" }}
            />
            <span className="relative text-destructive">{entry.price.toFixed(5)}</span>
            <span className="relative text-right text-foreground">{entry.size.toFixed(2)}</span>
            <span className="relative text-right text-muted-foreground">{entry.total.toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Spread / last price */}
      <div className="px-3 py-1.5 border-y border-border/50 text-center">
        <span className={cn(
          "text-sm font-mono font-bold",
          lastPrice > 0 ? "text-primary" : "text-muted-foreground"
        )}>
          {lastPrice > 0 ? lastPrice.toFixed(5) : "—"}
        </span>
      </div>

      {/* Bids */}
      <div className="flex-1 overflow-hidden">
        {orderBook.bids.slice(0, 12).map((entry, i) => (
          <div key={`bid-${i}`} className="relative grid grid-cols-3 px-3 py-0.5 text-[10px] font-mono">
            <div
              className="absolute inset-0 bg-primary/8"
              style={{ width: `${(entry.total / maxTotal) * 100}%`, right: 0, left: "auto" }}
            />
            <span className="relative text-primary">{entry.price.toFixed(5)}</span>
            <span className="relative text-right text-foreground">{entry.size.toFixed(2)}</span>
            <span className="relative text-right text-muted-foreground">{entry.total.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
