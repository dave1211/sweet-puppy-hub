import { useState, useEffect } from "react";
import { Brain, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { loadWeights, resetWeights, getOutcomeStats, DEFAULT_WEIGHTS, SignalWeights } from "@/lib/adaptiveWeights";

const WEIGHT_LABELS: Record<keyof SignalWeights, { label: string; color: string }> = {
  momentum: { label: "Momentum", color: "bg-terminal-green" },
  walletCount: { label: "Wallets", color: "bg-terminal-cyan" },
  freshness: { label: "Freshness", color: "bg-terminal-blue" },
  liquidity: { label: "Liquidity", color: "bg-primary" },
  sniper: { label: "Sniper", color: "bg-terminal-red" },
  whale: { label: "Whale", color: "bg-terminal-yellow" },
};

function WeightBar({ weightKey, value }: { weightKey: keyof SignalWeights; value: number }) {
  const { label, color } = WEIGHT_LABELS[weightKey];
  const pct = Math.min((value / 2) * 100, 100);
  const isDefault = Math.abs(value - DEFAULT_WEIGHTS[weightKey]) < 0.01;
  const direction = value > DEFAULT_WEIGHTS[weightKey] ? "↑" : value < DEFAULT_WEIGHTS[weightKey] ? "↓" : "";
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-mono text-muted-foreground w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[9px] font-mono w-10 text-right ${isDefault ? "text-muted-foreground" : "text-foreground font-semibold"}`}>{value.toFixed(2)}{direction}</span>
    </div>
  );
}

export function AdaptiveWeightsPanel() {
  const [weights, setWeights] = useState(loadWeights);
  const [stats, setStats] = useState(getOutcomeStats);

  useEffect(() => {
    const interval = setInterval(() => { setWeights(loadWeights()); setStats(getOutcomeStats()); }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleReset = () => { const fresh = resetWeights(); setWeights(fresh); setStats(getOutcomeStats()); };
  const isAllDefault = (Object.keys(DEFAULT_WEIGHTS) as (keyof SignalWeights)[]).every((k) => Math.abs(weights[k] - DEFAULT_WEIGHTS[k]) < 0.01);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-mono">
          <Brain className="h-4 w-4 text-terminal-cyan" />
          ADAPTIVE WEIGHTS
          {!isAllDefault && <span className="text-[8px] bg-terminal-green/15 text-terminal-green px-1.5 py-0.5 rounded font-mono">LEARNING</span>}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={handleReset} className="h-6 px-2 text-[9px] font-mono text-muted-foreground hover:text-foreground" disabled={isAllDefault}>
          <RotateCcw className="h-3 w-3 mr-1" />Reset
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {(Object.keys(WEIGHT_LABELS) as (keyof SignalWeights)[]).map((key) => (
          <WeightBar key={key} weightKey={key} value={weights[key]} />
        ))}
        {stats.totalTrades > 0 && (
          <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-border mt-2">
            <div className="text-center"><p className="text-[8px] font-mono text-muted-foreground">OUTCOMES</p><p className="text-[11px] font-mono font-bold text-foreground">{stats.totalTrades}</p></div>
            <div className="text-center"><p className="text-[8px] font-mono text-muted-foreground">WINS</p><p className="text-[11px] font-mono font-bold text-terminal-green">{stats.wins}</p></div>
            <div className="text-center"><p className="text-[8px] font-mono text-muted-foreground">LOSSES</p><p className="text-[11px] font-mono font-bold text-terminal-red">{stats.losses}</p></div>
          </div>
        )}
        <p className="text-[8px] text-muted-foreground/50 font-mono text-center pt-1">Weights adjust automatically from trade outcomes</p>
      </CardContent>
    </Card>
  );
}