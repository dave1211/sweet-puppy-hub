// Sniper Header — Controls, mode toggle, stats bar
import { Activity, Zap, Filter, Pause, Play, RotateCcw } from "lucide-react";
import { useSniperStore } from "../stores/sniperStore";
import { useExecutionStore } from "../stores/executionStore";
import type { SortField } from "../types";

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "score", label: "SCORE" },
  { value: "newest", label: "NEWEST" },
  { value: "liquidity", label: "LIQUIDITY" },
  { value: "volume", label: "VOLUME" },
  { value: "momentum", label: "MOMENTUM" },
  { value: "buys", label: "BUYS" },
  { value: "smartMoney", label: "SMART $" },
  { value: "riskAsc", label: "SAFEST" },
];

export function SniperHeader({ tokenCount, snipeReady }: { tokenCount: number; snipeReady: number }) {
  const { sortField, setSortField, isLive, toggleLive, resetFilters } = useSniperStore();
  const { isFastMode, toggleFastMode } = useExecutionStore();

  return (
    <div className="border-b border-border bg-card/50 px-3 py-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-mono font-bold text-foreground tracking-wider">SNIPER CORE</h2>
          <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">SOLANA</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFastMode}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-colors ${
              isFastMode
                ? "bg-terminal-amber/15 text-terminal-amber border border-terminal-amber/30"
                : "bg-muted/30 text-muted-foreground border border-transparent hover:text-foreground"
            }`}
          >
            <Zap className="h-3 w-3" />
            FAST
          </button>
          <button
            onClick={toggleLive}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-colors ${
              isLive
                ? "bg-terminal-green/15 text-terminal-green border border-terminal-green/30"
                : "bg-terminal-red/15 text-terminal-red border border-terminal-red/30"
            }`}
          >
            {isLive ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            {isLive ? "LIVE" : "PAUSED"}
          </button>
          <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
            <Activity className="h-3 w-3 text-terminal-green animate-pulse" />
            <span>{tokenCount}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortField(opt.value)}
              className={`shrink-0 px-2 py-1 rounded text-[9px] font-mono transition-colors ${
                sortField === opt.value
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "bg-muted/20 text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {snipeReady > 0 && (
            <span className="text-[10px] font-mono text-terminal-green bg-terminal-green/10 px-1.5 py-0.5 rounded animate-pulse">
              {snipeReady} READY
            </span>
          )}
          <button onClick={resetFilters} className="text-muted-foreground hover:text-foreground transition-colors">
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
