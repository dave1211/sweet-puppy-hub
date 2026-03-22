import { useState } from "react";
import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { ScoreMeter } from "@/components/shared/ScoreMeter";
import { mockTokens } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { ShieldAlert, Search, AlertTriangle, Shield, Droplets, Users, Code, TrendingDown } from "lucide-react";

const RISK_CATEGORIES = [
  { label: "Low Liquidity", icon: Droplets, severity: "high" },
  { label: "Liq Unlocked", icon: AlertTriangle, severity: "critical" },
  { label: "Extreme Volatility", icon: TrendingDown, severity: "medium" },
  { label: "Dev Concentration", icon: Code, severity: "high" },
  { label: "Holder Concentration", icon: Users, severity: "medium" },
  { label: "Suspicious Contract", icon: ShieldAlert, severity: "critical" },
];

const riskyTokens = mockTokens.filter(t => t.riskScore > 30).sort((a, b) => b.riskScore - a.riskScore);

export default function RiskScannerPage() {
  const [search, setSearch] = useState("");
  const [selectedToken, setSelectedToken] = useState(riskyTokens[0]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-mono font-bold text-foreground">RISK SCANNER</h1>
          <p className="text-xs font-mono text-muted-foreground">Token safety & risk evaluation engine</p>
        </div>
        <StatusChip variant="warning" dot>SCANNING</StatusChip>
      </div>

      {/* Risk category badges */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {RISK_CATEGORIES.map(c => (
          <div key={c.label} className={cn("terminal-panel p-3 flex items-center gap-2",
            c.severity === "critical" ? "border-destructive/20" : c.severity === "high" ? "border-terminal-amber/20" : "border-border"
          )}>
            <c.icon className={cn("h-4 w-4", c.severity === "critical" ? "text-destructive" : c.severity === "high" ? "text-terminal-amber" : "text-muted-foreground")} />
            <span className="text-[10px] font-mono text-foreground">{c.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Risk table */}
        <div className="lg:col-span-7">
          <PanelShell title="Risk Table" subtitle="Tokens sorted by risk score" noPad>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left p-3">TOKEN</th>
                    <th className="text-center p-3">RISK</th>
                    <th className="text-center p-3">SAFETY</th>
                    <th className="text-right p-3 hidden md:table-cell">LIQ</th>
                    <th className="text-center p-3 hidden md:table-cell">HOLDERS</th>
                    <th className="text-center p-3">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {riskyTokens.map(t => (
                    <tr key={t.id} onClick={() => setSelectedToken(t)} className={cn("border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors", selectedToken?.id === t.id && "bg-primary/5")}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-destructive/10 flex items-center justify-center text-[8px] font-bold text-destructive">{t.symbol.slice(0, 2)}</div>
                          <div>
                            <p className="font-medium text-foreground">{t.symbol}</p>
                            <p className="text-[9px] text-muted-foreground">{t.chain}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <StatusChip variant={t.riskScore >= 70 ? "danger" : t.riskScore >= 40 ? "warning" : "muted"}>{t.riskScore}</StatusChip>
                      </td>
                      <td className="p-3"><ScoreMeter value={100 - t.riskScore} size="sm" /></td>
                      <td className="p-3 text-right hidden md:table-cell text-muted-foreground">${(t.liquidity / 1_000_000).toFixed(1)}M</td>
                      <td className="p-3 text-center hidden md:table-cell text-muted-foreground">{(t.holders / 1000).toFixed(1)}K</td>
                      <td className="p-3 text-center">
                        <StatusChip variant={t.status === "rug_risk" ? "danger" : t.status === "warning" ? "warning" : "muted"}>{t.status.replace("_", " ").toUpperCase()}</StatusChip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PanelShell>
        </div>

        {/* Risk breakdown */}
        <div className="lg:col-span-5">
          {selectedToken && (
            <PanelShell title="Risk Breakdown" subtitle={selectedToken.symbol}>
              <div className="space-y-4">
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <p className="text-3xl font-mono font-bold text-destructive">{selectedToken.riskScore}</p>
                  <p className="text-[10px] font-mono text-muted-foreground mt-1">OVERALL RISK SCORE</p>
                </div>

                <div className="space-y-2">
                  <ScoreMeter value={selectedToken.liquidity < 1_000_000 ? 75 : 20} label="LIQUIDITY RISK" size="md" />
                  <ScoreMeter value={selectedToken.holders < 5000 ? 65 : 15} label="HOLDER RISK" size="md" />
                  <ScoreMeter value={Math.min(selectedToken.riskScore + 10, 100)} label="DEV RISK" size="md" />
                  <ScoreMeter value={Math.abs(selectedToken.change24h) > 50 ? 70 : 25} label="BEHAVIOR RISK" size="md" />
                  <ScoreMeter value={selectedToken.change1h < -20 ? 80 : 20} label="MOMENTUM TRAP" size="md" />
                  <ScoreMeter value={selectedToken.riskScore > 70 ? 85 : 30} label="CONTRACT RISK" size="md" />
                </div>

                <div className="p-3 rounded bg-destructive/5 border border-destructive/10">
                  <p className="text-[10px] font-mono text-destructive uppercase tracking-wider mb-1">Risk Notes</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {selectedToken.riskScore >= 70
                      ? "Critical risk level. Multiple red flags detected. Exercise extreme caution."
                      : selectedToken.riskScore >= 40
                      ? "Moderate risk. Some concerns identified. Proceed with limited exposure."
                      : "Acceptable risk level. Standard precautions recommended."}
                  </p>
                </div>
              </div>
            </PanelShell>
          )}
        </div>
      </div>
    </div>
  );
}
