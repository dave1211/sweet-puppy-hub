import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { formatPrice, formatVolume, timeAgo } from "@/data/mockData";
import { cn } from "@/lib/utils";
import {
  Search, Star, ArrowUpDown, Loader2, TrendingUp, TrendingDown,
  RefreshCw, SlidersHorizontal, Radar, X,
} from "lucide-react";
import { useLivePairs, type LivePair } from "@/hooks/useLivePairs";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useTokenSearch } from "@/hooks/useTokenSearch";

const SORT_OPTIONS = [
  { key: "volume24h", label: "Volume" },
  { key: "change24h", label: "24h Change" },
  { key: "liquidity", label: "Liquidity" },
  { key: "marketCap", label: "Market Cap" },
  { key: "buyCount24h", label: "Buys" },
  { key: "pairCreatedAt", label: "Newest" },
] as const;

type SortKey = typeof SORT_OPTIONS[number]["key"];

const FILTER_PRESETS = [
  { key: "all", label: "All" },
  { key: "new", label: "New", tag: true },
  { key: "highvol", label: "High Volume" },
  { key: "lowliq", label: "Low Liq" },
  { key: "gainers", label: "Gainers" },
  { key: "losers", label: "Losers" },
] as const;

type FilterKey = typeof FILTER_PRESETS[number]["key"];

