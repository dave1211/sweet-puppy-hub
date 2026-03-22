import { useState } from "react";
import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { ScoreMeter } from "@/components/shared/ScoreMeter";
import { cn } from "@/lib/utils";
import { Play, Pause, Settings, Plus, Sliders, Shield, Crosshair, TrendingUp, Eye, Zap } from "lucide-react";

interface Strategy {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "draft";
  filters: string[];
  scoreThreshold: number;
  riskCap: number;
  icon: typeof Crosshair;
}

const STRATEGY_TEMPLATES: Strategy[] = [
  { id: "st1", name: "Fresh Launch Hunter", description: "Targets new launches under 1h with locked liquidity", status: "draft", filters: ["age < 1h", "liq > $5K"], scoreThreshold: 80, riskCap: 40, icon: Crosshair },
  { id: "st2", name: "Safe Momentum", description: "Follows tokens with strong liquidity and low risk", status: "draft", filters: ["liq > $50K", "low volatility"], scoreThreshold: 70, riskCap: 25, icon: Shield },
  { id: "st3", name: "Whale Mirror", description: "Follows high-activity tracked wallets", status: "draft", filters: ["wallet count ≥ 2", "smart money active"], scoreThreshold: 75, riskCap: 35, icon: Eye },
  { id: "st4", name: "Breakout Tracker", description: "Detects volume spikes with momentum", status: "draft", filters: ["volume spike", "momentum"], scoreThreshold: 85, riskCap: 45, icon: TrendingUp },
  { id: "st5", name: "Rug Avoidance", description: "Conservative mode — strict risk filters", status: "draft", filters: ["no risk flags", "liq > $50K"], scoreThreshold: 60, riskCap: 15, icon: Shield },
  { id: "st6", name: "Alpha Rotation", description: "Rotates between high-signal tokens", status: "draft", filters: ["signal > 85", "smart money"], scoreThreshold: 90, riskCap: 50, icon: Zap },
];

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState(STRATEGY_TEMPLATES);

  const toggleStatus = (id: string) => {
    setStrategies(prev => prev.map(s => s.id === id ? { ...s, status: s.status === "active" ? "paused" : "active" as Strategy["status"] } : s));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-mono font-bold text-foreground">STRATEGIES</h1>
          <p className="text-xs font-mono text-muted-foreground">Configure your trading strategy templates</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Strategy templates define your trading parameters. Activate them to filter signals based on your criteria.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {strategies.map(s => (
          <div key={s.id} className={cn("terminal-panel p-5 space-y-4", s.status === "active" && "border-primary/20")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><s.icon className="h-5 w-5 text-primary" /></div>
                <div>
                  <h3 className="text-sm font-mono font-bold text-foreground">{s.name}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.description}</p>
                </div>
              </div>
              <StatusChip variant={s.status === "active" ? "success" : s.status === "paused" ? "warning" : "muted"} dot>
                {s.status.toUpperCase()}
              </StatusChip>
            </div>

            <div className="flex gap-1 flex-wrap">
              {s.filters.map(f => <StatusChip key={f} variant="muted">{f}</StatusChip>)}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-muted/30 text-center">
                <p className="text-[8px] text-muted-foreground uppercase">Score Min</p>
                <p className="text-xs font-mono font-bold text-foreground">{s.scoreThreshold}</p>
              </div>
              <div className="p-2 rounded bg-muted/30 text-center">
                <p className="text-[8px] text-muted-foreground uppercase">Risk Cap</p>
                <p className="text-xs font-mono font-bold text-foreground">{s.riskCap}</p>
              </div>
            </div>

            <button
              onClick={() => toggleStatus(s.id)}
              className={cn("w-full py-1.5 rounded text-[10px] font-mono flex items-center justify-center gap-1 transition-colors",
                s.status === "active" ? "bg-terminal-amber/10 text-terminal-amber hover:bg-terminal-amber/20" : "bg-terminal-green/10 text-terminal-green hover:bg-terminal-green/20"
              )}
            >
              {s.status === "active" ? <><Pause className="h-3 w-3" /> PAUSE</> : <><Play className="h-3 w-3" /> ACTIVATE</>}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
