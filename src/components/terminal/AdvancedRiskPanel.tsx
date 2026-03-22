import { cn } from "@/lib/utils";
import { AlertTriangle, Shield, ShieldAlert, ShieldCheck, Info, Droplets, Users, Code, Activity, TrendingDown, Lock, Unlock, BarChart3, Gauge } from "lucide-react";
import { ScoreMeter } from "@/components/shared/ScoreMeter";
import type { RugRiskAssessment, RiskTier, RiskCategory, RiskWarningItem } from "@/lib/advancedRisk";

const TIER_CONFIG: Record<RiskTier, { icon: typeof Shield; color: string; bg: string; border: string; label: string }> = {
  low: { icon: ShieldCheck, color: "text-terminal-green", bg: "bg-terminal-green/10", border: "border-terminal-green/30", label: "LOW RISK" },
  medium: { icon: Info, color: "text-terminal-amber", bg: "bg-terminal-amber/10", border: "border-terminal-amber/30", label: "MEDIUM" },
  high: { icon: AlertTriangle, color: "text-terminal-red", bg: "bg-terminal-red/10", border: "border-terminal-red/30", label: "HIGH RISK" },
  critical: { icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", label: "CRITICAL" },
};

const CATEGORY_ICONS: Record<string, typeof Shield> = {
  "Liquidity Risk": Droplets,
  "Holder Risk": Users,
  "Dev Risk": Code,
  "Behaviour Risk": Activity,
  "Volatility Risk": TrendingDown,
};

function riskScoreColor(score: number) {
  if (score >= 75) return "text-destructive";
  if (score >= 50) return "text-terminal-red";
  if (score >= 25) return "text-terminal-amber";
  return "text-terminal-green";
}

interface AdvancedRiskPanelProps {
  assessment: RugRiskAssessment;
  tokenSymbol?: string;
}

export function AdvancedRiskPanel({ assessment, tokenSymbol }: AdvancedRiskPanelProps) {
  const tier = TIER_CONFIG[assessment.tier];
  const TierIcon = tier.icon;

  return (
    <div className="space-y-3">
      {/* Overall Score */}
      <div className="terminal-panel">
        <div className="terminal-panel-header">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-muted-foreground/50" />
            <span className="terminal-panel-title">Risk Analysis</span>
            {tokenSymbol && <span className="terminal-panel-subtitle ml-1">— {tokenSymbol}</span>}
          </div>
          <div className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border", tier.bg, tier.color, tier.border)}>
            <TierIcon className="h-2.5 w-2.5" />
            {tier.label}
          </div>
        </div>

        <div className="p-3">
          {/* Score Circle */}
          <div className="flex items-center gap-4 mb-3">
            <div className="relative h-16 w-16 shrink-0">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-muted" strokeWidth="2.5" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  className={cn("transition-all duration-700", assessment.overallScore >= 75 ? "stroke-destructive" : assessment.overallScore >= 50 ? "stroke-terminal-red" : assessment.overallScore >= 25 ? "stroke-terminal-amber" : "stroke-terminal-green")}
                  strokeWidth="2.5"
                  strokeDasharray={`${assessment.overallScore} ${100 - assessment.overallScore}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn("text-lg font-mono font-bold", riskScoreColor(assessment.overallScore))}>
                  {assessment.overallScore}
                </span>
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              {/* Buy/Sell Pressure */}
              <div>
                <div className="flex justify-between text-[8px] font-mono text-muted-foreground mb-0.5">
                  <span>BUY {assessment.buySellPressure.buyPct.toFixed(0)}%</span>
                  <span>SELL {assessment.buySellPressure.sellPct.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden flex">
                  <div className="h-full bg-terminal-green" style={{ width: `${assessment.buySellPressure.buyPct}%` }} />
                  <div className="h-full bg-destructive" style={{ width: `${assessment.buySellPressure.sellPct}%` }} />
                </div>
              </div>
              {/* Indicators */}
              <div className="flex gap-2">
                <div className="flex items-center gap-1 text-[8px] font-mono text-muted-foreground">
                  <BarChart3 className="h-2.5 w-2.5" />
                  Vol Auth: <span className={cn("font-bold", assessment.volumeAuthenticity >= 60 ? "text-terminal-green" : "text-terminal-amber")}>{assessment.volumeAuthenticity}%</span>
                </div>
                <div className="flex items-center gap-1 text-[8px] font-mono text-muted-foreground">
                  <Gauge className="h-2.5 w-2.5" />
                  Trap: <span className={cn("font-bold", assessment.momentumTrapScore >= 50 ? "text-destructive" : "text-terminal-green")}>{assessment.momentumTrapScore}%</span>
                </div>
              </div>
              {/* LP Lock */}
              <div className="flex items-center gap-1 text-[8px] font-mono">
                {assessment.lpLocked === true ? (
                  <><Lock className="h-2.5 w-2.5 text-terminal-green" /><span className="text-terminal-green">LP Locked</span></>
                ) : assessment.lpLocked === false ? (
                  <><Unlock className="h-2.5 w-2.5 text-destructive" /><span className="text-destructive">LP Unlocked</span></>
                ) : (
                  <><Unlock className="h-2.5 w-2.5 text-muted-foreground/40" /><span className="text-muted-foreground/40">LP Lock Unknown</span></>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Breakdown */}
      <div className="terminal-panel">
        <div className="terminal-panel-header">
          <span className="terminal-panel-title">Risk Breakdown</span>
        </div>
        <div className="p-3 space-y-2">
          {Object.values(assessment.categories).map((cat) => {
            const CatIcon = CATEGORY_ICONS[cat.label] ?? Shield;
            return (
              <div key={cat.label} className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <CatIcon className="h-3 w-3 text-muted-foreground/40" />
                  <span className="text-[9px] font-mono text-muted-foreground flex-1">{cat.label}</span>
                  <span className={cn("text-[9px] font-mono font-bold", riskScoreColor(cat.score))}>{cat.score}</span>
                </div>
                <div className="h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", cat.score >= 75 ? "bg-destructive" : cat.score >= 50 ? "bg-terminal-red" : cat.score >= 25 ? "bg-terminal-amber" : "bg-terminal-green")}
                    style={{ width: `${cat.score}%` }}
                  />
                </div>
                <p className="text-[7px] font-mono text-muted-foreground/40">{cat.details}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Warnings */}
      {assessment.warnings.length > 0 && (
        <div className="terminal-panel">
          <div className="terminal-panel-header">
            <span className="terminal-panel-title">Warnings</span>
            <span className="terminal-panel-subtitle">{assessment.warnings.length} active</span>
          </div>
          <div className="p-2 space-y-1">
            {assessment.warnings.map((w) => {
              const sevColor = w.severity === "critical" ? "text-destructive border-destructive/20 bg-destructive/5" : w.severity === "warning" ? "text-terminal-amber border-terminal-amber/20 bg-terminal-amber/5" : "text-terminal-blue border-terminal-blue/20 bg-terminal-blue/5";
              return (
                <div key={w.id} className={cn("flex items-start gap-1.5 px-2 py-1.5 rounded border", sevColor)}>
                  <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[9px] font-mono font-semibold">{w.label}</p>
                    <p className="text-[7px] font-mono opacity-70">{w.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="px-3 py-2 rounded border border-border/30 bg-muted/5">
        <p className="text-[7px] font-mono text-muted-foreground/40 text-center leading-relaxed">
          This platform provides analysis only and does not guarantee safety. Always conduct your own research before making any financial decisions.
        </p>
      </div>
    </div>
  );
}
