import { Brain, TrendingUp, Rocket, AlertTriangle, Wallet, BarChart3, Zap, ShieldAlert, Eye, Loader2 } from "lucide-react";
import { DashboardStatCard } from "@/components/shared/DashboardStatCard";
import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { MiniChart } from "@/components/shared/MiniChart";
import { WidgetErrorBoundary } from "@/components/shared/WidgetErrorBoundary";
import { formatPrice, formatVolume } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useNewLaunches } from "@/hooks/useNewLaunches";
import { useUnifiedSignals } from "@/hooks/useUnifiedSignals";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useAlerts } from "@/hooks/useAlerts";
import { useTrackedWallets } from "@/hooks/useTrackedWallets";
import { useSolPrice } from "@/hooks/useSolPrice";
import { useLivePriceTicks } from "@/hooks/useLivePriceTicks";
import { useSnipeHistory } from "@/hooks/useSnipeHistory";

export default function DashboardHome() {
  const { data: launches } = useNewLaunches();
  const { tokens: signals } = useUnifiedSignals();
  const { items: watchlistItems } = useWatchlist();
  const { alerts } = useAlerts();
  const { wallets } = useTrackedWallets();
  const { data: solPrice } = useSolPrice();
  const liveTicks = useLivePriceTicks(15_000);
  const { wins, history } = useSnipeHistory();

  const activeAlerts = alerts.filter(a => a.enabled).length;
  const topSignals = signals.filter(t => t.label === "HIGH SIGNAL").slice(0, 5);
  const trending = signals.slice(0, 5);
  const newLaunches = (launches ?? []).slice(0, 4);
  const rugWarnings = signals.filter(t => t.factors.some(f => f.includes("Low liquidity") || f.includes("Extreme volatility"))).slice(0, 3);

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-base sm:text-lg font-mono font-bold text-foreground">COMMAND CENTER</h1>
          <p className="text-[10px] sm:text-xs font-mono text-muted-foreground">Real-time market intelligence overview</p>
        </div>
        <StatusChip variant="info" dot>LIVE FEED</StatusChip>
      </div>

      <WidgetErrorBoundary name="Stats Bar">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          <DashboardStatCard icon={Brain} label="SOL Price" value={solPrice ? `$${solPrice.price.toFixed(2)}` : "—"} change={solPrice ? `${solPrice.change24h >= 0 ? "+" : ""}${solPrice.change24h.toFixed(1)}% 24h` : "Loading"} changeType={solPrice && solPrice.change24h >= 0 ? "positive" : "negative"} />
          <DashboardStatCard icon={Zap} label="Signals" value={String(signals.length)} change={`${topSignals.length} high confidence`} changeType="positive" />
          <DashboardStatCard icon={Rocket} label="New Launches" value={String(launches?.length ?? 0)} change="from live feeds" changeType="positive" />
          <DashboardStatCard icon={AlertTriangle} label="Risk Warnings" value={String(rugWarnings.length)} change={rugWarnings.length > 0 ? "flagged tokens" : "all clear"} changeType={rugWarnings.length > 0 ? "negative" : "positive"} />
          <DashboardStatCard icon={Wallet} label="Snipe Wins" value={String(wins.length)} change={`${history.length} total snipes`} changeType={wins.length > 0 ? "positive" : "neutral"} />
          <DashboardStatCard icon={BarChart3} label="Active Alerts" value={String(activeAlerts)} change={`${alerts.length} total`} changeType="neutral" />
        </div>
      </WidgetErrorBoundary>

      {/* Live SOL price chart with real ticks */}
      {solPrice && (
        <WidgetErrorBoundary name="SOL Chart">
          <PanelShell title="SOL / USD" subtitle={liveTicks.length > 1 ? `${liveTicks.length} live ticks` : "24h price action"}>
            <MiniChart
              data={liveTicks.length > 1 ? liveTicks : undefined}
              baseValue={solPrice.price}
              change={solPrice.change24h}
              height={120}
              label="LIVE PRICE"
            />
          </PanelShell>
        </WidgetErrorBoundary>
      )}

      {/* Signal distribution bar chart */}
      {signals.length > 0 && (
        <WidgetErrorBoundary name="Signal Chart">
          <PanelShell title="Signal Distribution" subtitle="Score breakdown across tokens">
            <MiniChart
              data={signals.slice(0, 20).map((s, i) => ({ time: i, value: s.score }))}
              baseValue={50}
              change={0}
              height={90}
              type="bar"
              label="SIGNAL SCORES"
            />
          </PanelShell>
        </WidgetErrorBoundary>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        <div className="lg:col-span-4 space-y-3 sm:space-y-4">
          <WidgetErrorBoundary name="Trending Tokens">
            <PanelShell title="Trending Tokens" subtitle="Top signals" actions={<Link to="/live-pairs" className="text-[10px] font-mono text-primary hover:underline">VIEW ALL</Link>}>
              {trending.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Loading live data…</p>
              ) : (
                <div className="space-y-2">
                  {trending.map(t => (
                    <Link key={t.address} to={`/token/${t.address}`} className="flex items-center justify-between py-2 px-2 rounded hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-mono font-bold text-primary shrink-0">{t.symbol.slice(0, 2)}</div>
                        <div className="min-w-0">
                          <p className="text-xs font-mono font-medium text-foreground truncate">{t.symbol}</p>
                          <p className="text-[10px] text-muted-foreground">Score {t.score}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-xs font-mono text-foreground">{formatPrice(t.price)}</p>
                        <p className={cn("text-[10px] font-mono", t.change24h >= 0 ? "text-terminal-green" : "text-destructive")}>
                          {t.change24h >= 0 ? "+" : ""}{t.change24h.toFixed(1)}%
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </PanelShell>
          </WidgetErrorBoundary>

          <WidgetErrorBoundary name="Tracked Wallets">
            <PanelShell title="Tracked Wallets" subtitle="Your monitored wallets">
              {wallets.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-xs text-muted-foreground">No wallets tracked yet</p>
                  <Link to="/wallet-tracker" className="text-[10px] font-mono text-primary hover:underline mt-1 block">Add wallets →</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {wallets.slice(0, 4).map(w => (
                    <Link key={w.id} to={`/wallet/${w.address}`} className="flex items-center justify-between py-2 px-2 rounded hover:bg-muted/30 transition-colors">
                      <div className="min-w-0">
                        <p className="text-xs font-mono font-medium text-foreground truncate">{w.label || `${w.address.slice(0, 6)}…${w.address.slice(-4)}`}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{w.address.slice(0, 8)}…</p>
                      </div>
                      <StatusChip variant="info">TRACKING</StatusChip>
                    </Link>
                  ))}
                </div>
              )}
            </PanelShell>
          </WidgetErrorBoundary>
        </div>

        <div className="lg:col-span-5 space-y-3 sm:space-y-4">
          <WidgetErrorBoundary name="Signal Feed">
            <PanelShell title="Signal Feed" subtitle="Unified intelligence" actions={<Link to="/ai-signals" className="text-[10px] font-mono text-primary hover:underline">ALL SIGNALS</Link>}>
              {topSignals.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Scanning for signals…</p>
              ) : (
                <div className="space-y-3">
                  {topSignals.slice(0, 4).map(s => (
                    <Link key={s.address} to={`/token/${s.address}`} className="block p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2 hover:border-primary/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-mono font-bold text-foreground truncate">{s.symbol}</span>
                          <StatusChip variant="success">{s.label}</StatusChip>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0 ml-2">Score {s.score}</span>
                      </div>
                      <MiniChart baseValue={s.price} change={s.change24h} height={48} />
                      <div className="flex gap-1 flex-wrap">
                        {s.factors.slice(0, 3).map(f => (
                          <span key={f} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/5 text-primary/80">{f}</span>
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </PanelShell>
          </WidgetErrorBoundary>

          <WidgetErrorBoundary name="Fresh Launches">
            <PanelShell title="Fresh Launches" subtitle="New tokens detected" actions={<Link to="/new-launches" className="text-[10px] font-mono text-primary hover:underline">VIEW ALL</Link>}>
              {newLaunches.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Scanning for new launches…</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {newLaunches.map(t => (
                    <Link key={t.address} to={`/token/${t.address}`} className="p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-mono font-bold text-primary shrink-0">{t.symbol.slice(0, 2)}</div>
                        <div className="min-w-0">
                          <p className="text-xs font-mono font-medium text-foreground truncate">{t.symbol}</p>
                          <p className="text-[9px] text-muted-foreground">{t.dexId}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-foreground">{formatPrice(t.price)}</span>
                        <span className={cn("text-[10px] font-mono", t.change24h >= 0 ? "text-terminal-green" : "text-destructive")}>
                          {t.change24h >= 0 ? "+" : ""}{t.change24h.toFixed(0)}%
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </PanelShell>
          </WidgetErrorBoundary>
        </div>

        <div className="lg:col-span-3 space-y-3 sm:space-y-4">
          <WidgetErrorBoundary name="Snipe History">
            <PanelShell title="Snipe History" subtitle={`${wins.length} wins`} actions={<Link to="/sniper-mode" className="text-[10px] font-mono text-primary hover:underline">SNIPER</Link>}>
              {history.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-xs text-muted-foreground">No snipes recorded yet</p>
                  <Link to="/sniper-mode" className="text-[10px] font-mono text-primary hover:underline mt-1 block">Open Sniper →</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.slice(0, 5).map(s => (
                    <Link key={s.id} to={`/token/${s.token_address}`} className="flex items-center justify-between py-2 px-2 rounded hover:bg-muted/30 transition-colors">
                      <div className="min-w-0">
                        <p className="text-xs font-mono font-medium text-foreground truncate">{s.token_symbol}</p>
                        <p className="text-[9px] text-muted-foreground">{s.status} · Score {s.score}</p>
                      </div>
                      <StatusChip variant={(s.pnl_percent ?? 0) > 0 ? "success" : (s.pnl_percent ?? 0) < 0 ? "danger" : "muted"}>
                        {s.pnl_percent !== null ? `${s.pnl_percent > 0 ? "+" : ""}${s.pnl_percent.toFixed(1)}%` : s.state}
                      </StatusChip>
                    </Link>
                  ))}
                </div>
              )}
            </PanelShell>
          </WidgetErrorBoundary>

          <WidgetErrorBoundary name="Active Alerts">
            <PanelShell title="Active Alerts" subtitle={`${activeAlerts} enabled`} actions={<Link to="/alerts" className="text-[10px] font-mono text-primary hover:underline">VIEW ALL</Link>}>
              {alerts.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-xs text-muted-foreground">No alerts configured</p>
                  <Link to="/alerts" className="text-[10px] font-mono text-primary hover:underline mt-1 block">Create alerts →</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.slice(0, 4).map(a => (
                    <div key={a.id} className="p-2.5 rounded-lg border border-border/50 bg-muted/20">
                      <div className="flex items-center justify-between mb-1">
                        <StatusChip variant={a.enabled ? "success" : "muted"} dot>{a.kind.toUpperCase()}</StatusChip>
                        <span className="text-[9px] font-mono text-muted-foreground">{a.direction} {a.threshold}</span>
                      </div>
                      <p className="text-[11px] text-foreground leading-snug font-mono truncate">{a.address.slice(0, 12)}…</p>
                    </div>
                  ))}
                </div>
              )}
            </PanelShell>
          </WidgetErrorBoundary>

          <WidgetErrorBoundary name="Watchlist">
            <PanelShell title="Watchlist" actions={<Link to="/watchlist" className="text-[10px] font-mono text-primary hover:underline">FULL VIEW</Link>}>
              {watchlistItems.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No tokens watched yet</p>
              ) : (
                <div className="space-y-2">
                  {watchlistItems.slice(0, 4).map(item => (
                    <Link key={item.id} to={`/token/${item.address}`} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <Eye className="h-3 w-3 text-primary shrink-0" />
                        <span className="text-xs font-mono text-foreground truncate">{item.label || `${item.address.slice(0, 8)}…`}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </PanelShell>
          </WidgetErrorBoundary>

          <WidgetErrorBoundary name="Risk Warnings">
            <PanelShell title="Risk Warnings" subtitle="Flagged tokens">
              {rugWarnings.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center text-terminal-green">All clear — no risk flags</p>
              ) : (
                <div className="space-y-2">
                  {rugWarnings.map(t => (
                    <div key={t.address} className="flex items-center justify-between py-2 px-2 rounded bg-destructive/5 border border-destructive/10">
                      <div className="flex items-center gap-2 min-w-0">
                        <ShieldAlert className="h-3.5 w-3.5 text-destructive shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-mono font-medium text-foreground truncate">{t.symbol}</p>
                          <p className="text-[9px] text-muted-foreground truncate">{t.factors[0]}</p>
                        </div>
                      </div>
                      <StatusChip variant="danger">Score {t.score}</StatusChip>
                    </div>
                  ))}
                </div>
              )}
            </PanelShell>
          </WidgetErrorBoundary>
        </div>
      </div>
    </div>
  );
}
