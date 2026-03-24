import { Coins, Wallet, ExternalLink, ArrowRight } from "lucide-react";
import { PanelShell } from "@/components/shared/PanelShell";
import { useWallet } from "@/contexts/WalletContext";
import { useWalletTokens } from "@/hooks/useWalletTokens";
import { Button } from "@/components/ui/button";

export default function ClaimSolPage() {
  const { isConnected, walletAddress, balanceSOL, connect } = useWallet();
  const { data: walletData } = useWalletTokens();

  const dustAccounts = walletData?.tokens?.filter((t) => t.balance > 0 && t.balance < 1) ?? [];
  const reclaimableSOL = dustAccounts.length * 0.00203928;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-base sm:text-lg font-mono font-bold text-foreground">CLAIM YOUR SOL</h1>
        <p className="text-[10px] sm:text-xs font-mono text-muted-foreground">
          Reclaim SOL locked in empty token accounts & dust positions
        </p>
      </div>

      {!isConnected ? (
        <PanelShell title="Connect Wallet" subtitle="Required to scan accounts">
          <div className="py-8 text-center space-y-3">
            <Wallet className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-xs font-mono text-muted-foreground">Connect your Phantom wallet to scan for reclaimable SOL</p>
            <Button
              onClick={() => connect("phantom")}
              className="font-mono text-xs"
            >
              👻 Connect Phantom
            </Button>
          </div>
        </PanelShell>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-[9px] font-mono text-muted-foreground mb-1">WALLET</p>
              <p className="text-xs font-mono text-foreground truncate">{walletAddress?.slice(0, 8)}…{walletAddress?.slice(-4)}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-[9px] font-mono text-muted-foreground mb-1">SOL BALANCE</p>
              <p className="text-sm font-mono font-bold text-foreground">{balanceSOL?.toFixed(4) ?? "—"}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-[9px] font-mono text-muted-foreground mb-1">DUST ACCOUNTS</p>
              <p className="text-sm font-mono font-bold text-terminal-amber">{dustAccounts.length}</p>
            </div>
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="text-[9px] font-mono text-primary mb-1">RECLAIMABLE SOL</p>
              <p className="text-sm font-mono font-bold text-primary">{reclaimableSOL.toFixed(4)} SOL</p>
            </div>
          </div>

          {/* How it works */}
          <PanelShell title="How It Works" subtitle="3 easy steps">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-2">
              <div className="flex items-start gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-mono font-bold text-primary shrink-0">1</div>
                <div>
                  <p className="text-[10px] font-mono font-medium text-foreground">Scan Wallet</p>
                  <p className="text-[9px] text-muted-foreground">We detect empty & dust SPL token accounts</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-mono font-bold text-primary shrink-0">2</div>
                <div>
                  <p className="text-[10px] font-mono font-medium text-foreground">Burn & Close</p>
                  <p className="text-[9px] text-muted-foreground">Burn dust tokens and close accounts in one tx</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-mono font-bold text-primary shrink-0">3</div>
                <div>
                  <p className="text-[10px] font-mono font-medium text-foreground">Reclaim SOL</p>
                  <p className="text-[9px] text-muted-foreground">~0.002 SOL rent returned per closed account</p>
                </div>
              </div>
            </div>
          </PanelShell>

          {/* Dust accounts list */}
          <PanelShell title="Reclaimable Accounts" subtitle={`${dustAccounts.length} found`}>
            {dustAccounts.length === 0 ? (
              <div className="py-6 text-center">
                <Coins className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-xs font-mono text-muted-foreground">No dust accounts found — your wallet is clean!</p>
              </div>
            ) : (
              <div className="space-y-1">
                {dustAccounts.map((t) => (
                  <div key={t.mint} className="flex items-center justify-between rounded bg-muted/20 border border-border px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm">{t.icon}</span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono text-foreground">{t.symbol}</p>
                        <p className="text-[9px] font-mono text-muted-foreground truncate">{t.mint.slice(0, 12)}…</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-mono text-muted-foreground">{t.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
                      <p className="text-[9px] font-mono text-primary">+0.002 SOL</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PanelShell>

          {/* CTA to Burn Incinerator */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs font-mono font-bold text-foreground">Ready to reclaim?</p>
                  <p className="text-[10px] font-mono text-muted-foreground">Use the SOL Burn page to close accounts and reclaim rent</p>
                </div>
              </div>
              <a href="/sol-burn" className="flex items-center gap-1 text-[10px] font-mono text-primary hover:underline">
                GO TO BURN <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
