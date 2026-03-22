import { useState } from "react";
import { StatusChip } from "@/components/shared/StatusChip";
import { ScoreMeter } from "@/components/shared/ScoreMeter";
import { cn } from "@/lib/utils";
import { Brain, Zap, TrendingUp, AlertTriangle, Shield, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useUnifiedSignals, ScoredToken } from "@/hooks/useUnifiedSignals";

const LABEL_FILTERS = ["All", "HIGH SIGNAL", "MEDIUM", "LOW"];

export default function AISignalsPage() {
  const [labelFilter, setLabelFilter] = useState("All");
  const { tokens, isLoading } = useUnifiedSignals();

  const filtered = tokens.filter(t => {
    if (labelFilter !== "All" && t.label !== labelFilter) return false;
    return true;
  });

  const strongest = tokens[0];
  const safest = tokens.filter(t => !t.factors.some(f => f.includes("Low liquidity") || f.includes("Extreme"))).sort((a, b) => b.liquidity - a.liquidity)[0];
  const riskiest = tokens.filter(t => t.factors.some(f => f.includes("Low liquidity") || f.includes("Extreme"))).sort((a, b) => b.factors.length - a.factors.length)[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-mono font-bold text-foreground">AI SIGNALS</h1>
          <p className="text-xs font-mono text-muted-foreground">Real-time unified signal intelligence</p>
        </div>
        <StatusChip variant="info" dot>ACTIVE ENGINE</StatusChip>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="terminal-panel p-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-3.5 w-3.5 text-terminal-green" />
            <span className="text-[9px] font-mono text-muted-foreground uppercase">Strongest Signal</span>
          </div>
          <p className="text-sm font-mono font-bold text-foreground">{strongest?.symbol ?? "—"}</p>
          <p className="text-[10px] text-muted-foreground">{strongest ? `Score ${strongest.score} — ${strongest.factors[0] ?? ""}` : "Scanning…"}</p>
        </div>
        <div className="terminal-panel p-3">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span className="text-[9px] font-mono text-muted-foreground uppercase">Safest Setup</span>
          </div>
          <p className="text-sm font-mono font-bold text-foreground">{safest?.symbol ?? "—"}</p>
          <p className="text-[10px] text-muted-foreground">{safest ? `High liquidity, score ${safest.score}` : "Scanning…"}</p>
        </div>
        <div className="terminal-panel p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            <span className="text-[9px] font-mono text-muted-foreground uppercase">Highest Risk</span>
          </div>
          <p className="text-sm font-mono font-bold text-foreground">{riskiest?.symbol ?? "—"}</p>
          <p className="text-[10px] text-muted-foreground">{riskiest ? `${riskiest.factors.length} risk flags` : "All clear"}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {LABEL_FILTERS.map(t => (
          <button key={t} onClick={() => setLabelFilter(t)} className={cn("px-2.5 py-1.5 rounded text-[10px] font-mono border transition-colors", labelFilter === t ? "bg-primary/10 text-primary border-primary/30" : "bg-muted/30 text-muted-foreground border-border hover:text-foreground")}>
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-xs font-mono text-muted-foreground">Loading signals…</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(s => (
            <Link key={s.address} to={`/token/${s.address}`} className={cn("terminal-panel p-4 space-y-3 hover:border-primary/20 transition-colors", s.label === "HIGH SIGNAL" && "border-terminal-green/20")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="text-sm font-mono font-bold text-foreground">{s.symbol}</span>
                  <StatusChip variant={s.label === "HIGH SIGNAL" ? "success" : s.label === "MEDIUM" ? "info" : "muted"}>{s.label}</StatusChip>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">Score {s.score}</span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {s.factors.slice(0, 4).map(f => (
                  <span key={f} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/5 text-primary/80">{f}</span>
                ))}
              </div>
              <ScoreMeter value={s.score} label="SIGNAL STRENGTH" size="md" />
              {s.sniperType && <StatusChip variant="info">{s.sniperType === "sniper" ? "SNIPER DETECTED" : "EARLY ACCUMULATION"}</StatusChip>}
              {s.whaleCount > 0 && <StatusChip variant="success">WHALE ×{s.whaleCount}</StatusChip>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
