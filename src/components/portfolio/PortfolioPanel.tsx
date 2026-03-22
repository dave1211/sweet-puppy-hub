import { Wallet, TrendingUp, ArrowUpDown } from "lucide-react";
import { useWalletStore } from "@/stores/walletStore";
import { usePortfolioStore } from "@/stores/portfolioStore";
import { cn } from "@/lib/utils";

export function PortfolioPanel() {
  const { isConnected, address, xrpBalance, tokenBalances } = useWalletStore();
  const { totalValueXRP, totalValueUSD, assets, isLoading } = usePortfolioStore();

  const xrpDisplay = (Number(xrpBalance) / 1_000_000).toFixed(6);

  if (!isConnected) {
    return (
      <div className="border border-border rounded bg-card p-8 text-center">
        <Wallet className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-xs font-mono text-muted-foreground">
          Connect wallet to view portfolio
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Total value */}
      <div className="border border-border rounded bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-xs font-mono font-bold text-foreground">PORTFOLIO VALUE</span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-mono font-bold text-foreground">
            {totalValueXRP > 0 ? `${totalValueXRP.toFixed(2)} XRP` : `${xrpDisplay} XRP`}
          </span>
          {totalValueUSD > 0 && (
            <span className="text-sm font-mono text-muted-foreground">
              ≈ ${totalValueUSD.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* XRP Balance */}
      <div className="border border-border rounded bg-card">
        <div className="px-3 py-2 border-b border-border">
          <span className="text-xs font-mono font-bold text-foreground">XRP HOLDINGS</span>
        </div>
        <div className="px-3 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-[8px] font-mono font-bold text-primary">XRP</span>
              </div>
              <span className="text-xs font-mono text-foreground">XRP</span>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono text-foreground font-bold">{xrpDisplay}</p>
              <p className="text-[10px] font-mono text-muted-foreground">Available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Token Holdings */}
      <div className="border border-border rounded bg-card">
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-foreground">TOKEN HOLDINGS</span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {tokenBalances.length} tokens
          </span>
        </div>
        {tokenBalances.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-[10px] font-mono text-muted-foreground/50">No tokens found</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50 max-h-60 overflow-y-auto">
            {tokenBalances.map((token, i) => (
              <div key={`${token.currency}-${token.issuer}-${i}`} className="px-3 py-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-[7px] font-mono font-bold text-foreground">
                      {token.currency.slice(0, 3)}
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] font-mono text-foreground">{token.currency}</p>
                    <p className="text-[8px] font-mono text-muted-foreground">
                      {token.issuer.slice(0, 8)}…
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-foreground">
                  {Number(token.value).toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Wallet address */}
      <div className="text-center">
        <p className="text-[9px] font-mono text-muted-foreground/50">
          {address}
        </p>
      </div>
    </div>
  );
}
