import { useMarketStore } from "@/stores/marketStore";
import { cn } from "@/lib/utils";
import { BookOpen } from "lucide-react";

export function OrderBook() {
  const { orderBook, lastPrice } = useMarketStore();

  // Generate mock data if empty
  const hasMockData = orderBook.bids.length === 0 && orderBook.asks.length === 0;
  const bids = hasMockData ? generateMockEntries(12, lastPrice || 2.35, "bid") : orderBook.bids;
  const asks = hasMockData ? generateMockEntries(12, lastPrice || 2.35, "ask") : orderBook.asks;
  const displaySpread = hasMockData ? 0.00012 : orderBook.spread;
  const displaySpreadPct = hasMockData ? 0.005 : orderBook.spreadPct;

  const maxTotal = Math.max(
    asks[asks.length - 1]?.total ?? 0,
    bids[bids.length - 1]?.total ?? 0,
    1
  );

  return (
    <div className="terminal-panel flex flex-col h-full">
      <div className="terminal-panel-header">
        <div className="flex items-center gap-1.5">
          <BookOpen className="h-3 w-3 text-muted-foreground/50" />
          <span className="terminal-panel-title">Order Book</span>
        </div>
        <div className="flex items-center gap-1.5 text-[8px] font-mono text-muted-foreground/60">
          <span>SPREAD</span>
          <span className="text-foreground/70 tabular-nums">{displaySpread.toFixed(5)}</span>
          <span className="text-muted-foreground/40">({displaySpreadPct.toFixed(3)}%)</span>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-3 px-3 py-1 text-[8px] font-mono text-muted-foreground/40 uppercase tracking-wider">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      {/* Asks (reversed) */}
      <div className="flex-1 overflow-hidden flex flex-col justify-end">
        {[...asks].slice(0, 12).reverse().map((entry, i) => (
          <div key={`ask-${i}`} className="relative grid grid-cols-3 px-3 py-[2px] text-[10px] font-mono group hover:bg-destructive/5 transition-colors">
            <div
              className="absolute inset-y-0 right-0 depth-bar-ask"
              style={{ width: `${(entry.total / maxTotal) * 100}%` }}
            />
            <span className="relative text-destructive/80 tabular-nums">{entry.price.toFixed(5)}</span>
            <span className="relative text-right text-foreground/60 tabular-nums">{entry.size.toFixed(2)}</span>
            <span className="relative text-right text-muted-foreground/40 tabular-nums">{entry.total.toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Center price */}
      <div className="px-3 py-1.5 border-y border-border/40 flex items-center justify-center gap-2">
        <span className={cn(
          "text-sm font-mono font-bold tabular-nums",
          (lastPrice || 2.35) > 0 ? "text-primary" : "text-muted-foreground"
        )}>
          {(lastPrice || 2.35).toFixed(5)}
        </span>
        <span className="text-[8px] font-mono text-muted-foreground/40">LAST</span>
      </div>

      {/* Bids */}
      <div className="flex-1 overflow-hidden">
        {bids.slice(0, 12).map((entry, i) => (
          <div key={`bid-${i}`} className="relative grid grid-cols-3 px-3 py-[2px] text-[10px] font-mono group hover:bg-primary/5 transition-colors">
            <div
              className="absolute inset-y-0 right-0 depth-bar-bid"
              style={{ width: `${(entry.total / maxTotal) * 100}%` }}
            />
            <span className="relative text-primary/80 tabular-nums">{entry.price.toFixed(5)}</span>
            <span className="relative text-right text-foreground/60 tabular-nums">{entry.size.toFixed(2)}</span>
            <span className="relative text-right text-muted-foreground/40 tabular-nums">{entry.total.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function generateMockEntries(count: number, basePrice: number, side: "bid" | "ask") {
  const entries = [];
  let cumulative = 0;
  for (let i = 0; i < count; i++) {
    const offset = (i + 1) * 0.00008 * (side === "ask" ? 1 : -1);
    const price = basePrice + offset;
    const size = Math.random() * 5000 + 500;
    cumulative += size;
    entries.push({ price, size, total: cumulative, numOrders: Math.ceil(Math.random() * 5) });
  }
  return entries;
}
