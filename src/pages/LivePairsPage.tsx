import { useState } from "react";
import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { ScoreMeter } from "@/components/shared/ScoreMeter";
import { formatPrice, formatVolume } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Search, Star, ArrowUpDown, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useUnifiedSignals, ScoredToken } from "@/hooks/useUnifiedSignals";
import { useWatchlist } from "@/hooks/useWatchlist";

const QUICK_FILTERS = ["All", "High Signal", "Medium", "Low", "Risky"];

export default function LivePairsPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [sortKey, setSortKey] = useState<string>("score");
  const [sortAsc, setSortAsc] = useState(false);
  const { tokens, isLoading } = useUnifiedSignals();
  const { addItem } = useWatchlist();

  const filtered = tokens
    .filter(t => {
      if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.symbol.toLowerCase().includes(search.toLowerCase())) return false;
      if (activeFilter === "High Signal") return t.label === "HIGH SIGNAL";
      if (activeFilter === "Medium") return t.label === "MEDIUM";
      if (activeFilter === "Low") return t.label === "LOW";
      if (activeFilter === "Risky") return t.factors.some(f => f.includes("Low liquidity") || f.includes("Extreme volatility"));
      return true;
    })
    .sort((a, b) => {
      const mult = sortAsc ? 1 : -1;
      if (sortKey === "score") return (a.score - b.score) * mult;
      if (sortKey === "volume") return (a.volume24h - b.volume24h) * mult;
      if (sortKey === "change24h") return (a.change24h - b.change24h) * mult;
      return 0;
    });

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-mono font-bold text-foreground">LIVE PAIRS</h1>
          <p className="text-xs font-mono text-muted-foreground">{filtered.length} active pairs from live feeds</p>
        </div>
        <StatusChip variant="info" dot>REAL-TIME</StatusChip>
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

      <PanelShell title="Pairs Table" noPad>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="ml-2 text-xs font-mono text-muted-foreground">Loading live data…</span>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground py-8 text-center">No tokens found. Data will appear as live feeds load.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-3 font-medium">TOKEN</th>
                  <th className="text-right p-3 font-medium">PRICE</th>
                  <th className="text-right p-3 font-medium cursor-pointer hover:text-foreground" onClick={() => toggleSort("change24h")}>24H <ArrowUpDown className="inline h-3 w-3" /></th>
                  <th className="text-right p-3 font-medium cursor-pointer hover:text-foreground hidden md:table-cell" onClick={() => toggleSort("volume")}>VOLUME <ArrowUpDown className="inline h-3 w-3" /></th>
                  <th className="text-right p-3 font-medium hidden lg:table-cell">LIQUIDITY</th>
                  <th className="text-center p-3 font-medium hidden md:table-cell">DEX</th>
                  <th className="text-center p-3 font-medium cursor-pointer hover:text-foreground" onClick={() => toggleSort("score")}>SIGNAL <ArrowUpDown className="inline h-3 w-3" /></th>
                  <th className="text-center p-3 font-medium">LABEL</th>
                  <th className="text-center p-3 font-medium w-8"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.address} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <Link to={`/token/${t.address}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary shrink-0">{t.symbol.slice(0, 2)}</div>
                        <div>
                          <p className="font-medium text-foreground">{t.symbol}</p>
                          <p className="text-[9px] text-muted-foreground">{t.name}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="p-3 text-right text-foreground">{formatPrice(t.price)}</td>
                    <td className={cn("p-3 text-right", t.change24h >= 0 ? "text-terminal-green" : "text-destructive")}>{t.change24h >= 0 ? "+" : ""}{t.change24h.toFixed(1)}%</td>
                    <td className="p-3 text-right hidden md:table-cell text-foreground">{formatVolume(t.volume24h)}</td>
                    <td className="p-3 text-right hidden lg:table-cell text-muted-foreground">{formatVolume(t.liquidity)}</td>
                    <td className="p-3 text-center hidden md:table-cell text-muted-foreground">{t.dexId}</td>
                    <td className="p-3 text-center"><ScoreMeter value={t.score} size="sm" /></td>
                    <td className="p-3 text-center">
                      <StatusChip variant={t.label === "HIGH SIGNAL" ? "success" : t.label === "MEDIUM" ? "info" : "muted"}>{t.label}</StatusChip>
                    </td>
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
