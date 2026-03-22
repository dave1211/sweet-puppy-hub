import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { cn } from "@/lib/utils";
import { Users, Wallet, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useTrackedWallets } from "@/hooks/useTrackedWallets";
import { useSmartMoney } from "@/hooks/useSmartMoney";
import { timeAgo } from "@/data/mockData";

export default function CopyTradePage() {
  const { wallets, isLoading: walletsLoading } = useTrackedWallets();
  const { tokens: smartMoneyTokens, isLoading: smLoading } = useSmartMoney();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-mono font-bold text-foreground">COPY TRADE</h1>
        <p className="text-xs font-mono text-muted-foreground">Wallet intelligence & copy trading analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7">
          <PanelShell title="Tracked Wallets" subtitle={`${wallets.length} wallets monitored`}>
            {walletsLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : wallets.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No wallets tracked. Add wallets in the Wallet Tracker to see copy trade intelligence.</p>
                <Link to="/wallet-tracker" className="text-[10px] font-mono text-primary hover:underline mt-2 block">Add wallets →</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {wallets.map((w, i) => (
                  <Link key={w.id} to={`/wallet/${w.address}`} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/50 hover:border-primary/20 transition-colors">
                    <span className="text-lg font-mono font-bold text-muted-foreground w-6 text-center">#{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-mono font-bold text-foreground">{w.label || "Unnamed"}</span>
                        <StatusChip variant="info">TRACKING</StatusChip>
                      </div>
                      <p className="text-[10px] font-mono text-muted-foreground">{w.address.slice(0, 12)}…{w.address.slice(-4)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </PanelShell>
        </div>

        <div className="lg:col-span-5">
          <PanelShell title="Smart Money Activity" subtitle="Cross-wallet token interest">
            {smLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : smartMoneyTokens.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">No smart money activity detected. Track wallets to see which tokens they interact with.</p>
            ) : (
              <div className="space-y-2">
                {smartMoneyTokens.slice(0, 8).map(t => (
                  <Link key={t.tokenAddress} to={`/token/${t.tokenAddress}`} className="flex items-center justify-between py-2 px-2 rounded bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="text-xs font-mono font-medium text-foreground">{t.tokenSymbol || `${t.tokenAddress.slice(0, 6)}…`}</p>
                      <p className="text-[10px] text-muted-foreground">{t.walletCount} wallet(s) · {t.interactionCount} interactions</p>
                    </div>
                    <StatusChip variant={t.label === "ACCUMULATING" ? "success" : t.label === "ACTIVE" ? "info" : "muted"}>{t.label}</StatusChip>
                  </Link>
                ))}
              </div>
            )}
          </PanelShell>
        </div>
      </div>
    </div>
  );
}
