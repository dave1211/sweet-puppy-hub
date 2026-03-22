import { useState } from "react";
import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { ScoreMeter } from "@/components/shared/ScoreMeter";
import { formatVolume } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { ShieldAlert, AlertTriangle, Droplets, TrendingDown, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useUnifiedSignals, ScoredToken } from "@/hooks/useUnifiedSignals";
import { assessRug } from "@/hooks/useRugDetection";

export default function RiskScannerPage() {
  const { tokens, isLoading } = useUnifiedSignals();
  const [selectedAddr, setSelectedAddr] = useState<string | null>(null);

  const riskyTokens = tokens
    .map(t => ({ ...t, rug: assessRug({ liquidity: t.liquidity, volume24h: t.volume24h, change24h: t.change24h, pairCreatedAt: t.pairCreatedAt }) }))
    .filter(t => t.rug.flags.length > 0)
    .sort((a, b) => b.rug.flags.length - a.rug.flags.length);

  const selected = riskyTokens.find(t => t.address === selectedAddr) ?? riskyTokens[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-mono font-bold text-foreground">RISK SCANNER</h1>
          <p className="text-xs font-mono text-muted-foreground">Token safety & risk evaluation engine</p>
        </div>
        <StatusChip variant="warning" dot>SCANNING</StatusChip>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-xs font-mono text-muted-foreground">Scanning tokens…</span>
        </div>
      ) : riskyTokens.length === 0 ? (
        <div className="text-center py-16">
          <ShieldAlert className="h-8 w-8 text-terminal-green mx-auto mb-2" />
          <p className="text-sm font-mono text-terminal-green">All clear — no risk flags detected</p>
          <p className="text-xs text-muted-foreground mt-1">Risk scanner is monitoring all live tokens</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7">
            <PanelShell title="Flagged Tokens" subtitle={`${riskyTokens.length} tokens with risk flags`} noPad>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left p-3">TOKEN</th>
                      <th className="text-center p-3">FLAGS</th>
                      <th className="text-center p-3">LEVEL</th>
                      <th className="text-right p-3 hidden md:table-cell">LIQ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskyTokens.map(t => (
                      <tr key={t.address} onClick={() => setSelectedAddr(t.address)} className={cn("border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors", selected?.address === t.address && "bg-primary/5")}>
                        <td className="p-3">
                          <Link to={`/token/${t.address}`} className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <div className="h-6 w-6 rounded-full bg-destructive/10 flex items-center justify-center text-[8px] font-bold text-destructive">{t.symbol.slice(0, 2)}</div>
                            <div>
                              <p className="font-medium text-foreground">{t.symbol}</p>
                              <p className="text-[9px] text-muted-foreground">{t.name}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-foreground">{t.rug.flags.length}</span>
                        </td>
                        <td className="p-3 text-center">
                          <StatusChip variant={t.rug.level === "high" ? "danger" : t.rug.level === "watch" ? "warning" : "success"}>{t.rug.label}</StatusChip>
                        </td>
                        <td className="p-3 text-right hidden md:table-cell text-muted-foreground">{formatVolume(t.liquidity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PanelShell>
          </div>

          <div className="lg:col-span-5">
            {selected && (
              <PanelShell title="Risk Breakdown" subtitle={selected.symbol}>
                <div className="space-y-4">
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <p className="text-3xl font-mono font-bold text-destructive">{selected.rug.flags.length}</p>
                    <p className="text-[10px] font-mono text-muted-foreground mt-1">RISK FLAGS</p>
                  </div>
                  <div className="space-y-2">
                    {selected.rug.flags.map(f => (
                      <div key={f.id} className="flex items-center gap-2 p-2 rounded bg-destructive/5 border border-destructive/10">
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                        <span className="text-xs font-mono text-foreground">{f.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <ScoreMeter value={selected.liquidity < 5000 ? 80 : selected.liquidity < 50000 ? 50 : 15} label="LIQUIDITY RISK" size="md" />
                    <ScoreMeter value={Math.abs(selected.change24h) > 50 ? 75 : Math.abs(selected.change24h) > 20 ? 40 : 15} label="VOLATILITY RISK" size="md" />
                  </div>
                  <div className="p-3 rounded bg-destructive/5 border border-destructive/10">
                    <p className="text-[10px] font-mono text-destructive uppercase tracking-wider mb-1">Assessment</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {selected.rug.level === "high" ? "Critical risk. Multiple red flags detected. Exercise extreme caution." :
                       "Moderate risk. Some concerns identified. Proceed with limited exposure."}
                    </p>
                  </div>
                </div>
              </PanelShell>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
