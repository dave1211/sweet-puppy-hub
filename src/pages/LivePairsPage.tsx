import { useState } from "react";
import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { ScoreMeter } from "@/components/shared/ScoreMeter";
import { formatPrice, formatVolume } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Search, Star, ArrowUpDown, Loader2, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useLivePairs, type LivePair } from "@/hooks/useLivePairs";
import { useUnifiedSignals } from "@/hooks/useUnifiedSignals";
import { useWatchlist } from "@/hooks/useWatchlist";

const QUICK_FILTERS = ["All", "Gainers", "Losers", "High Volume", "New", "Low Liq"];

export default function LivePairsPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [sortKey, setSortKey] = useState<string>("volume24h");
  const [sortAsc, setSortAsc] = useState(false);
  const { data: livePairs, isLoading: pairsLoading, refetch } = useLivePairs();
  const { tokens: signalTokens } = useUnifiedSignals();
  const { addItem } = useWatchlist();

  // Merge live pairs with signal scores
  const signalMap = new Map(signalTokens.map(t => [t.address, t]));

  const pairs = (livePairs ?? []).map(p => ({
    ...p,
    score: signalMap.get(p.address)?.score ?? 0,
    label: signalMap.get(p.address)?.label ?? "LOW" as const,
    factors: signalMap.get(p.address)?.factors ?? [],
  }));

  const filtered = pairs
    .filter(t => {
      if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.symbol.toLowerCase().includes(search.toLowerCase())) return false;
      if (activeFilter === "Gainers") return t.change24h > 5;
      if (activeFilter === "Losers") return t.change24h < -5;
      if (activeFilter === "High Volume") return t.volume24h > 100_000;
      if (activeFilter === "New") return (Date.now() - t.pairCreatedAt) < 24 * 60 * 60 * 1000;
      if (activeFilter === "Low Liq") return t.liquidity < 10_000;
      return true;
    })
    .sort((a, b) => {
      const mult = sortAsc ? 1 : -1;
      if (sortKey === "score") return (a.score - b.score) * mult;
      if (sortKey === "volume24h") return (a.volume24h - b.volume24h) * mult;
      if (sortKey === "change24h") return (a.change24h - b.change24h) * mult;
      if (sortKey === "liquidity") return (a.liquidity - b.liquidity) * mult;
      if (sortKey === "marketCap") return (a.marketCap - b.marketCap) * mult;
      return 0;
    });

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortIcon = ({ field }: { field: string }) => (
    <ArrowUpDown className={cn("inline h-3 w-3 ml-0.5", sortKey === field && "text-primary")} />
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-mono font-bold text-foreground">LIVE PAIRS</h1>
          <p className="text-xs font-mono text-muted-foreground">
            {filtered.length} pairs · DexScreener live data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="p-1.5 rounded hover:bg-muted/30 transition-colors" title="Refresh">
            <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground", pairsLoading && "animate-spin")} />
          </button>
          <StatusChip variant="info" dot>REAL-TIME</StatusChip>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search token..." className="w-full bg-muted/50 border border-border rounded pl-8 pr-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {QUICK_FILTERS.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} className={cn("px-2.5 py-1.5 rounded text-[10px] font-mono transition-colors border", activeFilter === f ? "bg-primary/10 text-primary border-primary/30" : "bg-muted/30 text-muted-foreground border-border hover:text-foreground")}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <PanelShell title="Live Pairs" subtitle="Solana · DexScreener" noPad>
        {pairsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="ml-2 text-xs font-mono text-muted-foreground">Fetching live pairs from DexScreener…</span>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground py-8 text-center">No pairs found. Data updates every 20 seconds.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-3 font-medium">TOKEN</th>
                  <th className="text-right p-3 font-medium">PRICE</th>
                  <th className="text-right p-3 font-medium cursor-pointer hover:text-foreground" onClick={() => toggleSort("change24h")}>24H <SortIcon field="change24h" /></th>
                  <th className="text-right p-3 font-medium hidden sm:table-cell">5M</th>
                  <th className="text-right p-3 font-medium cursor-pointer hover:text-foreground hidden md:table-cell" onClick={() => toggleSort("volume24h")}>VOL <SortIcon field="volume24h" /></th>
                  <th className="text-right p-3 font-medium cursor-pointer hover:text-foreground hidden lg:table-cell" onClick={() => toggleSort("liquidity")}>LIQ <SortIcon field="liquidity" /></th>
                  <th className="text-right p-3 font-medium cursor-pointer hover:text-foreground hidden lg:table-cell" onClick={() => toggleSort("marketCap")}>MCAP <SortIcon field="marketCap" /></th>
                  <th className="text-center p-3 font-medium hidden md:table-cell">BUYS/SELLS</th>
                  <th className="text-center p-3 font-medium hidden md:table-cell">DEX</th>
                  <th className="text-center p-3 font-medium w-8"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.address} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <Link to={`/token/${t.address}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                        {t.imageUrl ? (
                          <img src={t.imageUrl} alt="" className="h-6 w-6 rounded-full object-cover shrink-0" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary shrink-0">{t.symbol.slice(0, 2)}</div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">{t.symbol}</p>
                          <p className="text-[9px] text-muted-foreground truncate max-w-[100px]">{t.name}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="p-3 text-right text-foreground tabular-nums">{formatPrice(t.price)}</td>
                    <td className={cn("p-3 text-right tabular-nums", t.change24h >= 0 ? "text-terminal-green" : "text-destructive")}>
                      <span className="flex items-center justify-end gap-0.5">
                        {t.change24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {t.change24h >= 0 ? "+" : ""}{t.change24h.toFixed(1)}%
                      </span>
                    </td>
                    <td className={cn("p-3 text-right hidden sm:table-cell tabular-nums", t.change5m >= 0 ? "text-terminal-green/70" : "text-destructive/70")}>
                      {t.change5m >= 0 ? "+" : ""}{t.change5m.toFixed(1)}%
                    </td>
                    <td className="p-3 text-right hidden md:table-cell text-foreground tabular-nums">{formatVolume(t.volume24h)}</td>
                    <td className="p-3 text-right hidden lg:table-cell text-muted-foreground tabular-nums">{formatVolume(t.liquidity)}</td>
                    <td className="p-3 text-right hidden lg:table-cell text-muted-foreground tabular-nums">{formatVolume(t.marketCap)}</td>
                    <td className="p-3 text-center hidden md:table-cell">
                      <div className="flex items-center justify-center gap-1 text-[9px]">
                        <span className="text-terminal-green">{t.buyCount24h}</span>
                        <span className="text-muted-foreground/30">/</span>
                        <span className="text-destructive">{t.sellCount24h}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center hidden md:table-cell text-muted-foreground">{t.dexId}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => addItem.mutate({ address: t.address, label: t.symbol })} className="text-muted-foreground hover:text-terminal-amber transition-colors"><Star className="h-3.5 w-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PanelShell>
    </div>
  );
}
