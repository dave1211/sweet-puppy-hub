import { useTradingStore } from "@/stores/tradingStore";
import { useWalletStore } from "@/stores/walletStore";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { toast } from "sonner";

export function OpenOrders() {
  const { openOrders, removeOrder } = useTradingStore();
  const { isConnected } = useWalletStore();

  const handleCancel = (id: string) => {
    removeOrder(id);
    toast.info("Order cancelled (simulated)");
  };

  return (
    <div className="border border-border rounded bg-card">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-foreground">OPEN ORDERS</span>
        <span className="text-[10px] font-mono text-muted-foreground">
          {openOrders.length} active
        </span>
      </div>

      {openOrders.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-[10px] font-mono text-muted-foreground/50">
            {isConnected ? "No open orders" : "Connect wallet to view orders"}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {openOrders.map((order) => (
            <div key={order.id} className="px-3 py-2 flex items-center justify-between text-[10px] font-mono">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-bold",
                  order.side === "buy" ? "text-primary" : "text-destructive"
                )}>
                  {order.side.toUpperCase()}
                </span>
                <span className="text-foreground">{order.pair.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">{order.size} @ {order.price.toFixed(5)}</span>
                <button
                  onClick={() => handleCancel(order.id)}
                  className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
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
