// Risk Panel — Rug risk visualization
import { Shield, AlertTriangle, XOctagon } from "lucide-react";
import { RISK_COLORS, type RiskBreakdown as RiskBreakdownType, type RiskCategory } from "../types";

const RISK_CATEGORIES: { key: keyof Pick<RiskBreakdownType, "liquidity" | "holderConcentration" | "deployer" | "tradePattern" | "tokenStructure" | "behavioral">; label: string; max: number }[] = [
  { key: "liquidity", label: "LIQUIDITY", max: 20 },
  { key: "holderConcentration", label: "HOLDERS", max: 20 },
  { key: "deployer", label: "DEPLOYER", max: 20 },
  { key: "tradePattern", label: "TRADING", max: 15 },
  { key: "tokenStructure", label: "STRUCTURE", max: 10 },
  { key: "behavioral", label: "BEHAVIOR", max: 15 },
];

const SEVERITY_COLORS = {
  warning: "text-terminal-amber bg-terminal-amber/10 border-terminal-amber/30",
  danger: "text-terminal-red bg-terminal-red/10 border-terminal-red/30",
  critical: "text-terminal-red bg-terminal-red/20 border-terminal-red/50",
};

export function RiskPanel({ risk }: { risk: RiskBreakdownType }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
          <Shield className="h-3 w-3" /> RUG RISK
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`text-lg font-mono font-bold ${RISK_COLORS[risk.band]}`}>{risk.total}</span>
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
            risk.band === "EXTREME" ? "bg-terminal-red/20 text-terminal-red animate-pulse" :
            risk.band === "HIGH" ? "bg-terminal-red/10 text-terminal-red" :
            risk.band === "MODERATE" ? "bg-terminal-amber/10 text-terminal-amber" :
            "bg-terminal-green/10 text-terminal-green"
          }`}>{risk.band}</span>
        </div>
      </div>

      {risk.blockRecommended && (
        <div className="flex items-center gap-1.5 bg-terminal-red/15 border border-terminal-red/30 rounded px-2 py-1.5">
          <XOctagon className="h-3.5 w-3.5 text-terminal-red shrink-0" />
          <span className="text-[9px] font-mono text-terminal-red font-bold">BLOCK RECOMMENDED — Extreme risk detected</span>
        </div>
      )}

      <div className="space-y-1.5">
        {RISK_CATEGORIES.map(({ key, label, max }) => {
          const val = risk[key];
          const pct = (val / max) * 100;
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-[8px] font-mono text-muted-foreground w-16 shrink-0">{label}</span>
              <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    pct > 70 ? "bg-terminal-red" : pct > 40 ? "bg-terminal-amber" : "bg-terminal-green"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[8px] font-mono text-foreground w-8 text-right">{val}/{max}</span>
            </div>
          );
        })}
      </div>

      {risk.flags.length > 0 && (
        <div className="space-y-1 mt-2 max-h-28 overflow-y-auto">
          {risk.flags.map((flag) => (
            <div key={flag.id} className={`flex items-start gap-1.5 rounded px-2 py-1 border text-[9px] font-mono ${SEVERITY_COLORS[flag.severity]}`}>
              <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">{flag.label}</div>
                <div className="opacity-80">{flag.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
