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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Tracked</span>
        </div>
        <p className="text-2xl font-mono font-bold tabular-nums">{watchlistCount}</p>
        <p className="text-[10px] font-mono text-muted-foreground mt-1">
          {priceEntries.length > 0 ? `${priceEntries.length} with live data` : "Add tokens to track"}
        </p>
      </div>

      <div className="stat-card">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="h-4 w-4 text-terminal-amber" />
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Alerts</span>
        </div>
        <p className="text-2xl font-mono font-bold tabular-nums">{alertsCount}</p>
        <p className="text-[10px] font-mono text-muted-foreground mt-1">Monitoring</p>
      </div>

      <div className="stat-card">
        <div className="flex items-center gap-2 mb-2">
          {isPositive ? <TrendingUp className="h-4 w-4 text-terminal-green" /> : <TrendingDown className="h-4 w-4 text-terminal-red" />}
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">SOL</span>
        </div>
        <p className="text-2xl font-mono font-bold tabular-nums">{solDisplay}</p>
        {solPrice && (
          <p className={`text-[10px] font-mono mt-1 ${isPositive ? "text-terminal-green" : "text-terminal-red"}`}>
            {isPositive ? "+" : ""}{solChange.toFixed(2)}% 24h
          </p>
        )}
      </div>

      <div className="stat-card">
        <div className="flex items-center gap-2 mb-2">
          {avgChange !== null ? (
            avgChange >= 0 ? <Wifi className="h-4 w-4 text-terminal-green" /> : <WifiOff className="h-4 w-4 text-terminal-red" />
          ) : (
            <Wifi className="h-4 w-4 text-terminal-cyan" />
          )}
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Pulse</span>
        </div>
        <p className="text-2xl font-mono font-bold tabular-nums">
          {avgChange !== null ? `${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(1)}%` : "—"}
        </p>
        <p className="text-[10px] font-mono text-muted-foreground mt-1">
          {avgChange !== null ? "Avg 24h change" : "Track tokens to see"}
        </p>
      </div>
    </div>
  );
}