export default function ScannerPage() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("volume24h");
  const [sortAsc, setSortAsc] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [minLiquidity, setMinLiquidity] = useState(0);
  const [minVolume, setMinVolume] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: livePairs, isLoading, refetch, dataUpdatedAt } = useLivePairs();
  const { addItem } = useWatchlist();
  const { data: searchResults, isLoading: searchLoading } = useTokenSearch(search);

  const filtered = useMemo(() => {
    let pairs = [...(livePairs ?? [])];

    // Apply search
    if (search.length >= 2 && searchResults?.length) {
      const searchAddrs = new Set(searchResults.map(r => r.address));
      const fromSearch = pairs.filter(p => searchAddrs.has(p.address));
      // Add search results not in live pairs
      const livePairAddrs = new Set(pairs.map(p => p.address));
      const extraFromSearch = searchResults
        .filter(r => !livePairAddrs.has(r.address))
        .map(r => ({
          address: r.address,
          symbol: r.symbol,
          name: r.name,
          price: r.price,
          change24h: 0, change1h: 0, change5m: 0,
          volume24h: 0, volume1h: 0,
          liquidity: 0, marketCap: 0,
          pairCreatedAt: Date.now(),
          dexId: "search",
          url: `https://dexscreener.com/solana/${r.address}`,
          buyCount24h: 0, sellCount24h: 0, makers24h: 0,
          imageUrl: null,
        } as LivePair));
      pairs = [...fromSearch, ...extraFromSearch];
    } else if (search.length >= 2) {
      pairs = pairs.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.symbol.toLowerCase().includes(search.toLowerCase()) ||
        p.address.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply filter preset
    if (activeFilter === "new") pairs = pairs.filter(p => (Date.now() - p.pairCreatedAt) < 24 * 60 * 60 * 1000);
    if (activeFilter === "highvol") pairs = pairs.filter(p => p.volume24h > 100_000);
    if (activeFilter === "lowliq") pairs = pairs.filter(p => p.liquidity > 0 && p.liquidity < 10_000);
    if (activeFilter === "gainers") pairs = pairs.filter(p => p.change24h > 5);
    if (activeFilter === "losers") pairs = pairs.filter(p => p.change24h < -5);

    // Apply custom filters
    if (minLiquidity > 0) pairs = pairs.filter(p => p.liquidity >= minLiquidity);
    if (minVolume > 0) pairs = pairs.filter(p => p.volume24h >= minVolume);

    // Sort
    pairs.sort((a, b) => {
      const mult = sortAsc ? 1 : -1;
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      return (Number(av) - Number(bv)) * mult;
    });

    return pairs;
  }, [livePairs, search, searchResults, activeFilter, sortKey, sortAsc, minLiquidity, minVolume]);

  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  }, [sortKey, sortAsc]);

  const lastUpdated = dataUpdatedAt ? timeAgo(dataUpdatedAt) : null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radar className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-base sm:text-lg font-mono font-bold text-foreground">TOKEN SCANNER</h1>
            <p className="text-[10px] font-mono text-muted-foreground">
              {filtered.length} tokens · {lastUpdated ? `updated ${lastUpdated}` : "loading…"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              "text-[9px] font-mono px-2 py-1 rounded border transition-colors",
              autoRefresh
                ? "border-terminal-green/30 bg-terminal-green/5 text-terminal-green"
                : "border-border bg-card text-muted-foreground"
            )}
          >
            {autoRefresh ? "● LIVE" : "○ PAUSED"}
          </button>
          <button onClick={() => refetch()} className="p-1.5 rounded hover:bg-muted/30 transition-colors">
            <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Search + filter toggle */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, symbol, or address…"
            className="w-full bg-muted/50 border border-border rounded pl-8 pr-8 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          )}
          {searchLoading && search.length >= 2 && (
            <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-primary" />
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded border text-[10px] font-mono transition-colors",
            showFilters ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"
          )}
        >
          <SlidersHorizontal className="h-3 w-3" />
          Filters
        </button>
      </div>

      {/* Filter presets */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTER_PRESETS.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={cn(
              "px-2.5 py-1.5 rounded text-[10px] font-mono transition-colors border",
              activeFilter === f.key
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-muted/30 text-muted-foreground border-border hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-lg border border-border bg-card/50">
          <div>
            <label className="text-[9px] font-mono text-muted-foreground uppercase block mb-1">Min Liquidity</label>
            <input
              type="number" value={minLiquidity || ""} onChange={e => setMinLiquidity(Number(e.target.value) || 0)}
              placeholder="0" className="w-full bg-muted/50 border border-border rounded px-2 py-1.5 text-[10px] font-mono text-foreground"
            />
          </div>
          <div>
            <label className="text-[9px] font-mono text-muted-foreground uppercase block mb-1">Min Volume 24h</label>
            <input
              type="number" value={minVolume || ""} onChange={e => setMinVolume(Number(e.target.value) || 0)}
              placeholder="0" className="w-full bg-muted/50 border border-border rounded px-2 py-1.5 text-[10px] font-mono text-foreground"
            />
          </div>
          <div>
            <label className="text-[9px] font-mono text-muted-foreground uppercase block mb-1">Sort by</label>
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value as SortKey)}
              className="w-full bg-muted/50 border border-border rounded px-2 py-1.5 text-[10px] font-mono text-foreground"
            >
              {SORT_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setMinLiquidity(0); setMinVolume(0); setActiveFilter("all"); setSortKey("volume24h"); setSortAsc(false); }}
              className="w-full py-1.5 rounded border border-border text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              Reset filters
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      <PanelShell title="SCAN RESULTS" subtitle={`${filtered.length} tokens`} noPad>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="ml-2 text-xs font-mono text-muted-foreground">Scanning DexScreener…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Radar className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-xs font-mono text-muted-foreground">No tokens match your filters</p>
            <button onClick={() => { setSearch(""); setActiveFilter("all"); }} className="text-[10px] font-mono text-primary mt-2 hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-border/50">
              {filtered.slice(0, 50).map(t => (
                <Link key={t.address} to={`/token/${t.address}`} className="flex items-center gap-3 p-3 hover:bg-muted/20 transition-colors">
                  {t.imageUrl ? (
                    <img src={t.imageUrl} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" loading="lazy" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">{t.symbol.slice(0, 2)}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-mono font-medium text-foreground truncate">{t.symbol}</p>
                      {(Date.now() - t.pairCreatedAt) < 24 * 60 * 60 * 1000 && (
                        <StatusChip variant="success">New</StatusChip>
                      )}
                    </div>
                    <p className="text-[9px] font-mono text-muted-foreground truncate">{t.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-mono text-foreground tabular-nums">{formatPrice(t.price)}</p>
                    <p className={cn("text-[9px] font-mono tabular-nums", t.change24h >= 0 ? "text-terminal-green" : "text-destructive")}>
                      {t.change24h >= 0 ? "+" : ""}{t.change24h.toFixed(1)}%
                    </p>
                  </div>
                  <button onClick={e => { e.preventDefault(); addItem.mutate({ address: t.address, label: t.symbol }); }} className="text-muted-foreground hover:text-terminal-amber shrink-0 ml-1">
                    <Star className="h-3.5 w-3.5" />
                  </button>
                </Link>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left p-3 font-medium">TOKEN</th>
                    <th className="text-right p-3 font-medium">PRICE</th>
                    <th className="text-right p-3 font-medium cursor-pointer hover:text-foreground" onClick={() => toggleSort("change24h")}>24H <ArrowUpDown className={cn("inline h-3 w-3 ml-0.5", sortKey === "change24h" && "text-primary")} /></th>
                    <th className="text-right p-3 font-medium cursor-pointer hover:text-foreground" onClick={() => toggleSort("volume24h")}>VOL <ArrowUpDown className={cn("inline h-3 w-3 ml-0.5", sortKey === "volume24h" && "text-primary")} /></th>
                    <th className="text-right p-3 font-medium cursor-pointer hover:text-foreground hidden md:table-cell" onClick={() => toggleSort("liquidity")}>LIQ <ArrowUpDown className={cn("inline h-3 w-3 ml-0.5", sortKey === "liquidity" && "text-primary")} /></th>
                    <th className="text-right p-3 font-medium cursor-pointer hover:text-foreground hidden lg:table-cell" onClick={() => toggleSort("marketCap")}>MCAP <ArrowUpDown className={cn("inline h-3 w-3 ml-0.5", sortKey === "marketCap" && "text-primary")} /></th>
                    <th className="text-center p-3 font-medium hidden md:table-cell">BUYS/SELLS</th>
                    <th className="text-center p-3 font-medium hidden lg:table-cell">AGE</th>
                    <th className="text-center p-3 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 50).map(t => (
                    <tr key={t.address} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="p-3">
                        <Link to={`/token/${t.address}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                          {t.imageUrl ? (
                            <img src={t.imageUrl} alt="" className="h-6 w-6 rounded-full object-cover shrink-0" loading="lazy" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary shrink-0">{t.symbol.slice(0, 2)}</div>
                          )}
                          <div>
                            <div className="flex items-center gap-1">
                              <p className="font-medium text-foreground">{t.symbol}</p>
                              {(Date.now() - t.pairCreatedAt) < 24 * 60 * 60 * 1000 && <StatusChip variant="success">New</StatusChip>}
                              {t.liquidity > 0 && t.liquidity < 5000 && <StatusChip variant="danger">Low Liq</StatusChip>}
                            </div>
                            <p className="text-[9px] text-muted-foreground truncate max-w-[120px]">{t.name}</p>
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
                      <td className="p-3 text-right text-foreground tabular-nums">{formatVolume(t.volume24h)}</td>
                      <td className="p-3 text-right hidden md:table-cell text-muted-foreground tabular-nums">{formatVolume(t.liquidity)}</td>
                      <td className="p-3 text-right hidden lg:table-cell text-muted-foreground tabular-nums">{t.marketCap > 0 ? formatVolume(t.marketCap) : "—"}</td>
                      <td className="p-3 text-center hidden md:table-cell">
                        <div className="flex items-center justify-center gap-1 text-[9px]">
                          <span className="text-terminal-green">{t.buyCount24h}</span>
                          <span className="text-muted-foreground/30">/</span>
                          <span className="text-destructive">{t.sellCount24h}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center hidden lg:table-cell text-[9px] text-muted-foreground">
                        {timeAgo(t.pairCreatedAt)}
                      </td>
                      <td className="p-3 text-center">
                        <button onClick={() => addItem.mutate({ address: t.address, label: t.symbol })} className="text-muted-foreground hover:text-terminal-amber transition-colors">
                          <Star className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </PanelShell>
    </div>
  );
}
