/**
 * Alerts Center Page — premium terminal-style alert management.
 * Severity tabs, expandable details, source badges, timestamps.
 */
import { useState, useMemo, useCallback } from "react";
import {
  Bell, AlertTriangle, AlertCircle, Info, Shield, Rocket,
  Wallet, TrendingUp, Activity, Globe, CheckCheck, Trash2,
  ChevronDown, ChevronRight, Loader2, Plus, X
} from "lucide-react";
import { useSignalStore, filterSignals, severityCounts, type SignalSeverity, type TerminalSignal } from "@/stores/signalEngine";
import { useAlerts } from "@/hooks/useAlerts";
import { useAlertGenerator } from "@/hooks/useAlertGenerator";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useTrackedWallets } from "@/hooks/useTrackedWallets";
import { PanelShell } from "@/components/shared/PanelShell";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ─── Icon maps ─── */
const SEVERITY_ICON: Record<SignalSeverity, React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertCircle,
};

const SEVERITY_STYLES: Record<SignalSeverity, { border: string; bg: string; text: string; dot: string }> = {
  critical: { border: "border-terminal-red/20", bg: "bg-terminal-red/5", text: "text-terminal-red", dot: "status-dot-error" },
  warning: { border: "border-terminal-amber/20", bg: "bg-terminal-amber/5", text: "text-terminal-amber", dot: "status-dot-warn" },
  info: { border: "border-primary/15", bg: "bg-primary/5", text: "text-primary", dot: "status-dot-live" },
};

const CATEGORY_ICON: Record<string, React.ElementType> = {
  price: TrendingUp,
  risk: Shield,
  wallet_activity: Wallet,
  launch: Rocket,
  health: Globe,
  watchlist: Activity,
  system: AlertCircle,
  volume: TrendingUp,
  whale: Activity,
  liquidity: Activity,
  authority: Shield,
  deployer: Wallet,
};

