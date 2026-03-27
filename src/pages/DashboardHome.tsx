import {
  Brain, TrendingUp, Rocket, AlertTriangle, Wallet, BarChart3,
  Zap, ShieldAlert, Eye, Globe, ArrowRight, Shield, Activity, Loader2, Radar, RefreshCw
} from "lucide-react";
import { DashboardStatCard } from "@/components/shared/DashboardStatCard";
import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { MiniChart } from "@/components/shared/MiniChart";
import { WidgetErrorBoundary } from "@/components/shared/WidgetErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useNewLaunches } from "@/hooks/useNewLaunches";
import { useUnifiedSignals } from "@/hooks/useUnifiedSignals";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useAlerts } from "@/hooks/useAlerts";
import { useSolPrice } from "@/hooks/useSolPrice";
import { useLivePriceTicks } from "@/hooks/useLivePriceTicks";
import { useSnipeHistory } from "@/hooks/useSnipeHistory";
import { useWallet } from "@/contexts/WalletContext";
import { useWalletPortfolio } from "@/hooks/useWalletPortfolio";
import { ACTIVE_CHAINS } from "@/lib/multichain";
import { DashboardAlertStrip } from "@/components/alerts/DashboardAlertStrip";
import { useChainHealthMonitor } from "@/hooks/useChainHealthMonitor";

