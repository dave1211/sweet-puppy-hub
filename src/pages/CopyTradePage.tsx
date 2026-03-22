import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { ScoreMeter } from "@/components/shared/ScoreMeter";
import { mockWallets } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Users, TrendingUp, BarChart3 } from "lucide-react";

const TOP_WALLETS = mockWallets.sort((a, b) => b.trustScore - a.trustScore);

const SIM_DATA = {
  wallet: "Alpha Hunter",
  starting: "10 SOL",
  projected: "+67.8%",
  drawdown: "-12.3%",
  recentTrades: [
    { token: "ALPHA", action: "BUY", amount: "2.5 SOL", pnl: "+45.2%", time: "2h ago" },
    { token: "GIGA", action: "BUY", amount: "1.0 SOL", pnl: "+23.1%", time: "6h ago" },
    { token: "TURBO", action: "SELL", amount: "3.0 SOL", pnl: "+89.4%", time: "1d ago" },
    { token: "WIF", action: "BUY", amount: "2.0 SOL", pnl: "+12.3%", time: "2d ago" },
  ],
};

export default function CopyTradePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-mono font-bold text-foreground">COPY TRADE</h1>
        <p className="text-xs font-mono text-muted-foreground">Wallet intelligence & copy trading analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Top wallets */}
        <div className="lg:col-span-7">
          <PanelShell title="Top Wallets to Copy" subtitle="Ranked by trust & performance">
            <div className="space-y-2">
              {TOP_WALLETS.map((w, i) => (
                <div key={w.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/50 hover:border-primary/20 transition-colors">
                  <span className="text-lg font-mono font-bold text-muted-foreground w-6 text-center">#{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono font-bold text-foreground">{w.label}</span>
                      <StatusChip variant={w.type === "sniper" ? "success" : w.type === "whale" ? "info" : "muted"}>{w.type}</StatusChip>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
                      <span>Win: <span className={cn(w.winRate >= 70 ? "text-terminal-green" : "text-foreground")}>{w.winRate}%</span></span>
                      <span>7d: <span className={cn(w.pnl7d >= 0 ? "text-terminal-green" : "text-destructive")}>{w.pnl7d >= 0 ? "+" : ""}{w.pnl7d.toFixed(1)}%</span></span>
                      <span>Trust: <span className="text-foreground">{w.trustScore}</span></span>
                    </div>
                  </div>
                  <ScoreMeter value={w.trustScore} size="sm" />
                </div>
              ))}
            </div>
          </PanelShell>
        </div>

        {/* Simulation panel */}
        <div className="lg:col-span-5 space-y-4">
          <PanelShell title="Copy Simulation" subtitle="Projected performance">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded bg-muted/30 text-center">
                  <p className="text-[9px] font-mono text-muted-foreground uppercase">Wallet</p>
                  <p className="text-sm font-mono font-bold text-primary mt-1">{SIM_DATA.wallet}</p>
                </div>
                <div className="p-3 rounded bg-muted/30 text-center">
                  <p className="text-[9px] font-mono text-muted-foreground uppercase">Starting</p>
                  <p className="text-sm font-mono font-bold text-foreground mt-1">{SIM_DATA.starting}</p>
                </div>
                <div className="p-3 rounded bg-terminal-green/5 border border-terminal-green/10 text-center">
                  <p className="text-[9px] font-mono text-muted-foreground uppercase">Projected</p>
                  <p className="text-sm font-mono font-bold text-terminal-green mt-1">{SIM_DATA.projected}</p>
                </div>
                <div className="p-3 rounded bg-destructive/5 border border-destructive/10 text-center">
                  <p className="text-[9px] font-mono text-muted-foreground uppercase">Max Drawdown</p>
                  <p className="text-sm font-mono font-bold text-destructive mt-1">{SIM_DATA.drawdown}</p>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Recent Copied Trades</h4>
                <div className="space-y-1.5">
                  {SIM_DATA.recentTrades.map((t, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/20 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <StatusChip variant={t.action === "BUY" ? "success" : "danger"}>{t.action}</StatusChip>
                        <span className="text-foreground">{t.token}</span>
                        <span className="text-muted-foreground">{t.amount}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-terminal-green">{t.pnl}</span>
                        <span className="text-muted-foreground">{t.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PanelShell>
        </div>
      </div>
    </div>
  );
}
