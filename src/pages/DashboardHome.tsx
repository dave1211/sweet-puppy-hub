import { Brain, TrendingUp, Rocket, AlertTriangle, Wallet, BarChart3, Zap, Activity, ShieldAlert, Eye } from "lucide-react";
import { DashboardStatCard } from "@/components/shared/DashboardStatCard";
import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { ScoreMeter } from "@/components/shared/ScoreMeter";
import { mockTokens, mockSignals, mockAlerts, mockWallets, mockHoldings, formatPrice, formatVolume } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export default function DashboardHome() {
  const trending = mockTokens.filter(t => t.change24h > 20).slice(0, 5);
  const newLaunches = mockTokens.filter(t => t.status === "new").slice(0, 4);
  const rugWarnings = mockTokens.filter(t => t.riskScore > 60).slice(0, 3);
  const recentSignals = mockSignals.slice(0, 4);
  const recentAlerts = mockAlerts.filter(a => !a.read).slice(0, 4);
  const totalPnl = mockHoldings.reduce((s, h) => s + h.unrealizedPnl, 0);

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-mono font-bold text-foreground">COMMAND CENTER</h1>
          <p className="text-xs font-mono text-muted-foreground">Real-time market intelligence overview</p>
        </div>
        <StatusChip variant="info" dot>LIVE FEED</StatusChip>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <DashboardStatCard icon={Brain} label="Market Mood" value="Bullish" change="+12% sentiment" changeType="positive" />
        <DashboardStatCard icon={Zap} label="Active Signals" value="24" change="8 high confidence" changeType="positive" />
        <DashboardStatCard icon={Rocket} label="New Launches" value="47" change="12 sniper-ready" changeType="positive" />
        <DashboardStatCard icon={AlertTriangle} label="Risk Warnings" value="6" change="2 critical" changeType="negative" />
        <DashboardStatCard icon={Wallet} label="Wallets Tracked" value={String(mockWallets.length)} change="3 active now" changeType="neutral" />
        <DashboardStatCard icon={BarChart3} label="Portfolio PnL" value={`+${totalPnl.toFixed(1)}%`} change="24h performance" changeType="positive" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left column */}
        <div className="lg:col-span-4 space-y-4">
          <PanelShell title="Trending Tokens" subtitle="Top movers 24h" actions={<Link to="/live-pairs" className="text-[10px] font-mono text-primary hover:underline">VIEW ALL</Link>}>
            <div className="space-y-2">
              {trending.map(t => (
                <Link key={t.id} to={`/token/${t.id}`} className="flex items-center justify-between py-2 px-2 rounded hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-mono font-bold text-primary">{t.symbol.slice(0, 2)}</div>
                    <div>
                      <p className="text-xs font-mono font-medium text-foreground">{t.symbol}</p>
                      <p className="text-[10px] text-muted-foreground">{t.chain}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-foreground">{formatPrice(t.price)}</p>
                    <p className={cn("text-[10px] font-mono", t.change24h >= 0 ? "text-terminal-green" : "text-destructive")}>
                      {t.change24h >= 0 ? "+" : ""}{t.change24h.toFixed(1)}%
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </PanelShell>

          <PanelShell title="Smart Money Activity" subtitle="Top wallet moves">
            <div className="space-y-2">
              {mockWallets.slice(0, 4).map(w => (
                <Link key={w.id} to={`/wallet/${w.id}`} className="flex items-center justify-between py-2 px-2 rounded hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="text-xs font-mono font-medium text-foreground">{w.label}</p>
                    <p className="text-[10px] text-muted-foreground">{w.recentAction}</p>
                  </div>
                  <StatusChip variant={w.trustScore > 85 ? "success" : w.trustScore > 60 ? "info" : "warning"}>
                    {w.trustScore}
                  </StatusChip>
                </Link>
              ))}
            </div>
          </PanelShell>

          <PanelShell title="Portfolio Snapshot" actions={<Link to="/portfolio" className="text-[10px] font-mono text-primary hover:underline">FULL VIEW</Link>}>
            <div className="space-y-2">
              {mockHoldings.slice(0, 4).map(h => (
                <div key={h.id} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[8px] font-mono font-bold text-primary">{h.symbol.slice(0, 2)}</div>
                    <span className="text-xs font-mono text-foreground">{h.symbol}</span>
                  </div>
                  <div className="text-right">
                    <span className={cn("text-xs font-mono", h.unrealizedPnl >= 0 ? "text-terminal-green" : "text-destructive")}>
                      {h.unrealizedPnl >= 0 ? "+" : ""}{h.unrealizedPnl.toFixed(1)}%
                    </span>
                    <p className="text-[10px] text-muted-foreground">{h.allocation}% alloc</p>
                  </div>
                </div>
              ))}
            </div>
          </PanelShell>
        </div>

        {/* Center column */}
        <div className="lg:col-span-5 space-y-4">
          <PanelShell title="AI Signal Feed" subtitle="Real-time intelligence" actions={<Link to="/ai-signals" className="text-[10px] font-mono text-primary hover:underline">ALL SIGNALS</Link>}>
            <div className="space-y-3">
              {recentSignals.map(s => (
                <div key={s.id} className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-foreground">{s.symbol}</span>
                      <StatusChip variant={s.confidence >= 85 ? "success" : s.confidence >= 70 ? "info" : "warning"}>{s.type}</StatusChip>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">{s.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{s.reason}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-muted-foreground">{s.metrics}</span>
                    <ScoreMeter value={s.confidence} label="Conf" />
                  </div>
                </div>
              ))}
            </div>
          </PanelShell>

          <PanelShell title="Fresh Launches" subtitle="New tokens detected" actions={<Link to="/new-launches" className="text-[10px] font-mono text-primary hover:underline">VIEW ALL</Link>}>
            <div className="grid grid-cols-2 gap-2">
              {newLaunches.map(t => (
                <Link key={t.id} to={`/token/${t.id}`} className="p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-mono font-bold text-primary">{t.symbol.slice(0, 2)}</div>
                    <div>
                      <p className="text-xs font-mono font-medium text-foreground">{t.symbol}</p>
                      <p className="text-[9px] text-muted-foreground">{t.pairAge} old</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-foreground">{formatPrice(t.price)}</span>
                    <span className={cn("text-[10px] font-mono", t.change24h >= 0 ? "text-terminal-green" : "text-destructive")}>
                      +{t.change24h.toFixed(0)}%
                    </span>
                  </div>
                  <ScoreMeter value={t.signalScore} label="Signal" size="sm" />
                </Link>
              ))}
            </div>
          </PanelShell>
        </div>

        {/* Right column */}
        <div className="lg:col-span-3 space-y-4">
          <PanelShell title="Active Alerts" subtitle={`${recentAlerts.length} unread`} actions={<Link to="/alerts" className="text-[10px] font-mono text-primary hover:underline">VIEW ALL</Link>}>
            <div className="space-y-2">
              {recentAlerts.map(a => (
                <div key={a.id} className={cn("p-2.5 rounded-lg border transition-colors", a.severity === "critical" ? "border-destructive/30 bg-destructive/5" : "border-border/50 bg-muted/20")}>
                  <div className="flex items-center justify-between mb-1">
                    <StatusChip variant={a.severity === "critical" ? "danger" : a.severity === "high" ? "warning" : "muted"} dot>{a.severity.toUpperCase()}</StatusChip>
                    <span className="text-[9px] font-mono text-muted-foreground">{a.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-foreground leading-snug">{a.message}</p>
                </div>
              ))}
            </div>
          </PanelShell>

          <PanelShell title="Rug Warnings" subtitle="High-risk tokens">
            <div className="space-y-2">
              {rugWarnings.map(t => (
                <div key={t.id} className="flex items-center justify-between py-2 px-2 rounded bg-destructive/5 border border-destructive/10">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
                    <div>
                      <p className="text-xs font-mono font-medium text-foreground">{t.symbol}</p>
                      <p className="text-[9px] text-muted-foreground">{t.chain} · {t.pairAge}</p>
                    </div>
                  </div>
                  <StatusChip variant="danger">Risk {t.riskScore}</StatusChip>
                </div>
              ))}
            </div>
          </PanelShell>

          <PanelShell title="AI Summary">
            <div className="space-y-3 text-[11px] font-mono text-muted-foreground leading-relaxed">
              <div className="p-2 rounded bg-terminal-green/5 border border-terminal-green/10">
                <p className="text-terminal-green text-[9px] uppercase tracking-wider mb-1">Strongest Signal</p>
                <p>ALPHA showing whale accumulation with 92% confidence</p>
              </div>
              <div className="p-2 rounded bg-primary/5 border border-primary/10">
                <p className="text-primary text-[9px] uppercase tracking-wider mb-1">Safest Setup</p>
                <p>VLTX — low risk, high liquidity, stable momentum</p>
              </div>
              <div className="p-2 rounded bg-destructive/5 border border-destructive/10">
                <p className="text-destructive text-[9px] uppercase tracking-wider mb-1">Highest Risk</p>
                <p>MOON — dev wallet dump detected, exit recommended</p>
              </div>
            </div>
          </PanelShell>
        </div>
      </div>
    </div>
  );
}
