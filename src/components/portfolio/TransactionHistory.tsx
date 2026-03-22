import { usePortfolioStore } from "@/stores/portfolioStore";
import { useWalletStore } from "@/stores/walletStore";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Repeat, HelpCircle, History } from "lucide-react";

const TYPE_ICONS: Record<string, typeof ArrowUpRight> = {
  Payment: ArrowUpRight,
  OfferCreate: Repeat,
  OfferCancel: Repeat,
};

export function TransactionHistory() {
  const { transactions } = usePortfolioStore();
  const { isConnected } = useWalletStore();

  return (
    <div className="terminal-panel">
      <div className="terminal-panel-header">
        <div className="flex items-center gap-1.5">
          <History className="h-3 w-3 text-muted-foreground/50" />
          <span className="terminal-panel-title">Activity</span>
        </div>
        <span className="terminal-panel-subtitle">{transactions.length} txns</span>
      </div>

      {!isConnected || transactions.length === 0 ? (
        <div className="px-3 py-6 text-center">
          <p className="text-[9px] font-mono text-muted-foreground/30">
            {isConnected ? "No recent transactions" : "Connect wallet to view activity"}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/30 max-h-60 overflow-y-auto">
          {transactions.map((tx) => {
            const Icon = TYPE_ICONS[tx.type] ?? HelpCircle;
            const isSuccess = tx.result === "tesSUCCESS";
            return (
              <div key={tx.hash} className="px-3 py-1.5 flex items-center justify-between hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-3 w-3", isSuccess ? "text-primary/60" : "text-destructive/60")} />
                  <div>
                    <p className="text-[10px] font-mono text-foreground/70">{tx.type}</p>
                    <p className="text-[7px] font-mono text-muted-foreground/30">{tx.hash.slice(0, 12)}…</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("text-[8px] font-mono", isSuccess ? "text-primary/60" : "text-destructive/60")}>
                    {isSuccess ? "OK" : "FAIL"}
                  </p>
                  <p className="text-[7px] font-mono text-muted-foreground/30 tabular-nums">
                    {new Date(tx.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
