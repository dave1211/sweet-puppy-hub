import { Wallet, TrendingUp } from "lucide-react";
import { useWalletStore } from "@/stores/walletStore";
import { usePortfolioStore } from "@/stores/portfolioStore";

export function PortfolioPanel() {
  const { isConnected, address, xrpBalance, tokenBalances } = useWalletStore();
  const { totalValueXRP, totalValueUSD } = usePortfolioStore();

  const xrpDisplay = (Number(xrpBalance) / 1_000_000).toFixed(6);

  if (!isConnected) {
    return (
      <div className="terminal-panel p-10 text-center">
        <Wallet className="h-8 w-8 text-muted-foreground/15 mx-auto mb-3" />
        <p className="text-[10px] font-mono text-muted-foreground/40">
          Connect wallet to view portfolio
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Total value */}
      <div className="terminal-panel p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <TrendingUp className="h-3 w-3 text-primary/60" />
          <span className="terminal-panel-title">Portfolio Value</span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-mono font-bold text-foreground tabular-nums">
            {totalValueXRP > 0 ? `${totalValueXRP.toFixed(2)} XRP` : `${xrpDisplay} XRP`}
          </span>
          {totalValueUSD > 0 && (
            <span className="text-sm font-mono text-muted-foreground/50 tabular-nums">
              ≈ ${totalValueUSD.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* XRP Balance */}
      <div className="terminal-panel">
        <div className="terminal-panel-header">
          <span className="terminal-panel-title">XRP</span>
          <span className="text-[11px] font-mono text-foreground font-bold tabular-nums">{xrpDisplay}</span>
        </div>
      </div>

      {/* Tokens */}
      <div className="terminal-panel">
        <div className="terminal-panel-header">
          <span className="terminal-panel-title">Tokens</span>
          <span className="terminal-panel-subtitle">{tokenBalances.length}</span>
        </div>
        {tokenBalances.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <p className="text-[9px] font-mono text-muted-foreground/30">No tokens found</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30 max-h-48 overflow-y-auto">
            {tokenBalances.map((token, i) => (
              <div key={`${token.currency}-${i}`} className="px-3 py-1.5 flex justify-between items-center hover:bg-muted/20 transition-colors">
                <div>
                  <p className="text-[10px] font-mono text-foreground/70">{token.currency}</p>
                  <p className="text-[7px] font-mono text-muted-foreground/30">{token.issuer.slice(0, 8)}…</p>
                </div>
                <span className="text-[10px] font-mono text-foreground/60 tabular-nums">
                  {Number(token.value).toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Address */}
      <div className="text-center py-1">
        <p className="text-[7px] font-mono text-muted-foreground/20 select-all">{address}</p>
      </div>
    </div>
  );
}
