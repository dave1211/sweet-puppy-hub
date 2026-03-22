import { useState } from "react";
import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { ScoreMeter } from "@/components/shared/ScoreMeter";
import { cn } from "@/lib/utils";
import { Crosshair, Play, Pause, Shield, Zap, AlertTriangle, Settings, Eye } from "lucide-react";

const STRATEGIES = [
  { id: "ms", name: "Momentum Sniper", status: "active", trigger: "Volume spike 5x + buy pressure > 3:1", conditions: "Liq > $200K, Age > 10m", risk: "Max risk 40, max exposure 2 SOL", activations: 12, icon: Zap },
  { id: "fl", name: "Fresh Launch Sniper", status: "active", trigger: "New pair < 5m, liq locked, contract verified", conditions: "Holders > 50, dev wallet < 10%", risk: "Max risk 50, max exposure 1 SOL", activations: 8, icon: Crosshair },
  { id: "wf", name: "Whale Follow", status: "paused", trigger: "High-trust wallet buys > 10 SOL", conditions: "Token risk < 35, signal > 70", risk: "Max risk 35, max exposure 3 SOL", activations: 5, icon: Eye },
  { id: "be", name: "Breakout Entry", status: "active", trigger: "Resistance break with volume confirmation", conditions: "RSI < 80, trend positive", risk: "Max risk 30, max exposure 2 SOL", activations: 15, icon: Play },
  { id: "sm", name: "Safe Mode Entry", status: "draft", trigger: "Signal > 85, risk < 15, liq > $1M", conditions: "Holders > 5000, age > 7d", risk: "Max risk 15, max exposure 5 SOL", activations: 0, icon: Shield },
];

const OPPORTUNITIES = [
  { token: "ALPHA", readiness: 92, trigger: "Whale accumulation + volume spike", riskFlags: ["New pair"], confidence: 88, action: "BUY 0.5 SOL" },
  { token: "NEON", readiness: 78, trigger: "Fresh launch, liq locked", riskFlags: ["Low holders", "High volatility"], confidence: 72, action: "WATCH" },
  { token: "GIGA", readiness: 85, trigger: "Breakout forming at $0.075", riskFlags: [], confidence: 81, action: "BUY 1.0 SOL" },
];

export default function SniperModePage() {
  const [simMode, setSimMode] = useState(true);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-mono font-bold text-foreground">SNIPER MODE</h1>
          <p className="text-xs font-mono text-muted-foreground">Strategy configuration & monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSimMode(!simMode)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-mono border transition-colors", simMode ? "bg-terminal-amber/10 text-terminal-amber border-terminal-amber/30" : "bg-terminal-green/10 text-terminal-green border-terminal-green/30")}>
            {simMode ? <><AlertTriangle className="h-3 w-3" /> SIMULATION</> : <><Zap className="h-3 w-3" /> LIVE</>}
          </button>
        </div>
      </div>

      {/* Status panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="terminal-panel p-3 text-center">
          <p className="text-[9px] font-mono text-muted-foreground uppercase">Active Strategies</p>
          <p className="text-xl font-mono font-bold text-primary mt-1">{STRATEGIES.filter(s => s.status === "active").length}</p>
        </div>
        <div className="terminal-panel p-3 text-center">
          <p className="text-[9px] font-mono text-muted-foreground uppercase">Total Activations</p>
          <p className="text-xl font-mono font-bold text-foreground mt-1">{STRATEGIES.reduce((s, st) => s + st.activations, 0)}</p>
        </div>
        <div className="terminal-panel p-3 text-center">
          <p className="text-[9px] font-mono text-muted-foreground uppercase">Opportunities</p>
          <p className="text-xl font-mono font-bold text-terminal-green mt-1">{OPPORTUNITIES.length}</p>
        </div>
        <div className="terminal-panel p-3 text-center">
          <p className="text-[9px] font-mono text-muted-foreground uppercase">Mode</p>
          <p className={cn("text-xl font-mono font-bold mt-1", simMode ? "text-terminal-amber" : "text-terminal-green")}>{simMode ? "SIM" : "LIVE"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Strategy cards */}
        <div className="lg:col-span-7 space-y-3">
          <h2 className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider">Strategy Cards</h2>
          {STRATEGIES.map(s => (
            <div key={s.id} className={cn("terminal-panel p-4 space-y-3", s.status === "active" && "border-primary/20")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <s.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-mono font-bold text-foreground">{s.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusChip variant={s.status === "active" ? "success" : s.status === "paused" ? "warning" : "muted"} dot>
                    {s.status.toUpperCase()}
                  </StatusChip>
                  <button className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-[11px] font-mono text-muted-foreground">
                <p><span className="text-foreground/60">TRIGGER:</span> {s.trigger}</p>
                <p><span className="text-foreground/60">CONDITIONS:</span> {s.conditions}</p>
                <p><span className="text-foreground/60">RISK:</span> {s.risk}</p>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-muted-foreground">Recent activations: <span className="text-foreground">{s.activations}</span></span>
                <div className="flex gap-1">
                  <button className="px-2 py-1 rounded bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                    {s.status === "active" ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Opportunities */}
        <div className="lg:col-span-5">
          <PanelShell title="Sniper Opportunities" subtitle="Live targets">
            <div className="space-y-3">
              {OPPORTUNITIES.map((o, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono font-bold text-foreground">{o.token}</span>
                    <StatusChip variant={o.readiness >= 85 ? "success" : "info"}>Ready {o.readiness}%</StatusChip>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{o.trigger}</p>
                  {o.riskFlags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {o.riskFlags.map(f => <StatusChip key={f} variant="warning">{f}</StatusChip>)}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <ScoreMeter value={o.confidence} label="Conf" />
                    <button className="px-3 py-1 rounded bg-primary/10 text-primary text-[10px] font-mono hover:bg-primary/20 transition-colors">
                      {o.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </PanelShell>
        </div>
      </div>
    </div>
  );
}
