import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { DashboardStatCard } from "@/components/shared/DashboardStatCard";
import { mockHoldings, formatPrice } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { PieChart, TrendingUp, DollarSign, BarChart3, Activity } from "lucide-react";

const totalValue = mockHoldings.reduce((s, h) => s + h.amount * h.currentPrice, 0);
const totalUnrealized = mockHoldings.reduce((s, h) => s + h.unrealizedPnl, 0) / mockHoldings.length;
const totalRealized = mockHoldings.reduce((s, h) => s + h.realizedPnl, 0) / mockHoldings.length;

export default function PortfolioPageNew() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-mono font-bold text-foreground">PORTFOLIO</h1>
        <p className="text-xs font-mono text-muted-foreground">Holdings & performance analytics</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <DashboardStatCard icon={DollarSign} label="Portfolio Value" value={`$${(totalValue / 1000).toFixed(1)}K`} change="+12.4% 24h" changeType="positive" />
        <DashboardStatCard icon={TrendingUp} label="Unrealized PnL" value={`+${totalUnrealized.toFixed(1)}%`} change="Avg across holdings" changeType="positive" />
        <DashboardStatCard icon={BarChart3} label="Realized PnL" value={`+${totalRealized.toFixed(1)}%`} change="All time" changeType="positive" />
        <DashboardStatCard icon={PieChart} label="Positions" value={String(mockHoldings.length)} change="6 active tokens" changeType="neutral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Holdings table */}
        <div className="lg:col-span-8">
          <PanelShell title="Holdings" subtitle="Active positions" noPad>
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-3">TOKEN</th>
                  <th className="text-right p-3 hidden md:table-cell">AMOUNT</th>
                  <th className="text-right p-3">AVG ENTRY</th>
                  <th className="text-right p-3">CURRENT</th>
                  <th className="text-right p-3">UNREAL. PNL</th>
                  <th className="text-right p-3 hidden md:table-cell">REAL. PNL</th>
                  <th className="text-center p-3">ALLOC</th>
                  <th className="text-center p-3 hidden lg:table-cell">RISK</th>
                </tr>
              </thead>
              <tbody>
                {mockHoldings.map(h => (
                  <tr key={h.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">{h.symbol.slice(0, 2)}</div>
                        <div>
                          <p className="font-medium text-foreground">{h.symbol}</p>
                          <p className="text-[9px] text-muted-foreground">{h.token}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-right hidden md:table-cell text-muted-foreground">{h.amount.toLocaleString()}</td>
                    <td className="p-3 text-right text-muted-foreground">{formatPrice(h.avgEntry)}</td>
                    <td className="p-3 text-right text-foreground">{formatPrice(h.currentPrice)}</td>
                    <td className={cn("p-3 text-right font-medium", h.unrealizedPnl >= 0 ? "text-terminal-green" : "text-destructive")}>
                      {h.unrealizedPnl >= 0 ? "+" : ""}{h.unrealizedPnl.toFixed(1)}%
                    </td>
                    <td className={cn("p-3 text-right hidden md:table-cell", h.realizedPnl >= 0 ? "text-terminal-green" : "text-destructive")}>
                      {h.realizedPnl > 0 ? `+${h.realizedPnl.toFixed(1)}%` : "—"}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${h.allocation}%` }} />
                        </div>
                        <span className="text-muted-foreground">{h.allocation}%</span>
                      </div>
                    </td>
                    <td className="p-3 text-center hidden lg:table-cell">
                      <StatusChip variant={h.riskProfile === "low" ? "success" : h.riskProfile === "medium" ? "warning" : "danger"}>
                        {h.riskProfile.toUpperCase()}
                      </StatusChip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PanelShell>
        </div>

        {/* Side panels */}
        <div className="lg:col-span-4 space-y-4">
          <PanelShell title="Allocation">
            <div className="space-y-2">
              {mockHoldings.map(h => (
                <div key={h.id} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground w-12">{h.symbol}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${h.allocation}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-foreground w-8 text-right">{h.allocation}%</span>
                </div>
              ))}
            </div>
          </PanelShell>

          <PanelShell title="Recent Activity">
            <div className="space-y-2 text-[11px] font-mono">
              {[
                { action: "BUY", token: "ALPHA", amount: "2.5 SOL", time: "2h ago" },
                { action: "SELL", token: "TURBO", amount: "1.0 SOL", time: "6h ago" },
                { action: "BUY", token: "GIGA", amount: "3.0 SOL", time: "1d ago" },
                { action: "BUY", token: "SHADOW", amount: "1.5 SOL", time: "2d ago" },
              ].map((a, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <StatusChip variant={a.action === "BUY" ? "success" : "danger"}>{a.action}</StatusChip>
                    <span className="text-foreground">{a.token}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{a.amount}</span>
                    <span>{a.time}</span>
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
