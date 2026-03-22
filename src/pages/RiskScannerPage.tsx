import { useState } from "react";
import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { formatVolume } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { ShieldAlert, AlertTriangle, Loader2, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useUnifiedSignals } from "@/hooks/useUnifiedSignals";
import { assessAdvancedRisk, type RugRiskAssessment, type RiskTier } from "@/lib/advancedRisk";
import { AdvancedRiskPanel } from "@/components/terminal/AdvancedRiskPanel";
import { RiskBadge } from "@/components/risk/RiskBadge";

const TIER_MAP: Record<RiskTier, "low" | "medium" | "high" | "critical"> = {
  low: "low", medium: "medium", high: "high", critical: "critical",
};

export default function RiskScannerPage() {
  const { tokens, isLoading } = useUnifiedSignals();
  const [selectedAddr, setSelectedAddr] = useState<string | null>(null);

  const assessed = tokens
    .map(t => ({
      ...t,
      risk: assessAdvancedRisk({
        liquidity: t.liquidity,
        volume24h: t.volume24h,
        change24h: t.change24h,
        pairCreatedAt: t.pairCreatedAt,
        marketCap: t.marketCap,
      }),
    }))
    .sort((a, b) => b.risk.overallScore - a.risk.overallScore);

  const flagged = assessed.filter(t => t.risk.overallScore >= 25);
  const selected = assessed.find(t => t.address === selectedAddr) ?? flagged[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-mono font-bold text-foreground">RISK SCANNER</h1>
          <p className="text-xs font-mono text-muted-foreground">Advanced token safety & risk evaluation engine</p>
        </div>
        <StatusChip variant="warning" dot>SCANNING</StatusChip>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-xs font-mono text-muted-foreground">Scanning tokens…</span>
        </div>
      ) : flagged.length === 0 ? (
        <div className="text-center py-16">
          <ShieldAlert className="h-8 w-8 text-terminal-green mx-auto mb-2" />
          <p className="text-sm font-mono text-terminal-green">All clear — no risk flags detected</p>
          <p className="text-xs text-muted-foreground mt-1">Risk scanner is monitoring {assessed.length} tokens</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Token list */}
          <div className="lg:col-span-7">
            <PanelShell title="Flagged Tokens" subtitle={`${flagged.length} tokens with risk indicators`} noPad>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left p-3">TOKEN</th>
                      <th className="text-center p-3">SCORE</th>
                      <th className="text-center p-3">LEVEL</th>
                      <th className="text-center p-3 hidden md:table-cell">WARNINGS</th>
                      <th className="text-right p-3 hidden md:table-cell">LIQ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flagged.map(t => (
                      <tr
                        key={t.address}
                        onClick={() => setSelectedAddr(t.address)}
                        className={cn(
                          "border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors",
                          selected?.address === t.address && "bg-primary/5"
                        )}
                      >
                        <td className="p-3">
                          <Link to={`/token/${t.address}`} className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <div className={cn(
                              "h-6 w-6 rounded-full flex items-center justify-center text-[8px] font-bold",
                              t.risk.tier === "critical" ? "bg-destructive/15 text-destructive" :
                              t.risk.tier === "high" ? "bg-terminal-red/15 text-terminal-red" :
                              "bg-terminal-amber/15 text-terminal-amber"
                            )}>
                              {t.symbol.slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{t.symbol}</p>
                              <p className="text-[9px] text-muted-foreground">{t.name}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="p-3 text-center">
                          <span className={cn(
                            "font-bold tabular-nums",
                            t.risk.overallScore >= 75 ? "text-destructive" :
                            t.risk.overallScore >= 50 ? "text-terminal-red" :
                            "text-terminal-amber"
                          )}>
                            {t.risk.overallScore}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <RiskBadge level={TIER_MAP[t.risk.tier]} />
                        </td>
                        <td className="p-3 text-center hidden md:table-cell">
                          <span className="text-muted-foreground">{t.risk.warnings.length}</span>
                        </td>
                        <td className="p-3 text-right hidden md:table-cell text-muted-foreground">
                          {formatVolume(t.liquidity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PanelShell>
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-5">
            {selected && (
              <AdvancedRiskPanel assessment={selected.risk} tokenSymbol={selected.symbol} />
            )}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="px-4 py-2 rounded border border-border/30 bg-muted/5 text-center">
        <p className="text-[9px] font-mono text-muted-foreground/40">
          This platform provides analysis only and does not guarantee safety. All trading decisions are your responsibility.
        </p>
      </div>
    </div>
  );
}
