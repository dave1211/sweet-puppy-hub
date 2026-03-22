import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { History, CheckCircle, XCircle, Clock } from "lucide-react";
import type { HistoricalOrder } from "@/types/xrpl";

// Mock order history
function generateMockHistory(): HistoricalOrder[] {
  const now = Date.now();
  const pairs = ["XRP/USD", "SOLO/XRP", "CSC/XRP"];
  return Array.from({ length: 15 }, (_, i) => ({
    id: `hist-${i}`,
    sequence: 1000 + i,
    side: Math.random() > 0.5 ? "buy" as const : "sell" as const,
    type: "limit" as const,
    price: 2.35 + (Math.random() - 0.5) * 0.1,
    size: Math.floor(Math.random() * 5000) + 100,
    filled: Math.random() > 0.3 ? Math.floor(Math.random() * 5000) + 100 : Math.floor(Math.random() * 2000),
    pair: {
      base: { currency: pairs[i % 3].split("/")[0] },
      quote: { currency: pairs[i % 3].split("/")[1] },
      label: pairs[i % 3],
    },
    createdAt: now - (i + 1) * 3600_000,
    txHash: `TX${i.toString(36).toUpperCase().padStart(8, "0")}`,
    status: i < 3 ? "open" as const : i < 8 ? "filled" as const : i < 12 ? "partially_filled" as const : "cancelled" as const,
    completedAt: i >= 3 ? now - i * 1800_000 : undefined,
    averageFillPrice: 2.35 + (Math.random() - 0.5) * 0.05,
  }));
}

export function OrderHistory() {
  const orders = useMemo(() => generateMockHistory(), []);

  const statusIcon = (status: string) => {
    switch (status) {
      case "filled": return <CheckCircle className="h-3 w-3 text-primary/60" />;
      case "cancelled": return <XCircle className="h-3 w-3 text-destructive/50" />;
      case "partially_filled": return <Clock className="h-3 w-3 text-terminal-amber/60" />;
      default: return <Clock className="h-3 w-3 text-muted-foreground/40" />;
    }
  };

  return (
    <div className="terminal-panel">
      <div className="terminal-panel-header">
        <div className="flex items-center gap-1.5">
          <History className="h-3 w-3 text-muted-foreground/50" />
          <span className="terminal-panel-title">Order History</span>
        </div>
        <span className="terminal-panel-subtitle">{orders.length} orders</span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-6 px-3 py-1 text-[7px] font-mono text-muted-foreground/40 uppercase tracking-wider border-b border-border/30">
        <span>Pair</span>
        <span>Side</span>
        <span className="text-right">Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Filled</span>
        <span className="text-right">Status</span>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {orders.map((order) => {
          const fillPct = order.size > 0 ? (order.filled / order.size) * 100 : 0;
          return (
            <div key={order.id} className="grid grid-cols-6 px-3 py-1 text-[9px] font-mono items-center hover:bg-muted/10 transition-colors">
              <span className="text-foreground/70">{order.pair.label}</span>
              <span className={cn("font-bold", order.side === "buy" ? "text-primary/70" : "text-destructive/70")}>
                {order.side.toUpperCase()}
              </span>
              <span className="text-right text-foreground/60 tabular-nums">{order.price.toFixed(5)}</span>
              <span className="text-right text-foreground/60 tabular-nums">{order.size}</span>
              <span className="text-right tabular-nums">
                <span className={cn(fillPct >= 100 ? "text-primary/60" : "text-terminal-amber/60")}>
                  {fillPct.toFixed(0)}%
                </span>
              </span>
              <div className="flex items-center justify-end gap-1">
                {statusIcon(order.status)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
