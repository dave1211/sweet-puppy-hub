import { useTradingStore } from "@/stores/tradingStore";
import { useWalletStore } from "@/stores/walletStore";
import { cn } from "@/lib/utils";
import { X, ListOrdered } from "lucide-react";
import { toast } from "sonner";

export function OpenOrders() {
  const { openOrders, removeOrder } = useTradingStore();
  const { isConnected } = useWalletStore();

  return (
    <div className="terminal-panel">
      <div className="terminal-panel-header">
        <div className="flex items-center gap-1.5">
          <ListOrdered className="h-3 w-3 text-muted-foreground/50" />
          <span className="terminal-panel-title">Open Orders</span>
        </div>
        <span className="terminal-panel-subtitle">{openOrders.length} active</span>
      </div>

      {openOrders.length === 0 ? (
        <div className="px-3 py-6 text-center">
          <p className="text-[9px] font-mono text-muted-foreground/30">
            {isConnected ? "No open orders" : "Connect wallet to view orders"}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/30">
          {openOrders.map((order) => (
            <div key={order.id} className="px-3 py-1.5 flex items-center justify-between text-[10px] font-mono hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-bold text-[9px]",
                  order.side === "buy" ? "text-primary" : "text-destructive"
                )}>
                  {order.side.toUpperCase()}
                </span>
                <span className="text-foreground/70">{order.pair.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground/50 tabular-nums">{order.size} @ {order.price.toFixed(5)}</span>
                <button
                  onClick={() => { removeOrder(order.id); toast.info("Order cancelled"); }}
                  className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground/30 hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