/* ───── Quick-action button ───── */
function QuickAction({ to, icon: Icon, label, accent }: {
  to: string; icon: React.ElementType; label: string; accent?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-[10px] font-mono font-medium",
        accent
          ? `border-${accent}/30 bg-${accent}/5 text-${accent} hover:bg-${accent}/10`
          : "border-border/50 bg-card/30 text-foreground hover:bg-muted/30"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}

/* ───── Hub shortcut card ───── */
function HubShortcut({ to, icon: Icon, title, description, accent }: {
  to: string; icon: React.ElementType; title: string; description: string; accent: string;
}) {
  return (
    <Link to={to} className="group rounded-lg border border-border/50 bg-card/20 p-4 hover:border-primary/30 hover:bg-card/40 transition-all">
      <div className="flex items-center justify-between mb-2">
        <Icon className={cn("h-5 w-5", accent)} />
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <p className="text-xs font-mono font-bold text-foreground">{title}</p>
      <p className="text-[9px] font-mono text-muted-foreground mt-0.5">{description}</p>
    </Link>
  );
}

export default function DashboardHome() {
  const { data: launches } = useNewLaunches();
  const { tokens: signals } = useUnifiedSignals();
  const { items: watchlistItems } = useWatchlist();
  const { alerts } = useAlerts();
  const { data: solPrice } = useSolPrice();
  const liveTicks = useLivePriceTicks(15_000);
  const { wins, history } = useSnipeHistory();
  const { isConnected, walletAddress, balanceSOL } = useWallet();
  const { solBalance: portfolioSOL, tokens: walletTokens, refresh: refreshPortfolio } = useWalletPortfolio();
  const effectiveSOL = isConnected ? (portfolioSOL || balanceSOL || 0) : 0;
  // Start health monitor (non-blocking, delayed)
  useChainHealthMonitor();

  const activeAlerts = alerts.filter(a => a.enabled).length;
  const topSignals = signals.filter(t => t.label === "HIGH SIGNAL").slice(0, 4);
  const trending = signals.slice(0, 5);
  const rugWarnings = signals.filter(t => t.factors.some(f => f.includes("Low liquidity") || f.includes("Extreme volatility"))).slice(0, 3);

  return (
    <div className="space-y-4">
      {/* ═══ TOP: Header + Wallet + Quick Actions ═══ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-base sm:text-lg font-mono font-bold text-foreground">COMMAND CENTER</h1>
          <p className="text-[10px] sm:text-xs font-mono text-muted-foreground">Real-time market intelligence</p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && walletAddress && (
            <span className="text-[9px] font-mono text-muted-foreground px-2 py-1 rounded border border-border/30 bg-card/30 flex items-center gap-1.5">
              {walletAddress.slice(0, 4)}…{walletAddress.slice(-4)}
              <span className="text-foreground">{effectiveSOL.toFixed(4)} SOL</span>
              {walletTokens.length > 0 && <span className="text-muted-foreground/60">· {walletTokens.length} tokens</span>}
              <button onClick={refreshPortfolio} className="hover:text-primary transition-colors ml-0.5"><RefreshCw className="h-2.5 w-2.5" /></button>
            </span>
          )}
          <StatusChip variant="info" dot>LIVE</StatusChip>
        </div>
      </div>

      {/* Quick Actions strip */}
      <div className="flex flex-wrap gap-2">
        <QuickAction to="/scanner" icon={Radar} label="SCANNER" />
        <QuickAction to="/live-pairs" icon={TrendingUp} label="LIVE PAIRS" />
        <QuickAction to="/sniper-mode" icon={Zap} label="SNIPER" />
        <QuickAction to="/ai-signals" icon={Brain} label="AI SIGNALS" />
        <QuickAction to="/risk-scanner" icon={ShieldAlert} label="RISK SCAN" />
        <QuickAction to="/new-launches" icon={Rocket} label="LAUNCHES" />
      </div>

      {/* Alert strip — top-priority signals only */}
      <DashboardAlertStrip />

      {/* ═══ STATS BAR ═══ */}
      <WidgetErrorBoundary name="Stats">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <DashboardStatCard icon={Brain} label="SOL Price" value={solPrice ? `$${solPrice.price.toFixed(2)}` : "—"} change={solPrice ? `${solPrice.change24h >= 0 ? "+" : ""}${solPrice.change24h.toFixed(1)}%` : "…"} changeType={solPrice && solPrice.change24h >= 0 ? "positive" : "negative"} />
          <DashboardStatCard icon={Zap} label="Signals" value={String(signals.length)} change={`${topSignals.length} high`} changeType="positive" />
          <DashboardStatCard icon={Rocket} label="Launches" value={String(launches?.length ?? 0)} change="detected" changeType="positive" />
          <DashboardStatCard icon={AlertTriangle} label="Risk Flags" value={String(rugWarnings.length)} change={rugWarnings.length > 0 ? "active" : "clear"} changeType={rugWarnings.length > 0 ? "negative" : "positive"} />
          <DashboardStatCard icon={Wallet} label="Snipe Wins" value={String(wins.length)} change={`${history.length} total`} changeType={wins.length > 0 ? "positive" : "neutral"} />
          <DashboardStatCard icon={BarChart3} label="Alerts" value={String(activeAlerts)} change={`${alerts.length} total`} changeType="neutral" />
        </div>
      </WidgetErrorBoundary>

      {/* ═══ MIDDLE: Portfolio + Signals + Key Panels ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left column — Portfolio + Trending */}
        <div className="lg:col-span-4 space-y-3">
          {/* SOL chart */}
          {solPrice && (
            <WidgetErrorBoundary name="SOL Chart">
              <PanelShell title="SOL / USD" subtitle={liveTicks.length > 1 ? `${liveTicks.length} ticks` : "24h"}>
                <MiniChart
                  data={liveTicks.length > 1 ? liveTicks : undefined}
                  baseValue={solPrice.price}
                  change={solPrice.change24h}
                  height={100}
                  label="PRICE"
                />
              </PanelShell>
            </WidgetErrorBoundary>
          )}

          <WidgetErrorBoundary name="Trending">
            <PanelShell title="TRENDING" subtitle="Top signals" actions={<Link to="/live-pairs" className="text-[10px] font-mono text-primary hover:underline">ALL →</Link>}>
              {trending.length === 0 ? (
                <div className="py-4 space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
              ) : (
                <div className="space-y-1">
                  {trending.map(t => (
                    <Link key={t.address} to={`/token/${t.address}`} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-mono font-bold text-primary shrink-0">{t.symbol.slice(0, 2)}</div>
                        <span className="text-xs font-mono text-foreground truncate">{t.symbol}</span>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-[10px] font-mono text-foreground tabular-nums">{formatPrice(t.price)}</p>
                        <p className={cn("text-[9px] font-mono tabular-nums", t.change24h >= 0 ? "text-terminal-green" : "text-destructive")}>
                          {t.change24h >= 0 ? "+" : ""}{t.change24h.toFixed(1)}%
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </PanelShell>
          </WidgetErrorBoundary>
        </div>

        {/* Center column — Signal Feed */}
        <div className="lg:col-span-5 space-y-3">
          <WidgetErrorBoundary name="Signals">
            <PanelShell title="SIGNAL FEED" subtitle="High-confidence intelligence" actions={<Link to="/ai-signals" className="text-[10px] font-mono text-primary hover:underline">ALL →</Link>}>
              {topSignals.length === 0 ? (
                <div className="py-6 text-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-[10px] font-mono text-muted-foreground">Scanning…</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {topSignals.map(s => (
                    <Link key={s.address} to={`/token/${s.address}`} className="block p-3 rounded-lg bg-muted/20 border border-border/40 hover:border-primary/20 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-mono font-bold text-foreground truncate">{s.symbol}</span>
                          <StatusChip variant="success">{s.label}</StatusChip>
                        </div>
                        <span className="text-[9px] font-mono text-muted-foreground shrink-0">Score {s.score}</span>
                      </div>
                      <MiniChart baseValue={s.price} change={s.change24h} height={40} />
                      <div className="flex gap-1 flex-wrap mt-1.5">
                        {s.factors.slice(0, 3).map(f => (
                          <span key={f} className="text-[8px] font-mono px-1 py-0.5 rounded bg-primary/5 text-primary/70">{f}</span>
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </PanelShell>
          </WidgetErrorBoundary>
        </div>

        {/* Right column — Alerts + Watchlist + Risk */}
        <div className="lg:col-span-3 space-y-3">
          {/* Alert strip */}
          <WidgetErrorBoundary name="Alerts">
            <PanelShell title="ALERTS" subtitle={`${activeAlerts} active`} actions={<Link to="/alerts" className="text-[10px] font-mono text-primary hover:underline">ALL →</Link>}>
              {alerts.length === 0 ? (
                <p className="text-[10px] font-mono text-muted-foreground py-3 text-center">No alerts set</p>
              ) : (
                <div className="space-y-1.5">
                  {alerts.slice(0, 3).map(a => (
                    <div key={a.id} className="flex items-center justify-between py-1.5 px-2 rounded border border-border/30 bg-muted/10">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <StatusChip variant={a.enabled ? "success" : "muted"} dot>{a.kind.toUpperCase()}</StatusChip>
                      </div>
                      <span className="text-[9px] font-mono text-muted-foreground shrink-0">{a.direction} {a.threshold}</span>
                    </div>
                  ))}
                </div>
              )}
            </PanelShell>
          </WidgetErrorBoundary>

          {/* Watchlist highlights */}
          <WidgetErrorBoundary name="Watchlist">
            <PanelShell title="WATCHLIST" actions={<Link to="/watchlist" className="text-[10px] font-mono text-primary hover:underline">ALL →</Link>}>
              {watchlistItems.length === 0 ? (
                <p className="text-[10px] font-mono text-muted-foreground py-3 text-center">Empty</p>
              ) : (
                <div className="space-y-1">
                  {watchlistItems.slice(0, 4).map(item => (
                    <Link key={item.id} to={`/token/${item.address}`} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/30 transition-colors">
                      <Eye className="h-3 w-3 text-primary shrink-0" />
                      <span className="text-[10px] font-mono text-foreground truncate">{item.label || `${item.address.slice(0, 8)}…`}</span>
                    </Link>
                  ))}
                </div>
              )}
            </PanelShell>
          </WidgetErrorBoundary>

          {/* Risk strip */}
          <WidgetErrorBoundary name="Risk">
            <PanelShell title="RISK FLAGS" subtitle={rugWarnings.length > 0 ? "Action needed" : "All clear"}>
              {rugWarnings.length === 0 ? (
                <p className="text-[10px] font-mono text-terminal-green py-3 text-center">✓ No risk flags</p>
              ) : (
                <div className="space-y-1.5">
                  {rugWarnings.map(t => (
                    <div key={t.address} className="flex items-center gap-2 py-1.5 px-2 rounded bg-destructive/5 border border-destructive/10">
                      <ShieldAlert className="h-3 w-3 text-destructive shrink-0" />
                      <span className="text-[10px] font-mono text-foreground truncate">{t.symbol}</span>
                      <StatusChip variant="danger" className="ml-auto">{t.score}</StatusChip>
                    </div>
                  ))}
                </div>
              )}
            </PanelShell>
          </WidgetErrorBoundary>

          {/* Network health strip */}
          <WidgetErrorBoundary name="Networks">
            <PanelShell title="NETWORK STATUS" subtitle={`${ACTIVE_CHAINS.length} chains`}>
              <div className="flex flex-wrap gap-1.5 py-1">
                {ACTIVE_CHAINS.slice(0, 6).map(c => (
                  <span key={c.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono border border-border/30 bg-card/30 text-muted-foreground">
                    {c.icon} {c.symbol}
                  </span>
                ))}
                {ACTIVE_CHAINS.length > 6 && (
                  <span className="text-[8px] font-mono text-muted-foreground px-1.5 py-0.5">+{ACTIVE_CHAINS.length - 6} more</span>
                )}
              </div>
            </PanelShell>
          </WidgetErrorBoundary>
        </div>
      </div>

      {/* ═══ BOTTOM: Hub Shortcuts ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <HubShortcut
          to="/multichain"
          icon={Globe}
          title="MULTI-CHAIN HUB"
          description={`${ACTIVE_CHAINS.length} networks · unified portfolio`}
          accent="text-primary"
        />
        <HubShortcut
          to="/multichain"
          icon={Shield}
          title="COMPLIANCE VIEW"
          description="Infrastructure-grade networks"
          accent="text-terminal-cyan"
        />
        <HubShortcut
          to="/xrpl"
          icon={Activity}
          title="BRIDGE PANEL"
          description="Cross-chain bridge · safe mode"
          accent="text-terminal-blue"
        />
      </div>
    </div>
  );
}
