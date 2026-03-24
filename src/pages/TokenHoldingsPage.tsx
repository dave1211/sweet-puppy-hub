import { Coins, Wallet, ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import { PanelShell } from "@/components/shared/PanelShell";
import { useWallet } from "@/contexts/WalletContext";
import { useWalletTokens } from "@/hooks/useWalletTokens";
import { Button } from "@/components/ui/button";

export default function TokenHoldingsPage() {
  const { isConnected, walletAddress, balanceSOL, connect } = useWallet();
  const { data: walletData, isLoading, refetch } = useWalletTokens();

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

  const tokens = walletData?.tokens ?? [];

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

      {/* SOL balance card */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">◎</div>
          <div>
            <p className="text-sm font-mono font-bold text-foreground">SOL</p>
            <p className="text-[10px] font-mono text-muted-foreground">Solana</p>
          </div>
        </div>
        <p className="text-lg font-mono font-bold text-foreground">{balanceSOL?.toFixed(4) ?? "0.0000"}</p>
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
            {tokens.map((t) => (
              <div key={t.mint} className="flex items-center justify-between rounded bg-muted/20 border border-border px-3 py-2 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg">{t.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-mono font-medium text-foreground">{t.symbol}</p>
                    <p className="text-[9px] font-mono text-muted-foreground truncate">{t.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xs font-mono text-foreground text-right">
                    {t.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  </p>
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
            ))}
          </div>
        )}
      </PanelShell>
    </div>
  );
}
