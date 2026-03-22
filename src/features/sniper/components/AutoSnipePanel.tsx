// Auto Snipe Mode — Config panel with on/off toggle
import { Bot, Zap, Shield, Settings2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useAutoSniperStore } from "../stores/autoSniperStore";

export function AutoSnipePanel() {
  const { config, setConfig, toggleEnabled } = useAutoSniperStore();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="bg-muted/20 border border-border rounded p-2 space-y-2">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Bot className="h-3.5 w-3.5 text-terminal-cyan" />
          <span className="text-[10px] font-mono font-bold text-foreground">AUTO SNIPE</span>
        </div>
        <button
          onClick={toggleEnabled}
          className={`px-2 py-1 rounded text-[9px] font-mono font-bold transition-colors ${
            config.enabled
              ? "bg-terminal-green/15 text-terminal-green border border-terminal-green/30 animate-pulse"
              : "bg-muted/30 text-muted-foreground border border-border"
          }`}
        >
          {config.enabled ? "● ACTIVE" : "○ OFF"}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-1 text-[8px] font-mono">
        <div className="bg-muted/30 rounded px-1.5 py-1">
          <span className="text-muted-foreground block">MIN SCORE</span>
          <span className="text-foreground font-bold">{config.minScore}</span>
        </div>
        <div className="bg-muted/30 rounded px-1.5 py-1">
          <span className="text-muted-foreground block">MAX RISK</span>
          <span className="text-foreground font-bold">{config.maxRisk}</span>
        </div>
        <div className="bg-muted/30 rounded px-1.5 py-1">
          <span className="text-muted-foreground block">SIZE</span>
          <span className="text-foreground font-bold">{config.amountSOL} SOL</span>
        </div>
      </div>

      {/* Settings Toggle */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground hover:text-foreground w-full transition-colors"
      >
        {showSettings ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        SETTINGS
      </button>

      {showSettings && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <div className="bg-muted/20 border border-border rounded px-2 py-1">
              <div className="text-[7px] font-mono text-muted-foreground">MIN SCORE</div>
              <input
                type="number"
                value={config.minScore}
                onChange={(e) => setConfig({ minScore: Number(e.target.value) || 0 })}
                className="w-full bg-transparent text-[10px] font-mono text-foreground focus:outline-none"
              />
            </div>
            <div className="bg-muted/20 border border-border rounded px-2 py-1">
              <div className="text-[7px] font-mono text-muted-foreground">MAX RISK</div>
              <input
                type="number"
                value={config.maxRisk}
                onChange={(e) => setConfig({ maxRisk: Number(e.target.value) || 0 })}
                className="w-full bg-transparent text-[10px] font-mono text-foreground focus:outline-none"
              />
            </div>
            <div className="bg-muted/20 border border-border rounded px-2 py-1">
              <div className="text-[7px] font-mono text-muted-foreground">AMOUNT (SOL)</div>
              <input
                type="number"
                step="0.01"
                value={config.amountSOL}
                onChange={(e) => setConfig({ amountSOL: Number(e.target.value) || 0.1 })}
                className="w-full bg-transparent text-[10px] font-mono text-foreground focus:outline-none"
              />
            </div>
            <div className="bg-muted/20 border border-border rounded px-2 py-1">
              <div className="text-[7px] font-mono text-muted-foreground">MAX CONCURRENT</div>
              <input
                type="number"
                value={config.maxConcurrent}
                onChange={(e) => setConfig({ maxConcurrent: Number(e.target.value) || 1 })}
                className="w-full bg-transparent text-[10px] font-mono text-foreground focus:outline-none"
              />
            </div>
          </div>
          <div className="text-[7px] font-mono text-muted-foreground/60 px-1">
            ⚠ Auto snipe will execute buys when tokens match your thresholds
          </div>
        </div>
      )}
    </div>
  );
}
