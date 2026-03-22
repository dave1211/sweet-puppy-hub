import { PanelShell } from "@/components/shared/PanelShell";
import { DashboardStatCard } from "@/components/shared/DashboardStatCard";
import { StatusChip } from "@/components/shared/StatusChip";
import { cn } from "@/lib/utils";
import { PieChart, TrendingUp, DollarSign, BarChart3, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { useSolPrice } from "@/hooks/useSolPrice";
import { formatPrice } from "@/data/mockData";

export default function PortfolioPageNew() {
  const { items } = useWatchlist();
  const addresses = items.map(i => i.address);
  const { data: prices } = useTokenPrices(addresses);
  const { data: solPrice } = useSolPrice();
  const priceEntries = prices ? Object.entries(prices) : [];
  const avgChange = priceEntries.length > 0 ? priceEntries.reduce((sum, [, p]) => sum + p.change24h, 0) / priceEntries.length : null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-mono font-bold text-foreground">PORTFOLIO</h1>
        <p className="text-xs font-mono text-muted-foreground">Holdings & performance analytics</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <DashboardStatCard icon={DollarSign} label="SOL Price" value={solPrice ? `$${solPrice.price.toFixed(2)}` : "—"} change={solPrice ? `${solPrice.change24h >= 0 ? "+" : ""}${solPrice.change24h.toFixed(1)}%` : ""} changeType={solPrice && solPrice.change24h >= 0 ? "positive" : "negative"} />
        <DashboardStatCard icon={TrendingUp} label="Watchlist Pulse" value={avgChange !== null ? `${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(1)}%` : "—"} change="avg 24h change" changeType={avgChange !== null && avgChange >= 0 ? "positive" : "negative"} />
        <DashboardStatCard icon={BarChart3} label="Tracked Tokens" value={String(items.length)} change="in watchlist" changeType="neutral" />
        <DashboardStatCard icon={PieChart} label="With Price Data" value={String(priceEntries.length)} change="live prices" changeType="neutral" />
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Wallet className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-mono text-muted-foreground">No tokens in your portfolio</p>
          <p className="text-xs text-muted-foreground mt-1">Add tokens to your watchlist to see portfolio analytics here.</p>
          <Link to="/watchlist" className="text-xs font-mono text-primary hover:underline mt-3 inline-block">Go to Watchlist →</Link>
        </div>
      ) : (
        <PanelShell title="Tracked Positions" subtitle={`${items.length} tokens`} noPad>
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-3">TOKEN</th>
                <th className="text-right p-3">PRICE</th>
                <th className="text-right p-3">24H CHANGE</th>
                <th className="text-left p-3 hidden md:table-cell">ADDRESS</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const pd = prices?.[item.address];
                return (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <Link to={`/token/${item.address}`} className="flex items-center gap-2 hover:text-primary">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">{(item.label ?? "?").slice(0, 2)}</div>
                        <span className="font-medium text-foreground">{item.label || "Unknown"}</span>
                      </Link>
                    </td>
                    <td className="p-3 text-right text-foreground">{pd ? formatPrice(pd.price) : "—"}</td>
                    <td className={cn("p-3 text-right", pd ? (pd.change24h >= 0 ? "text-terminal-green" : "text-destructive") : "text-muted-foreground")}>
                      {pd ? `${pd.change24h >= 0 ? "+" : ""}${pd.change24h.toFixed(1)}%` : "—"}
                    </td>
                    <td className="p-3 text-left hidden md:table-cell text-muted-foreground">{item.address.slice(0, 12)}…</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </PanelShell>
      )}
    </div>
  );
}
