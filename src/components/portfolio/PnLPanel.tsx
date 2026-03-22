import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react";
import { useWalletStore } from "@/stores/walletStore";
import type { PnLEntry } from "@/types/xrpl";

function generateMockPnL(): PnLEntry[] {
  return [
    { currency: "XRP", costBasis: 5000, currentValue: 5875, realizedPnL: 120, unrealizedPnL: 875, totalPnL: 995, pnlPct: 19.9 },
    { currency: "SOLO", issuer: "rsoLo2...", costBasis: 1200, currentValue: 980, realizedPnL: 0, unrealizedPnL: -220, totalPnL: -220, pnlPct: -18.3 },
    { currency: "CSC", issuer: "rCSCMa...", costBasis: 400, currentValue: 520, realizedPnL: 50, unrealizedPnL: 120, totalPnL: 170, pnlPct: 42.5 },
    { currency: "USD", issuer: "rhub8V...", costBasis: 2000, currentValue: 2000, realizedPnL: 0, unrealizedPnL: 0, totalPnL: 0, pnlPct: 0 },
  ];
}

export function PnLPanel() {
  const { isConnected } = useWalletStore();
  const pnlData = useMemo(() => generateMockPnL(), []);

  const totalPnL = pnlData.reduce((s, e) => s + e.totalPnL, 0);
  const totalCost = pnlData.reduce((s, e) => s + e.costBasis, 0);
  const totalPnLPct = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;
  const isPositive = totalPnL >= 0;

  if (!isConnected) {
    return (
      <div className="terminal-panel p-6 text-center">
        <DollarSign className="h-6 w-6 text-muted-foreground/10 mx-auto mb-2" />
        <p className="text-[9px] font-mono text-muted-foreground/30">Connect wallet to view P&L</p>
      </div>
    );
  }

  return (
    <div className="terminal-panel">
      <div className="terminal-panel-header">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="h-3 w-3 text-muted-foreground/50" />
          <span className="terminal-panel-title">P&L Overview</span>
        </div>
        <div className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold",
          isPositive ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
        )}>
          {isPositive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
          {isPositive ? "+" : ""}{totalPnL.toFixed(2)} ({totalPnLPct.toFixed(1)}%)
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 px-3 py-2 border-b border-border/30 text-[9px] font-mono">
        <div>
          <span className="text-muted-foreground/40 block text-[7px] uppercase">Cost Basis</span>
          <span className="text-foreground/70 tabular-nums">${totalCost.toFixed(0)}</span>
        </div>
        <div>
          <span className="text-muted-foreground/40 block text-[7px] uppercase">Realized</span>
          <span className={cn("tabular-nums", pnlData.reduce((s, e) => s + e.realizedPnL, 0) >= 0 ? "text-primary/70" : "text-destructive/70")}>
            ${pnlData.reduce((s, e) => s + e.realizedPnL, 0).toFixed(0)}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground/40 block text-[7px] uppercase">Unrealized</span>
          <span className={cn("tabular-nums", pnlData.reduce((s, e) => s + e.unrealizedPnL, 0) >= 0 ? "text-primary/70" : "text-destructive/70")}>
            ${pnlData.reduce((s, e) => s + e.unrealizedPnL, 0).toFixed(0)}
          </span>
        </div>
      </div>

      {/* Per asset */}
      <div className="divide-y divide-border/20">
        {pnlData.map((entry) => (
          <div key={entry.currency} className="px-3 py-1.5 flex items-center justify-between hover:bg-muted/10 transition-colors">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-muted/30 flex items-center justify-center">
                <span className="text-[6px] font-mono font-bold text-foreground/60">{entry.currency.slice(0, 2)}</span>
              </div>
              <span className="text-[10px] font-mono text-foreground/70">{entry.currency}</span>
            </div>
            <div className="flex items-center gap-3 text-[9px] font-mono">
              <span className="text-muted-foreground/40 tabular-nums">${entry.currentValue.toFixed(0)}</span>
              <span className={cn("tabular-nums font-medium", entry.totalPnL >= 0 ? "text-primary/70" : "text-destructive/70")}>
                {entry.totalPnL >= 0 ? "+" : ""}{entry.pnlPct.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
