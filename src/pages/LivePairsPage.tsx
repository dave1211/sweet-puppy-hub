import { useState } from "react";
import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { ScoreMeter } from "@/components/shared/ScoreMeter";
import { mockTokens, formatPrice, formatVolume, formatNumber } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Search, Star, Filter, ArrowUpDown } from "lucide-react";
import { Link } from "react-router-dom";

const QUICK_FILTERS = ["All", "New", "Hot", "Whale Activity", "Low Cap", "Safe", "Risky", "Breakout", "Rug Risk"];

export default function LivePairsPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [sortKey, setSortKey] = useState<string>("volume");
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = mockTokens
    .filter(t => {
      if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.symbol.toLowerCase().includes(search.toLowerCase())) return false;
      if (activeFilter === "New") return t.status === "new";
      if (activeFilter === "Hot") return t.status === "hot";
      if (activeFilter === "Safe") return t.riskScore < 25;
      if (activeFilter === "Risky") return t.riskScore > 50;
      if (activeFilter === "Rug Risk") return t.status === "rug_risk";
      if (activeFilter === "Low Cap") return t.mcap < 10_000_000;
      return true;
    })
    .sort((a, b) => {
      const mult = sortAsc ? 1 : -1;
      if (sortKey === "volume") return (a.volume - b.volume) * mult;
      if (sortKey === "change24h") return (a.change24h - b.change24h) * mult;
      if (sortKey === "mcap") return (a.mcap - b.mcap) * mult;
      if (sortKey === "riskScore") return (a.riskScore - b.riskScore) * mult;
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
          <p className="text-xs font-mono text-muted-foreground">{filtered.length} active pairs across all chains</p>
        </div>
        <StatusChip variant="info" dot>REAL-TIME</StatusChip>
      </div>

      {/* Search + filters */}
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

      {/* Table */}
      <PanelShell title="Pairs Table" noPad>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-3 font-medium">TOKEN</th>
                <th className="text-left p-3 font-medium">CHAIN</th>
                <th className="text-right p-3 font-medium cursor-pointer hover:text-foreground" onClick={() => toggleSort("change24h")}>PRICE <ArrowUpDown className="inline h-3 w-3" /></th>
                <th className="text-right p-3 font-medium hidden md:table-cell">5M</th>
                <th className="text-right p-3 font-medium hidden md:table-cell">1H</th>
                <th className="text-right p-3 font-medium cursor-pointer hover:text-foreground" onClick={() => toggleSort("change24h")}>24H <ArrowUpDown className="inline h-3 w-3" /></th>
                <th className="text-right p-3 font-medium cursor-pointer hover:text-foreground hidden lg:table-cell" onClick={() => toggleSort("volume")}>VOLUME <ArrowUpDown className="inline h-3 w-3" /></th>
                <th className="text-right p-3 font-medium hidden lg:table-cell">LIQUIDITY</th>
                <th className="text-right p-3 font-medium cursor-pointer hover:text-foreground hidden xl:table-cell" onClick={() => toggleSort("mcap")}>MCAP <ArrowUpDown className="inline h-3 w-3" /></th>
                <th className="text-center p-3 font-medium hidden xl:table-cell">AGE</th>
                <th className="text-center p-3 font-medium hidden xl:table-cell">HOLDERS</th>
                <th className="text-center p-3 font-medium cursor-pointer hover:text-foreground" onClick={() => toggleSort("riskScore")}>RISK <ArrowUpDown className="inline h-3 w-3" /></th>
                <th className="text-center p-3 font-medium">SIGNAL</th>
                <th className="text-center p-3 font-medium w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="p-3">
                    <Link to={`/token/${t.id}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary shrink-0">{t.symbol.slice(0, 2)}</div>
                      <div>
                        <p className="font-medium text-foreground">{t.symbol}</p>
                        <p className="text-[9px] text-muted-foreground">{t.name}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="p-3 text-muted-foreground">{t.chain}</td>
                  <td className="p-3 text-right text-foreground">{formatPrice(t.price)}</td>
                  <td className={cn("p-3 text-right hidden md:table-cell", t.change5m >= 0 ? "text-terminal-green" : "text-destructive")}>{t.change5m >= 0 ? "+" : ""}{t.change5m.toFixed(1)}%</td>
                  <td className={cn("p-3 text-right hidden md:table-cell", t.change1h >= 0 ? "text-terminal-green" : "text-destructive")}>{t.change1h >= 0 ? "+" : ""}{t.change1h.toFixed(1)}%</td>
                  <td className={cn("p-3 text-right", t.change24h >= 0 ? "text-terminal-green" : "text-destructive")}>{t.change24h >= 0 ? "+" : ""}{t.change24h.toFixed(1)}%</td>
                  <td className="p-3 text-right hidden lg:table-cell text-foreground">{formatVolume(t.volume)}</td>
                  <td className="p-3 text-right hidden lg:table-cell text-muted-foreground">{formatVolume(t.liquidity)}</td>
                  <td className="p-3 text-right hidden xl:table-cell text-foreground">{formatVolume(t.mcap)}</td>
                  <td className="p-3 text-center hidden xl:table-cell text-muted-foreground">{t.pairAge}</td>
                  <td className="p-3 text-center hidden xl:table-cell text-muted-foreground">{formatNumber(t.holders)}</td>
                  <td className="p-3 text-center">
                    <StatusChip variant={t.riskScore < 25 ? "success" : t.riskScore < 50 ? "warning" : "danger"}>{t.riskScore}</StatusChip>
                  </td>
                  <td className="p-3 text-center">
                    <StatusChip variant={t.signalScore >= 80 ? "success" : t.signalScore >= 60 ? "info" : "muted"}>{t.signalScore}</StatusChip>
                  </td>
                  <td className="p-3 text-center">
                    <button className="text-muted-foreground hover:text-terminal-amber transition-colors"><Star className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelShell>
    </div>
  );
}
