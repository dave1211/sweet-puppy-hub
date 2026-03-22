import { usePortfolioStore } from "@/stores/portfolioStore";
import { useWalletStore } from "@/stores/walletStore";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownLeft, Repeat, HelpCircle } from "lucide-react";

const TYPE_ICONS: Record<string, typeof ArrowUpRight> = {
  Payment: ArrowUpRight,
  OfferCreate: Repeat,
  OfferCancel: Repeat,
  TrustSet: HelpCircle,
};

export function TransactionHistory() {
  const { transactions } = usePortfolioStore();
  const { isConnected } = useWalletStore();

  return (
    <div className="border border-border rounded bg-card">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-foreground">RECENT ACTIVITY</span>
        <span className="text-[10px] font-mono text-muted-foreground">
          {transactions.length} txns
        </span>
      </div>

      {!isConnected ? (
        <div className="p-6 text-center">
          <p className="text-[10px] font-mono text-muted-foreground/50">
            Connect wallet to view activity
          </p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-[10px] font-mono text-muted-foreground/50">
            No recent transactions
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/50 max-h-80 overflow-y-auto">
          {transactions.map((tx) => {
            const Icon = TYPE_ICONS[tx.type] ?? HelpCircle;
            const isSuccess = tx.result === "tesSUCCESS";
            return (
              <div key={tx.hash} className="px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-3.5 w-3.5", isSuccess ? "text-primary" : "text-destructive")} />
                  <div>
                    <p className="text-[11px] font-mono text-foreground">{tx.type}</p>
                    <p className="text-[8px] font-mono text-muted-foreground">
                      {tx.hash.slice(0, 12)}…
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("text-[10px] font-mono", isSuccess ? "text-primary" : "text-destructive")}>
                    {isSuccess ? "SUCCESS" : "FAILED"}
                  </p>
                  <p className="text-[8px] font-mono text-muted-foreground">
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
