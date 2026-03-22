import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useMarketStore } from "@/stores/marketStore";
import { useTradingStore } from "@/stores/tradingStore";
import { Search, Star, TrendingUp, TrendingDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { TradingPair } from "@/types/xrpl";

interface PairSearchProps {
  onClose?: () => void;
}

export function PairSearch({ onClose }: PairSearchProps) {
  const { availablePairs, activePair, setActivePair } = useMarketStore();
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set(["XRP/USD"]));

  const filtered = useMemo(() => {
    if (!query) return availablePairs;
    const q = query.toUpperCase();
    return availablePairs.filter((p) => p.label.includes(q));
  }, [query, availablePairs]);

  const toggleFav = (label: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  const handleSelect = (pair: TradingPair) => {
    setActivePair(pair);
    onClose?.();
  };

  // Mock changes
  const changes: Record<string, number> = {
    "XRP/USD": 2.41, "XRP/EUR": -0.87, "XRP/BTC": 1.15, "CSC/XRP": -2.33, "SOLO/XRP": 4.72,
  };

  return (
    <div className="terminal-panel">
      <div className="terminal-panel-header">
        <div className="flex items-center gap-1.5">
          <Search className="h-3 w-3 text-muted-foreground/50" />
          <span className="terminal-panel-title">Pair Search</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-0.5 hover:bg-muted/30 rounded transition-colors">
            <X className="h-3 w-3 text-muted-foreground/50" />
          </button>
        )}
      </div>

      <div className="p-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search pairs..."
          className="h-7 text-[10px] font-mono bg-background/50 border-border/60 mb-2"
          autoFocus
        />

        {/* Favorites */}
        {favorites.size > 0 && !query && (
          <div className="mb-2">
            <span className="text-[7px] font-mono text-muted-foreground/30 uppercase tracking-wider">Favorites</span>
            {availablePairs.filter((p) => favorites.has(p.label)).map((pair) => (
              <PairRow
                key={pair.label}
                pair={pair}
                isActive={pair.label === activePair.label}
                isFavorite={true}
                change={changes[pair.label] ?? 0}
                onSelect={handleSelect}
                onToggleFav={toggleFav}
              />
            ))}
          </div>
        )}

        {/* All pairs */}
        <span className="text-[7px] font-mono text-muted-foreground/30 uppercase tracking-wider">All Pairs</span>
        {filtered.map((pair) => (
          <PairRow
            key={pair.label}
            pair={pair}
            isActive={pair.label === activePair.label}
            isFavorite={favorites.has(pair.label)}
            change={changes[pair.label] ?? 0}
            onSelect={handleSelect}
            onToggleFav={toggleFav}
          />
        ))}

        {filtered.length === 0 && (
          <p className="text-[9px] font-mono text-muted-foreground/30 text-center py-4">No pairs found</p>
        )}
      </div>
    </div>
  );
}

function PairRow({
  pair, isActive, isFavorite, change, onSelect, onToggleFav,
}: {
  pair: TradingPair;
  isActive: boolean;
  isFavorite: boolean;
  change: number;
  onSelect: (p: TradingPair) => void;
  onToggleFav: (label: string) => void;
}) {
  const isUp = change >= 0;
  return (
    <div
      className={cn(
        "flex items-center justify-between px-1.5 py-1.5 rounded cursor-pointer transition-colors group",
        isActive ? "bg-primary/8" : "hover:bg-muted/20"
      )}
    >
      <div className="flex items-center gap-2" onClick={() => onSelect(pair)}>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFav(pair.label); }}
          className="p-0.5"
        >
          <Star className={cn(
            "h-2.5 w-2.5 transition-colors",
            isFavorite ? "text-terminal-amber fill-terminal-amber/50" : "text-muted-foreground/20 hover:text-muted-foreground/40"
          )} />
        </button>
        <span className={cn("text-[10px] font-mono font-medium", isActive ? "text-primary" : "text-foreground/80")}>
          {pair.label}
        </span>
      </div>
      <div className="flex items-center gap-1" onClick={() => onSelect(pair)}>
        <span className={cn("text-[9px] font-mono tabular-nums", isUp ? "text-primary/60" : "text-destructive/60")}>
          {isUp ? "+" : ""}{change.toFixed(2)}%
        </span>
        {isUp ? <TrendingUp className="h-2.5 w-2.5 text-primary/40" /> : <TrendingDown className="h-2.5 w-2.5 text-destructive/40" />}
      </div>
    </div>
  );
}