function formatTimestamp(ts: number): string {
  const age = Date.now() - ts;
  if (age < 60_000) return "just now";
  if (age < 3600_000) return `${Math.floor(age / 60_000)}m ago`;
  if (age < 86400_000) return `${Math.floor(age / 3600_000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

/* ─── Alert Row (expandable) ─── */
function AlertRow({ signal }: { signal: TerminalSignal }) {
  const [expanded, setExpanded] = useState(false);
  const { markRead, dismiss } = useSignalStore();
  const style = SEVERITY_STYLES[signal.severity];
  const Icon = SEVERITY_ICON[signal.severity];
  const CatIcon = CATEGORY_ICON[signal.category] || Activity;

  const handleClick = () => {
    if (!signal.read) markRead(signal.id);
    setExpanded(!expanded);
  };

  return (
    <div className={cn(
      "rounded-lg border transition-all",
      style.border,
      signal.read ? "opacity-70" : style.bg,
    )}>
      <div
        onClick={handleClick}
        className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors"
      >
        <div className={cn("mt-0.5 shrink-0", style.text)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[11px] font-mono font-semibold text-foreground">{signal.title}</p>
            {!signal.read && <div className={cn("status-dot shrink-0", style.dot)} />}
          </div>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5 leading-relaxed">{signal.message}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={cn("text-[8px] font-mono px-1.5 py-0.5 rounded border", style.border, style.text)}>
              {signal.severity.toUpperCase()}
            </span>
            <span className="flex items-center gap-1 text-[8px] font-mono text-muted-foreground/60">
              <CatIcon className="h-2.5 w-2.5" />
              {signal.category.replace("_", " ").toUpperCase()}
            </span>
            <span className="text-[8px] font-mono text-muted-foreground/40 tabular-nums">
              {formatTimestamp(signal.timestamp)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {signal.detail && (
            expanded
              ? <ChevronDown className="h-3 w-3 text-muted-foreground/40" />
              : <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
          )}
          <button
            onClick={(e) => { e.stopPropagation(); dismiss(signal.id); }}
            className="p-1 rounded hover:bg-muted/30 text-muted-foreground/30 hover:text-destructive transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {expanded && signal.detail && (
        <div className="px-4 pb-3 pt-0">
          <div className="rounded-md bg-muted/30 border border-border/30 p-3">
            <p className="text-[10px] font-mono text-foreground/70 leading-relaxed">{signal.detail}</p>
            {signal.address && (
              <p className="text-[9px] font-mono text-muted-foreground/50 mt-2">
                Address: {signal.address}
              </p>
            )}
            <p className="text-[8px] font-mono text-muted-foreground/30 mt-1 tabular-nums">
              {new Date(signal.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Severity Tab Button ─── */
function SeverityTab({ severity, count, active, onClick }: {
  severity: SignalSeverity | "all";
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const style = severity !== "all" ? SEVERITY_STYLES[severity] : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono border transition-all",
        active
          ? style ? `${style.bg} ${style.border} ${style.text}` : "bg-primary/10 border-primary/30 text-primary"
          : "bg-card/30 border-border/30 text-muted-foreground hover:text-foreground hover:border-border/50"
      )}
    >
      {severity === "all" ? <Bell className="h-3 w-3" /> : (() => { const I = SEVERITY_ICON[severity]; return <I className="h-3 w-3" />; })()}
      <span>{severity === "all" ? "ALL" : severity.toUpperCase()}</span>
      {count > 0 && (
        <span className={cn(
          "text-[8px] font-mono px-1 py-0 rounded-full",
          active ? "bg-foreground/10" : "bg-muted/50"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

/* ─── Main Page ─── */
export default function AlertsCenterPage() {
  useAlertGenerator();

  const { signals, unreadCount, markAllRead, clearAll } = useSignalStore();
  const { alerts: configuredAlerts, isLoading: alertsLoading, addAlert, toggleAlert, removeAlert } = useAlerts();
  const { items: watchlistItems } = useWatchlist();
  const { wallets } = useTrackedWallets();
  const [severityFilter, setSeverityFilter] = useState<SignalSeverity | "all">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newDirection, setNewDirection] = useState("above");
  const [newThreshold, setNewThreshold] = useState("");

  const activeSignals = useMemo(() => {
    const base = signals.filter(s => !s.dismissed);
    if (severityFilter === "all") return base;
    return base.filter(s => s.severity === severityFilter);
  }, [signals, severityFilter]);

  const counts = useMemo(() => severityCounts(signals), [signals]);
  const totalActive = counts.critical + counts.warning + counts.info;

  const overallStatus = counts.critical > 0 ? "error" as const
    : counts.warning > 0 ? "warn" as const
    : totalActive > 0 ? "live" as const
    : "offline" as const;

  const handleCreate = useCallback(() => {
    if (!newAddress.trim() || !newThreshold) return;
    const val = parseFloat(newThreshold);
    if (isNaN(val) || val <= 0) { toast.error("Threshold must be positive"); return; }
    addAlert.mutate(
      { address: newAddress.trim(), kind: "price", threshold: val, direction: newDirection },
      {
        onSuccess: () => { setNewAddress(""); setNewThreshold(""); setShowCreate(false); toast.success("Alert created"); },
        onError: () => toast.error("Failed to create alert"),
      }
    );
  }, [newAddress, newThreshold, newDirection, addAlert]);

  return (
    <div className="space-y-5 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-mono font-bold text-foreground flex items-center gap-2">
            <Bell className="h-5 w-5 text-terminal-amber" />
            ALERTS CENTER
          </h1>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : "All clear"} · {configuredAlerts.filter(a => a.enabled).length} active rules
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-mono text-muted-foreground hover:text-foreground border border-border/30 hover:border-border/50 transition-colors">
              <CheckCheck className="h-3 w-3" /> READ ALL
            </button>
          )}
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-mono bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors"
          >
            <Plus className="h-3 w-3" /> NEW RULE
          </button>
        </div>
      </div>

      {/* Create alert rule */}
      {showCreate && (
        <PanelShell title="CREATE PRICE ALERT" subtitle="Set a threshold to monitor">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              value={newAddress}
              onChange={e => setNewAddress(e.target.value)}
              placeholder="Token address..."
              className="bg-muted/30 border border-border/50 rounded-lg px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40 sm:col-span-2"
            />
            <select
              value={newDirection}
              onChange={e => setNewDirection(e.target.value)}
              className="bg-muted/30 border border-border/50 rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            >
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
            <input
              value={newThreshold}
              onChange={e => setNewThreshold(e.target.value)}
              placeholder="$0.00"
              type="number"
              className="bg-muted/30 border border-border/50 rounded-lg px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={addAlert.isPending}
            className="mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-mono font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            CREATE ALERT
          </button>
        </PanelShell>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Signal feed */}
        <div className="lg:col-span-8 space-y-4">
          {/* Severity filter tabs */}
          <div className="flex flex-wrap gap-2">
            <SeverityTab severity="all" count={totalActive} active={severityFilter === "all"} onClick={() => setSeverityFilter("all")} />
            <SeverityTab severity="critical" count={counts.critical} active={severityFilter === "critical"} onClick={() => setSeverityFilter("critical")} />
            <SeverityTab severity="warning" count={counts.warning} active={severityFilter === "warning"} onClick={() => setSeverityFilter("warning")} />
            <SeverityTab severity="info" count={counts.info} active={severityFilter === "info"} onClick={() => setSeverityFilter("info")} />
          </div>

          {/* Alert feed */}
          {activeSignals.length === 0 ? (
            <div className="terminal-panel">
              <div className="py-16 text-center">
                <Bell className="h-10 w-10 text-muted-foreground/15 mx-auto mb-3" />
                <p className="text-sm font-mono text-muted-foreground/60">
                  {severityFilter === "all" ? "No alerts yet" : `No ${severityFilter} alerts`}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground/30 mt-1">
                  Alerts appear here as market conditions change
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {activeSignals.map(signal => (
                <AlertRow key={signal.id} signal={signal} />
              ))}
            </div>
          )}
        </div>

        {/* Right: Configured rules + summary */}
        <div className="lg:col-span-4 space-y-4">
          {/* Status summary */}
          <PanelShell title="ALERT STATUS" status={overallStatus}>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-lg font-mono font-bold text-terminal-red tabular-nums">{counts.critical}</p>
                <p className="text-[8px] font-mono text-muted-foreground uppercase">Critical</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-mono font-bold text-terminal-amber tabular-nums">{counts.warning}</p>
                <p className="text-[8px] font-mono text-muted-foreground uppercase">Warning</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-mono font-bold text-primary tabular-nums">{counts.info}</p>
                <p className="text-[8px] font-mono text-muted-foreground uppercase">Info</p>
              </div>
            </div>
          </PanelShell>

          {/* Alert sources */}
          <PanelShell title="ACTIVE SOURCES" subtitle="What's being monitored">
            <div className="space-y-2">
              {[
                { icon: TrendingUp, label: "Price Thresholds", status: configuredAlerts.filter(a => a.enabled).length > 0, count: configuredAlerts.filter(a => a.enabled).length },
                { icon: Activity, label: "Watchlist Movement", status: watchlistItems.length > 0, count: watchlistItems.length },
                { icon: Wallet, label: "Wallet Activity", status: wallets.length > 0, count: wallets.length },
                { icon: Rocket, label: "New Launches", status: true, count: null },
                { icon: Shield, label: "Risk Detection", status: true, count: null },
                { icon: Globe, label: "Chain Health", status: true, count: null },
              ].map(src => (
                <div key={src.label} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <src.icon className={cn("h-3 w-3", src.status ? "text-terminal-green" : "text-muted-foreground/30")} />
                    <span className="text-[10px] font-mono text-foreground/70">{src.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {src.count !== null && src.count > 0 && (
                      <span className="text-[8px] font-mono text-muted-foreground bg-muted/50 px-1 rounded">{src.count}</span>
                    )}
                    <div className={cn("status-dot", src.status ? "status-dot-live" : "status-dot-offline")} />
                  </div>
                </div>
              ))}
            </div>
          </PanelShell>

          {/* Configured alert rules */}
          <PanelShell title="PRICE RULES" subtitle={`${configuredAlerts.length} configured`}>
            {alertsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : configuredAlerts.length === 0 ? (
              <p className="text-[10px] font-mono text-muted-foreground/50 text-center py-4">
                No price rules set
              </p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {configuredAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2 transition-colors group",
                      alert.enabled
                        ? "border-border/50 bg-muted/20 hover:bg-muted/40"
                        : "border-border/20 bg-muted/10 opacity-50"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] font-mono text-foreground/80 truncate">
                        {alert.direction} ${alert.threshold}
                      </p>
                      <p className="text-[8px] font-mono text-muted-foreground/50 truncate">
                        {alert.address.slice(0, 10)}…{alert.address.slice(-4)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleAlert.mutate({ id: alert.id, enabled: !alert.enabled })}
                        className={cn(
                          "text-[8px] font-mono px-2 py-0.5 rounded border transition-colors",
                          alert.enabled
                            ? "bg-terminal-green/10 text-terminal-green border-terminal-green/20"
                            : "bg-muted/30 text-muted-foreground border-border/30"
                        )}
                      >
                        {alert.enabled ? "ON" : "OFF"}
                      </button>
                      <button
                        onClick={() => removeAlert.mutate(alert.id)}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground/30 hover:text-destructive transition-all"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PanelShell>

          {/* Scaffolded sources */}
          <PanelShell title="COMING SOON" subtitle="Planned alert sources">
            <div className="space-y-2">
              {[
                "Mint Authority Changes",
                "Freeze Authority Detection",
                "Holder Concentration Shifts",
                "Deployer Wallet Movement",
                "Liquidity Removal Detection",
                "Suspicious Token Patterns",
              ].map(label => (
                <div key={label} className="flex items-center gap-2 py-1">
                  <div className="status-dot status-dot-offline" />
                  <span className="text-[10px] font-mono text-muted-foreground/40">{label}</span>
                  <span className="text-[7px] font-mono px-1 py-0.5 rounded bg-muted/30 text-muted-foreground/30 ml-auto">PREVIEW</span>
                </div>
              ))}
            </div>
          </PanelShell>
        </div>
      </div>
    </div>
  );
}
