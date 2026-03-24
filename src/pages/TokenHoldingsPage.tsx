import { Coins, Wallet, ExternalLink, RefreshCw, Loader2, DollarSign } from "lucide-react";
import { PanelShell } from "@/components/shared/PanelShell";
import { useWallet } from "@/contexts/WalletContext";
import { useWalletTokens } from "@/hooks/useWalletTokens";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { useSolPrice } from "@/hooks/useSolPrice";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

export default function TokenHoldingsPage() {
  const { isConnected, walletAddress, balanceSOL, connect } = useWallet();
  const { data: walletData, isLoading, refetch } = useWalletTokens();
  const { data: solPrice } = useSolPrice();

  const tokens = walletData?.tokens ?? [];
  const mintAddresses = useMemo(() => tokens.map((t) => t.mint), [tokens]);
  const { data: tokenPrices } = useTokenPrices(mintAddresses);

  const solUsdValue = balanceSOL && solPrice ? balanceSOL * solPrice.price : null;

  const totalUsdValue = useMemo(() => {
    let total = solUsdValue ?? 0;
    if (tokenPrices) {
      for (const t of tokens) {
        const pd = tokenPrices[t.mint];
        if (pd) total += t.balance * pd.price;
      }
    }
    return total;
  }, [solUsdValue, tokenPrices, tokens]);

  if (!isConnected) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-base sm:text-lg font-mono font-bold text-foreground">TOKEN HOLDINGS</h1>
          <p className="text-[10px] sm:text-xs font-mono text-muted-foreground">View your Solana wallet balances</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-8 text-center space-y-3">
          <Wallet className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-xs font-mono text-muted-foreground">Connect your wallet to view holdings</p>
          <Button onClick={() => connect("phantom")} className="font-mono text-xs">👻 Connect Phantom</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base sm:text-lg font-mono font-bold text-foreground">TOKEN HOLDINGS</h1>
          <p className="text-[10px] sm:text-xs font-mono text-muted-foreground">
            {walletAddress?.slice(0, 6)}…{walletAddress?.slice(-4)}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => refetch()} className="h-8 w-8">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Total portfolio value */}
      {totalUsdValue > 0 && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary shrink-0" />
          <div>
            <p className="text-[9px] font-mono text-muted-foreground">TOTAL VALUE</p>
            <p className="text-lg font-mono font-bold text-primary">${totalUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      )}

      {/* SOL balance card */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">◎</div>
          <div>
            <p className="text-sm font-mono font-bold text-foreground">SOL</p>
            <p className="text-[10px] font-mono text-muted-foreground">Solana</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-mono font-bold text-foreground">{balanceSOL?.toFixed(4) ?? "0.0000"}</p>
          {solUsdValue !== null && (
            <p className="text-[10px] font-mono text-muted-foreground">${solUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          )}
        </div>
      </div>

      {/* Token list */}
      <PanelShell
        title="SPL Tokens"
        subtitle={isLoading ? "Loading…" : `${tokens.length} tokens found`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : tokens.length === 0 ? (
          <div className="py-6 text-center">
            <Coins className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs font-mono text-muted-foreground">No SPL tokens found in wallet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {tokens.map((t) => {
              const pd = tokenPrices?.[t.mint];
              const usdValue = pd ? t.balance * pd.price : null;
              return (
                <div key={t.mint} className="flex items-center justify-between rounded bg-muted/20 border border-border px-3 py-2 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg">{t.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-mono font-medium text-foreground">{t.symbol}</p>
                      <p className="text-[9px] font-mono text-muted-foreground truncate">{t.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-mono text-foreground">
                        {t.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                      </p>
                      {usdValue !== null && usdValue > 0.01 && (
                        <p className="text-[9px] font-mono text-muted-foreground">
                          ${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      )}
                      {pd && (
                        <p className={`text-[8px] font-mono ${pd.change24h >= 0 ? "text-terminal-green" : "text-destructive"}`}>
                          {pd.change24h >= 0 ? "+" : ""}{pd.change24h.toFixed(1)}%
                        </p>
                      )}
                    </div>
                    <a
                      href={`https://solscan.io/token/${t.mint}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PanelShell>
    </div>
  );
}
