import { useState } from "react";
import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { ScoreMeter } from "@/components/shared/ScoreMeter";
import { MiniChart } from "@/components/shared/MiniChart";
import { cn } from "@/lib/utils";
import { Crosshair, Shield, Zap, AlertTriangle, Loader2, Trophy, TrendingDown, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useUnifiedSignals } from "@/hooks/useUnifiedSignals";
import { useNewLaunches } from "@/hooks/useNewLaunches";
import { useSnipeHistory } from "@/hooks/useSnipeHistory";
import { pairAge, formatPrice } from "@/data/mockData";

export default function SniperModePage() {
  const [simMode, setSimMode] = useState(true);
  const { tokens: signals, isLoading } = useUnifiedSignals();
  const { data: launches } = useNewLaunches();
  const { history, wins, losses, active } = useSnipeHistory();

  const opportunities = signals
    .filter(t => t.score >= 60 && t.pairCreatedAt > Date.now() - 6 * 60 * 60 * 1000)
    .slice(0, 6);

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-base sm:text-lg font-mono font-bold text-foreground">SNIPER MODE</h1>
          <p className="text-[10px] sm:text-xs font-mono text-muted-foreground">Strategy configuration & opportunity monitoring</p>
        </div>
        <button onClick={() => setSimMode(!simMode)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-mono border transition-colors self-start sm:self-auto", simMode ? "bg-terminal-amber/10 text-terminal-amber border-terminal-amber/30" : "bg-terminal-green/10 text-terminal-green border-terminal-green/30")}>
          {simMode ? <><AlertTriangle className="h-3 w-3" /> SIMULATION</> : <><Zap className="h-3 w-3" /> LIVE</>}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
        <div className="terminal-panel p-3 text-center">
          <p className="text-[9px] font-mono text-muted-foreground uppercase">Total Signals</p>
          <p className="text-lg sm:text-xl font-mono font-bold text-primary mt-1">{signals.length}</p>
        </div>
        <div className="terminal-panel p-3 text-center">
          <p className="text-[9px] font-mono text-muted-foreground uppercase">Opportunities</p>
          <p className="text-lg sm:text-xl font-mono font-bold text-foreground mt-1">{opportunities.length}</p>
        </div>
        <div className="terminal-panel p-3 text-center">
          <Trophy className="h-3.5 w-3.5 text-terminal-green mx-auto mb-0.5" />
          <p className="text-[9px] font-mono text-muted-foreground uppercase">Wins</p>
          <p className="text-lg sm:text-xl font-mono font-bold text-terminal-green mt-1">{wins.length}</p>
        </div>
        <div className="terminal-panel p-3 text-center">
          <TrendingDown className="h-3.5 w-3.5 text-destructive mx-auto mb-0.5" />
          <p className="text-[9px] font-mono text-muted-foreground uppercase">Losses</p>
          <p className="text-lg sm:text-xl font-mono font-bold text-destructive mt-1">{losses.length}</p>
        </div>
        <div className="terminal-panel p-3 text-center">
          <Clock className="h-3.5 w-3.5 text-terminal-amber mx-auto mb-0.5" />
          <p className="text-[9px] font-mono text-muted-foreground uppercase">Active</p>
          <p className="text-lg sm:text-xl font-mono font-bold text-terminal-amber mt-1">{active.length}</p>
        </div>
        <div className="terminal-panel p-3 text-center">
          <p className="text-[9px] font-mono text-muted-foreground uppercase">Mode</p>
          <p className={cn("text-lg sm:text-xl font-mono font-bold mt-1", simMode ? "text-terminal-amber" : "text-terminal-green")}>{simMode ? "SIM" : "LIVE"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        <div className="lg:col-span-7 space-y-3 sm:space-y-4">
          <PanelShell title="Sniper Opportunities" subtitle="Fresh high-signal tokens">
            {isLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : opportunities.length === 0 ? (
              <div className="py-8 text-center">
                <Crosshair className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No sniper opportunities right now. Fresh high-signal tokens will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {opportunities.map(o => (
                  <Link key={o.address} to={`/token/${o.address}`} className="block p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2 hover:border-primary/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-mono font-bold text-foreground">{o.symbol}</span>
                        <StatusChip variant="success">{o.label}</StatusChip>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{pairAge(o.pairCreatedAt)} old</span>
                    </div>
                    <MiniChart baseValue={o.price} change={o.change24h} height={48} />
                    <div className="flex gap-1 flex-wrap">
                      {o.factors.slice(0, 3).map(f => <span key={f} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/5 text-primary/80">{f}</span>)}
                    </div>
                    <ScoreMeter value={o.score} label="Score" />
                  </Link>
                ))}
              </div>
            )}
          </PanelShell>
        </div>

        <div className="lg:col-span-5 space-y-3 sm:space-y-4">
          {/* Snipe History panel */}
          <PanelShell title="Snipe History" subtitle={`${history.length} total`}>
            {history.length === 0 ? (
              <div className="py-8 text-center">
                <Shield className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No snipes recorded yet.</p>
                <p className="text-[10px] text-muted-foreground mt-1">Execute a snipe from an opportunity above to start tracking.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.slice(0, 8).map(s => (
                  <Link key={s.id} to={`/token/${s.token_address}`} className="flex items-center justify-between py-2 px-2 rounded hover:bg-muted/30 transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-mono font-medium text-foreground truncate">{s.token_symbol}</p>
                        <span className="text-[9px] text-muted-foreground">{s.token_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                        <span>{formatPrice(s.entry_price)} entry</span>
                        <span>·</span>
                        <span>{s.amount_sol} SOL</span>
                        <span>·</span>
                        <span>Score {s.score}</span>
                      </div>
                    </div>
                    <StatusChip variant={(s.pnl_percent ?? 0) > 0 ? "success" : (s.pnl_percent ?? 0) < 0 ? "danger" : "warning"}>
                      {s.pnl_percent !== null ? `${s.pnl_percent > 0 ? "+" : ""}${s.pnl_percent.toFixed(1)}%` : s.state}
                    </StatusChip>
                  </Link>
                ))}
              </div>
            )}
          </PanelShell>

          <PanelShell title="Recent Launches" subtitle="Latest from feeds">
            {(launches ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">Loading launches…</p>
            ) : (
              <div className="space-y-2">
                {(launches ?? []).slice(0, 6).map(l => (
                  <Link key={l.address} to={`/token/${l.address}`} className="flex items-center justify-between py-2 px-2 rounded hover:bg-muted/30 transition-colors">
                    <div className="min-w-0">
                      <p className="text-xs font-mono font-medium text-foreground truncate">{l.symbol}</p>
                      <p className="text-[10px] text-muted-foreground">{l.dexId} · {pairAge(l.pairCreatedAt)}</p>
                    </div>
                    <StatusChip variant="info">NEW</StatusChip>
                  </Link>
                ))}
              </div>
            )}
          </PanelShell>
        </div>
      </div>
    </div>
  );
}
