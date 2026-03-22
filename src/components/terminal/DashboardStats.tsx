import { Eye, Bell, TrendingUp, TrendingDown, Wifi, WifiOff } from "lucide-react";
import { useSolPrice } from "@/hooks/useSolPrice";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { useWatchlist } from "@/hooks/useWatchlist";

interface DashboardStatsProps { watchlistCount: number; alertsCount: number; }

export function DashboardStats({ watchlistCount, alertsCount }: DashboardStatsProps) {
  const { data: solPrice, isError: solError } = useSolPrice();
  const { items } = useWatchlist();
  const addresses = items.map((i) => i.address);
  const { data: prices } = useTokenPrices(addresses);
  const priceEntries = prices ? Object.values(prices) : [];
  const avgChange = priceEntries.length > 0 ? priceEntries.reduce((sum, p) => sum + p.change24h, 0) / priceEntries.length : null;
  const solDisplay = solPrice ? `$${solPrice.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : solError ? "Unavailable" : "Loading…";
  const solChange = solPrice?.change24h ?? 0;
  const isPositive = solChange >= 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-center gap-2 mb-1"><Eye className="h-3.5 w-3.5 text-primary" /><span className="text-[10px] font-mono text-muted-foreground uppercase">Tracked Tokens</span></div>
        <p className="text-lg font-mono font-bold">{watchlistCount}</p>
        <p className="text-[10px] font-mono text-muted-foreground">{priceEntries.length > 0 ? `${priceEntries.length} with data` : "add tokens to track"}</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-center gap-2 mb-1"><Bell className="h-3.5 w-3.5 text-terminal-amber" /><span className="text-[10px] font-mono text-muted-foreground uppercase">Active Alerts</span></div>
        <p className="text-lg font-mono font-bold">{alertsCount}</p>
        <p className="text-[10px] font-mono text-muted-foreground">monitoring</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-center gap-2 mb-1">{isPositive ? <TrendingUp className="h-3.5 w-3.5 text-terminal-green" /> : <TrendingDown className="h-3.5 w-3.5 text-terminal-red" />}<span className="text-[10px] font-mono text-muted-foreground uppercase">SOL Price</span></div>
        <p className="text-lg font-mono font-bold">{solDisplay}</p>
        {solPrice && <p className={`text-[10px] font-mono ${isPositive ? "text-terminal-green" : "text-terminal-red"}`}>{isPositive ? "+" : ""}{solChange.toFixed(2)}%</p>}
      </div>
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-center gap-2 mb-1">{avgChange !== null ? (avgChange >= 0 ? <Wifi className="h-3.5 w-3.5 text-terminal-green" /> : <WifiOff className="h-3.5 w-3.5 text-terminal-red" />) : <Wifi className="h-3.5 w-3.5 text-terminal-cyan" />}<span className="text-[10px] font-mono text-muted-foreground uppercase">Portfolio Pulse</span></div>
        <p className="text-lg font-mono font-bold">{avgChange !== null ? `${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(1)}%` : "—"}</p>
        <p className="text-[10px] font-mono text-muted-foreground">{avgChange !== null ? "avg 24h change" : "track tokens to see"}</p>
      </div>
    </div>
  );
}