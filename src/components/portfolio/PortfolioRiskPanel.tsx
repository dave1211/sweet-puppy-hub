import { ShieldAlert, TrendingDown, AlertTriangle, Info, Wallet, BarChart3 } from "lucide-react";
import { usePortfolioRisk } from "@/hooks/usePortfolioRisk";
import type { PortfolioRiskLevel } from "@/services/portfolioRiskService";

const RISK_COLORS: Record<PortfolioRiskLevel, string> = {
  low: "text-terminal-green",
  moderate: "text-terminal-amber",
  elevated: "text-terminal-red/80",
  high: "text-terminal-red",
};

const RISK_BG: Record<PortfolioRiskLevel, string> = {
  low: "bg-terminal-green/10 border-terminal-green/20",
  moderate: "bg-terminal-amber/10 border-terminal-amber/20",
  elevated: "bg-terminal-red/10 border-terminal-red/20",
  high: "bg-terminal-red/15 border-terminal-red/30",
};

function ScoreBar({ label, score, invert }: { label: string; score: number; invert?: boolean }) {
  const displayScore = invert ? 100 - score : score;
  const color = displayScore >= 70 ? "bg-terminal-green" : displayScore >= 40 ? "bg-terminal-amber" : "bg-terminal-red";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[9px] font-mono">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground/70 tabular-nums">{score}/100</span>
      </div>
      <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export function PortfolioRiskPanel() {
  const { risk, isLoading } = usePortfolioRisk();

  if (isLoading) {
    return (
      <div className="terminal-panel p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <ShieldAlert className="h-3 w-3 text-primary/60" />
          <span className="terminal-panel-title">Portfolio Risk</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-3 bg-muted/20 rounded animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!risk) {
    return (
      <div className="terminal-panel p-6 text-center">
        <Wallet className="h-6 w-6 text-muted-foreground/15 mx-auto mb-2" />
        <p className="text-[9px] font-mono text-muted-foreground/40">Connect wallet to view portfolio risk</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Health summary */}
      <div className={`terminal-panel p-4 border ${RISK_BG[risk.overallPortfolioRisk]}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="h-3 w-3 text-primary/60" />
            <span className="terminal-panel-title">Portfolio Risk</span>
          </div>
          <span className={`text-[10px] font-mono font-bold uppercase ${RISK_COLORS[risk.overallPortfolioRisk]}`}>
            {risk.overallPortfolioRisk}
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-lg font-mono font-bold text-foreground tabular-nums">
            ${risk.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
          <span className="text-[8px] font-mono text-muted-foreground/50 uppercase">
            {risk.confidence} confidence
          </span>
        </div>

        {risk.confidence !== "high" && (
          <p className="text-[8px] font-mono text-terminal-amber/70 mt-1">
            ⚠ Some token prices unavailable — total may be underestimated
          </p>
        )}
      </div>

      {/* Score bars */}
      <div className="terminal-panel p-4 space-y-3">
        <div className="flex items-center gap-1.5 mb-1">
          <BarChart3 className="h-3 w-3 text-primary/60" />
          <span className="terminal-panel-title">Risk Scores</span>
        </div>
        <ScoreBar label="Concentration" score={risk.concentrationScore} />
        <ScoreBar label="Liquidity Risk" score={risk.liquidityRiskScore} />
        <ScoreBar label="High-Risk Exposure" score={risk.highRiskExposureScore} />
        <ScoreBar label="Wallet Concentration" score={risk.walletConcentrationScore} />
        <ScoreBar label="Diversification" score={risk.diversificationScore} invert />
      </div>

      {/* Top assets allocation */}
      {risk.topAssets.length > 0 && (
        <div className="terminal-panel p-4">
          <span className="terminal-panel-title text-[9px]">Top Holdings</span>
          <div className="mt-2 space-y-1">
            {risk.topAssets.map(a => (
              <div key={a.symbol} className="flex justify-between items-center text-[9px] font-mono">
                <span className="text-foreground/70">{a.symbol}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground tabular-nums">${a.valueUSD.toFixed(2)}</span>
                  <span className="text-foreground/50 tabular-nums w-12 text-right">{a.pct.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Stablecoin ratio */}
          <div className="mt-2 pt-2 border-t border-border/20 flex justify-between text-[8px] font-mono text-muted-foreground/60">
            <span>Stablecoin allocation</span>
            <span className="tabular-nums">{(risk.stablecoinRatio * 100).toFixed(1)}%</span>
          </div>
        </div>
      )}

      {/* Chain allocation */}
      {Object.keys(risk.chainAllocation).length > 0 && (
        <div className="terminal-panel p-4">
          <span className="terminal-panel-title text-[9px]">Chain Allocation</span>
          <div className="mt-2 space-y-1">
            {Object.entries(risk.chainAllocation).map(([chain, data]) => (
              <div key={chain} className="flex justify-between items-center text-[9px] font-mono">
                <span className="text-foreground/70 capitalize">{chain}</span>
                <span className="text-muted-foreground tabular-nums">{data.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risks & recommendations */}
      {risk.topRisks.length > 0 && (
        <div className="terminal-panel p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="h-3 w-3 text-terminal-amber/60" />
            <span className="terminal-panel-title text-[9px]">Top Risks</span>
          </div>
          <div className="space-y-1">
            {risk.topRisks.map((r, i) => (
              <p key={i} className="text-[8px] font-mono text-terminal-red/80">• {r}</p>
            ))}
          </div>
        </div>
      )}

      {risk.recommendations.length > 0 && (
        <div className="terminal-panel p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Info className="h-3 w-3 text-terminal-cyan/60" />
            <span className="terminal-panel-title text-[9px]">Recommendations</span>
          </div>
          <div className="space-y-1">
            {risk.recommendations.map((r, i) => (
              <p key={i} className="text-[8px] font-mono text-muted-foreground/70">→ {r}</p>
            ))}
          </div>
        </div>
      )}

      {/* Evidence */}
      <div className="terminal-panel p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <TrendingDown className="h-2.5 w-2.5 text-muted-foreground/40" />
          <span className="text-[7px] font-mono text-muted-foreground/40 uppercase">Evidence</span>
        </div>
        <div className="space-y-0.5">
          {risk.evidence.map((e, i) => (
            <p key={i} className="text-[7px] font-mono text-muted-foreground/30">{e}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
