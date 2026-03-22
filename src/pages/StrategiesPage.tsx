import { useState } from "react";
import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { ScoreMeter } from "@/components/shared/ScoreMeter";
import { mockStrategies } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Play, Pause, Settings, Plus, Sliders, Shield, Crosshair, TrendingUp, Eye, Zap, RefreshCw } from "lucide-react";

const ICONS: Record<string, any> = {
  "Fresh Launch Hunter": Crosshair,
  "Safe Momentum": Shield,
  "Whale Mirror": Eye,
  "Breakout Tracker": TrendingUp,
  "Rug Avoidance Mode": Shield,
  "Alpha Rotation": Zap,
};

export default function StrategiesPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-mono font-bold text-foreground">STRATEGIES</h1>
          <p className="text-xs font-mono text-muted-foreground">Manage your trading strategies and automation</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary/10 text-primary text-xs font-mono border border-primary/30 hover:bg-primary/20 transition-colors">
          <Plus className="h-3.5 w-3.5" /> NEW STRATEGY
        </button>
      </div>

      {/* Strategy cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockStrategies.map(s => {
          const Icon = ICONS[s.name] || Sliders;
          return (
            <div key={s.id} className={cn("terminal-panel p-5 space-y-4", s.status === "active" && "border-primary/20")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div>
                  <div>
                    <h3 className="text-sm font-mono font-bold text-foreground">{s.name}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.description}</p>
                  </div>
                </div>
                <StatusChip variant={s.status === "active" ? "success" : s.status === "paused" ? "warning" : "muted"} dot>
                  {s.status.toUpperCase()}
                </StatusChip>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Filters</p>
                  <div className="flex gap-1 flex-wrap">
                    {s.filters.map(f => <StatusChip key={f} variant="muted">{f}</StatusChip>)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded bg-muted/30 text-center">
                    <p className="text-[8px] text-muted-foreground uppercase">Score Min</p>
                    <p className="text-xs font-mono font-bold text-foreground">{s.scoreThreshold}</p>
                  </div>
                  <div className="p-2 rounded bg-muted/30 text-center">
                    <p className="text-[8px] text-muted-foreground uppercase">Risk Cap</p>
                    <p className="text-xs font-mono font-bold text-foreground">{s.riskCap}</p>
                  </div>
                  <div className="p-2 rounded bg-muted/30 text-center">
                    <p className="text-[8px] text-muted-foreground uppercase">Perf</p>
                    <p className={cn("text-xs font-mono font-bold", s.recentPerformance > 0 ? "text-terminal-green" : "text-muted-foreground")}>
                      {s.recentPerformance > 0 ? `+${s.recentPerformance}%` : "—"}
                    </p>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground">
                  <span className="text-foreground/60">Linked: </span>{s.linkedWatchlist}
                </p>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 py-1.5 rounded bg-muted/50 text-muted-foreground text-[10px] font-mono hover:text-foreground transition-colors flex items-center justify-center gap-1">
                  <Settings className="h-3 w-3" /> EDIT
                </button>
                <button className={cn("flex-1 py-1.5 rounded text-[10px] font-mono flex items-center justify-center gap-1 transition-colors",
                  s.status === "active" ? "bg-terminal-amber/10 text-terminal-amber hover:bg-terminal-amber/20" : "bg-terminal-green/10 text-terminal-green hover:bg-terminal-green/20"
                )}>
                  {s.status === "active" ? <><Pause className="h-3 w-3" /> PAUSE</> : <><Play className="h-3 w-3" /> ACTIVATE</>}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
