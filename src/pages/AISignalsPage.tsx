import { useState } from "react";
import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { ScoreMeter } from "@/components/shared/ScoreMeter";
import { mockSignals } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Brain, Filter, Zap, TrendingUp, AlertTriangle, Shield, Eye } from "lucide-react";

const SIGNAL_TYPES = ["All", "Whale Buy", "Fresh Launch", "Breakout Forming", "Volume Spike", "Smart Money Entry", "Rug Warning", "Contract Concern", "Momentum Continuation"];

export default function AISignalsPage() {
  const [typeFilter, setTypeFilter] = useState("All");
  const [minConf, setMinConf] = useState(0);

  const filtered = mockSignals.filter(s => {
    if (typeFilter !== "All" && s.type !== typeFilter) return false;
    if (s.confidence < minConf) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-mono font-bold text-foreground">AI SIGNALS</h1>
          <p className="text-xs font-mono text-muted-foreground">Real-time AI-powered market intelligence</p>
        </div>
        <StatusChip variant="info" dot>ACTIVE ENGINE</StatusChip>
      </div>

      {/* AI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="terminal-panel p-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-3.5 w-3.5 text-terminal-green" />
            <span className="text-[9px] font-mono text-muted-foreground uppercase">Strongest Signal</span>
          </div>
          <p className="text-sm font-mono font-bold text-foreground">ALPHA</p>
          <p className="text-[10px] text-muted-foreground">Whale accumulation — 92% confidence</p>
        </div>
        <div className="terminal-panel p-3">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span className="text-[9px] font-mono text-muted-foreground uppercase">Safest Setup</span>
          </div>
          <p className="text-sm font-mono font-bold text-foreground">VLTX</p>
          <p className="text-[10px] text-muted-foreground">Low risk, high liquidity, stable growth</p>
        </div>
        <div className="terminal-panel p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            <span className="text-[9px] font-mono text-muted-foreground uppercase">Highest Risk</span>
          </div>
          <p className="text-sm font-mono font-bold text-foreground">MOON</p>
          <p className="text-[10px] text-muted-foreground">Dev dump detected — exit recommended</p>
        </div>
        <div className="terminal-panel p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-3.5 w-3.5 text-terminal-amber" />
            <span className="text-[9px] font-mono text-muted-foreground uppercase">Best Launch</span>
          </div>
          <p className="text-sm font-mono font-bold text-foreground">NEON</p>
          <p className="text-[10px] text-muted-foreground">Fresh launch, verified contract, liq locked</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
        {SIGNAL_TYPES.map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} className={cn("px-2.5 py-1.5 rounded text-[10px] font-mono border transition-colors", typeFilter === t ? "bg-primary/10 text-primary border-primary/30" : "bg-muted/30 text-muted-foreground border-border hover:text-foreground")}>
            {t}
          </button>
        ))}
      </div>

      {/* Signal cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(s => (
          <div key={s.id} className={cn("terminal-panel p-4 space-y-3", s.confidence >= 85 && "border-terminal-green/20")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <span className="text-sm font-mono font-bold text-foreground">{s.symbol}</span>
                <StatusChip variant={s.type.includes("Warning") || s.type.includes("Concern") ? "danger" : s.confidence >= 85 ? "success" : "info"}>
                  {s.type}
                </StatusChip>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">{s.timestamp}</span>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">{s.reason}</p>

            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-muted-foreground">{s.metrics}</span>
            </div>

            <ScoreMeter value={s.confidence} label="CONFIDENCE" size="md" />

            <div className="p-2 rounded bg-muted/30 text-[10px] text-muted-foreground">
              <span className="text-foreground/60">RISK: </span>{s.riskContext}
            </div>

            <div className="flex gap-2">
              <button className="flex-1 py-1.5 rounded bg-primary/10 text-primary text-[10px] font-mono hover:bg-primary/20 transition-colors">VIEW TOKEN</button>
              <button className="flex-1 py-1.5 rounded bg-muted/50 text-muted-foreground text-[10px] font-mono hover:text-foreground transition-colors">WATCHLIST</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
