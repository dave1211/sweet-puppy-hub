import { AlertTriangle, ShieldCheck, ShieldAlert, TrendingUp, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PositionSizingResult, SizingSeverity } from "@/services/positionSizingService";
import { cn } from "@/lib/utils";

const severityConfig: Record<SizingSeverity, { icon: typeof ShieldCheck; color: string; label: string }> = {
  ok: { icon: ShieldCheck, color: "text-primary", label: "OK" },
  caution: { icon: Info, color: "text-terminal-yellow", label: "CAUTION" },
  warning: { icon: AlertTriangle, color: "text-terminal-amber", label: "WARNING" },
  critical: { icon: ShieldAlert, color: "text-destructive", label: "CRITICAL" },
};

interface Props {
  result: PositionSizingResult;
  compact?: boolean;
}

export function PositionSizeGuide({ result, compact }: Props) {
  const cfg = severityConfig[result.severity];
  const Icon = cfg.icon;

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-mono border",
        result.severity === "ok" && "border-primary/20 bg-primary/5",
        result.severity === "caution" && "border-terminal-yellow/20 bg-terminal-yellow/5",
        result.severity === "warning" && "border-terminal-amber/20 bg-terminal-amber/5",
        result.severity === "critical" && "border-destructive/20 bg-destructive/5",
      )}>
        <Icon className={cn("h-3 w-3 shrink-0", cfg.color)} />
        <span className={cn("truncate", cfg.color)}>{result.recommendation}</span>
      </div>
    );
  }

  return (
    <div className="terminal-panel">
      <div className="terminal-panel-header">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3 w-3 text-muted-foreground/50" />
          <span className="terminal-panel-title">Position Sizing</span>
        </div>
        <Badge variant="outline" className={cn(
          "text-[7px] px-1.5 py-0 h-4 font-mono border-current",
          cfg.color,
        )}>
          {cfg.label}
        </Badge>
      </div>

      <div className="p-2.5 space-y-2">
        {/* Recommendation */}
        <div className={cn(
          "flex items-start gap-1.5 p-1.5 rounded text-[9px] font-mono border",
          result.severity === "ok" && "border-primary/20 bg-primary/5 text-primary",
          result.severity === "caution" && "border-terminal-yellow/20 bg-terminal-yellow/5 text-terminal-yellow",
          result.severity === "warning" && "border-terminal-amber/20 bg-terminal-amber/5 text-terminal-amber",
          result.severity === "critical" && "border-destructive/20 bg-destructive/5 text-destructive",
        )}>
          <Icon className="h-3 w-3 shrink-0 mt-0.5" />
          <span>{result.recommendation}</span>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] font-mono">
          <Metric label="Max suggested" value={`$${result.suggestedMaxUSD.toFixed(2)}`} />
          <Metric label="Trade % of portfolio" value={`${result.tradePctOfPortfolio.toFixed(1)}%`} />
          <Metric label="Post-trade token %" value={`${result.postTradeTokenPct.toFixed(1)}%`}
            warn={result.postTradeTokenPct > 25} />
          <Metric label="Top concentration" value={`${result.postTradeTopConcentrationPct.toFixed(1)}%`}
            warn={result.postTradeTopConcentrationPct > 40} />
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1">
          {result.slippageRisk && (
            <Badge variant="outline" className="text-[7px] px-1 py-0 h-4 font-mono border-terminal-amber/40 text-terminal-amber">
              SLIPPAGE RISK
            </Badge>
          )}
          {result.liquidityWarning && (
            <Badge variant="outline" className="text-[7px] px-1 py-0 h-4 font-mono border-destructive/40 text-destructive">
              LOW LIQUIDITY
            </Badge>
          )}
          <Badge variant="outline" className="text-[7px] px-1 py-0 h-4 font-mono border-muted-foreground/30 text-muted-foreground">
            CONFIDENCE: {result.confidence.toUpperCase()}
          </Badge>
        </div>

        {/* Warnings */}
        {result.warnings.length > 0 && (
          <div className="space-y-0.5">
            {result.warnings.map((w, i) => (
              <p key={i} className="text-[8px] font-mono text-terminal-amber/80 leading-tight">
                ⚠ {w}
              </p>
            ))}
          </div>
        )}

        <p className="text-[7px] font-mono text-muted-foreground/40 italic">
          Guidance only — not financial advice. Final decision is yours.
        </p>
      </div>
    </div>
  );
}

function Metric({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <>
      <span className="text-muted-foreground/50">{label}</span>
      <span className={cn("text-right tabular-nums", warn ? "text-terminal-amber" : "text-foreground")}>
        {value}
      </span>
    </>
  );
}
