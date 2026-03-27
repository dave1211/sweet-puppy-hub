import { PanelShell } from "@/components/shared/PanelShell";
import { DashboardStatCard } from "@/components/shared/DashboardStatCard";
import { MiniChart } from "@/components/shared/MiniChart";
import { cn } from "@/lib/utils";
import { PieChart, TrendingUp, DollarSign, BarChart3, Wallet, RefreshCw, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useSolPrice } from "@/hooks/useSolPrice";
import { formatPrice } from "@/data/mockData";
import { useWallet } from "@/contexts/WalletContext";
import { useWalletPortfolio } from "@/hooks/useWalletPortfolio";
import { timeAgo } from "@/data/mockData";

export default function PortfolioPageNew() {
  const { isConnected, walletAddress, balanceSOL } = useWallet();
  const { data: solPrice } = useSolPrice();
  const { tokens, solBalance, isLoading, refresh, portfolio } = useWalletPortfolio();

  const effectiveSOL = isConnected ? (solBalance || balanceSOL || 0) : 0;
  const solValueUSD = solPrice ? effectiveSOL * solPrice.price : 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base sm:text-lg font-mono font-bold text-foreground">PORTFOLIO</h1>
          <p className="text-[10px] sm:text-xs font-mono text-muted-foreground">
            {isConnected ? "On-chain wallet holdings" : "Connect wallet to view holdings"}
          </p>
        </div>
        {isConnected && (
          <button onClick={refresh} disabled={isLoading} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-border text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
            <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
            Refresh
          </button>
        )}
      </div>

      {!isConnected ? (
        <div className="text-center py-12 sm:py-16">
          <Wallet className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm font-mono text-muted-foreground">Connect your wallet to view portfolio</p>
          <p className="text-xs text-muted-foreground mt-1">Your on-chain balances and token holdings will appear here.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            <DashboardStatCard icon={DollarSign} label="SOL Balance" value={`${effectiveSOL.toFixed(4)} SOL`} change={solValueUSD > 0 ? `≈ $${solValueUSD.toFixed(2)}` : ""} changeType="neutral" />
            <DashboardStatCard icon={TrendingUp} label="SOL Price" value={solPrice ? `$${solPrice.price.toFixed(2)}` : "—"} change={solPrice ? `${solPrice.change24h >= 0 ? "+" : ""}${solPrice.change24h.toFixed(1)}%` : ""} changeType={solPrice && solPrice.change24h >= 0 ? "positive" : "negative"} />
            <DashboardStatCard icon={BarChart3} label="Tokens" value={String(tokens.length)} change="in wallet" changeType="neutral" />
            <DashboardStatCard icon={PieChart} label="Last Updated" value={portfolio?.lastUpdated ? timeAgo(portfolio.lastUpdated) : "—"} change="on-chain data" changeType="neutral" />
          </div>

          {solPrice && (
            <PanelShell title="SOL Performance" subtitle="24h price trend">
              <MiniChart baseValue={solPrice.price} change={solPrice.change24h} height={120} label="SOL / USD" />
            </PanelShell>
          )}

          {isLoading && tokens.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="ml-2 text-xs font-mono text-muted-foreground">Loading on-chain balances…</span>
            </div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs font-mono text-muted-foreground">No SPL tokens found in this wallet</p>
              <p className="text-[10px] text-muted-foreground mt-1">Only tokens with non-zero balance are shown</p>
            </div>
          ) : (
            <PanelShell title="Token Holdings" subtitle={`${tokens.length} tokens`} noPad>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left p-3">TOKEN</th>
                      <th className="text-right p-3">BALANCE</th>
                      <th className="text-left p-3 hidden lg:table-cell">MINT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tokens.map(token => (
                      <tr key={token.mint} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="p-3">
                          <Link to={`/token/${token.mint}`} className="flex items-center gap-2 hover:text-primary">
                            <span className="text-base shrink-0">{token.icon}</span>
                            <div>
                              <p className="font-medium text-foreground">{token.symbol}</p>
                              <p className="text-[9px] text-muted-foreground">{token.name}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="p-3 text-right text-foreground tabular-nums font-medium">{token.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                        <td className="p-3 text-left hidden lg:table-cell text-muted-foreground">{token.mint.slice(0, 12)}…</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="sm:hidden divide-y divide-border/50">
                {tokens.map(token => (
                  <Link key={token.mint} to={`/token/${token.mint}`} className="flex items-center gap-3 p-3 hover:bg-muted/20 transition-colors">
                    <span className="text-xl shrink-0">{token.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono font-medium text-foreground">{token.symbol}</p>
                      <p className="text-[9px] font-mono text-muted-foreground truncate">{token.name}</p>
                    </div>
                    <span className="text-xs font-mono text-foreground tabular-nums shrink-0">
                      {token.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </span>
                  </Link>
                ))}
              </div>
            </PanelShell>
          )}

          {/* Wallet address */}
          <div className="text-center py-1">
            <p className="text-[8px] font-mono text-muted-foreground/40 select-all">{walletAddress}</p>
          </div>
        </>
      )}
    </div>
  );
}
