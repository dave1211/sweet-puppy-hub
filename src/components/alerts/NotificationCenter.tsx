/**
 * Notification Center — slide-out panel with filters and grouped signals.
 * Lazy-loadable, error-isolated, non-blocking.
 */
import { useState, useMemo } from "react";
import {
  Bell, X, Check, CheckCheck, Trash2, Filter,
  AlertTriangle, Info, AlertCircle, Globe, Shield, Activity, ArrowRightLeft
} from "lucide-react";
import { useSignalStore, filterSignals, type SignalSeverity, type SignalSource, type TerminalSignal } from "@/stores/signalEngine";
import { StatusChip } from "@/components/shared/StatusChip";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const SEVERITY_ICON: Record<SignalSeverity, React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertCircle,
};

const SEVERITY_VARIANT: Record<SignalSeverity, "info" | "warning" | "danger"> = {
  info: "info",
  warning: "warning",
  critical: "danger",
};

const SOURCE_ICON: Record<SignalSource, React.ElementType> = {
  dashboard: Activity,
  multichain: Globe,
  compliance: Shield,
  bridge: ArrowRightLeft,
  system: AlertCircle,
};

function SignalRow({ signal }: { signal: TerminalSignal }) {
  const { markRead, dismiss } = useSignalStore();
  const Icon = SEVERITY_ICON[signal.severity];
  const age = Date.now() - signal.timestamp;
  const ageLabel = age < 60_000 ? "just now" : age < 3600_000 ? `${Math.floor(age / 60_000)}m ago` : `${Math.floor(age / 3600_000)}h ago`;

  return (
    <div className={cn(
      "px-3 py-2.5 border-b border-border/30 transition-colors",
      signal.read ? "opacity-60" : "bg-card/20"
    )}>
      <div className="flex items-start gap-2">
        <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0",
          signal.severity === "critical" ? "text-destructive" :
          signal.severity === "warning" ? "text-terminal-amber" : "text-primary"
        )} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-mono font-medium text-foreground truncate">{signal.title}</p>
            <span className="text-[8px] font-mono text-muted-foreground shrink-0">{ageLabel}</span>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5 leading-snug">{signal.message}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <StatusChip variant={SEVERITY_VARIANT[signal.severity]}>{signal.severity.toUpperCase()}</StatusChip>
            {signal.chainId && (
              <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-muted/30 text-muted-foreground">{signal.chainId.toUpperCase()}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {!signal.read && (
            <button onClick={() => markRead(signal.id)} className="p-0.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground">
              <Check className="h-3 w-3" />
            </button>
          )}
          <button onClick={() => dismiss(signal.id)} className="p-0.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function NotificationCenter() {
  const { signals, unreadCount, markAllRead, clearAll } = useSignalStore();
  const [sourceFilter, setSourceFilter] = useState<SignalSource | "all">("all");

  const filtered = useMemo(() => {
    const f = sourceFilter === "all" ? {} : { source: sourceFilter as SignalSource };
    return filterSignals(signals, f);
  }, [signals, sourceFilter]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative p-1.5 rounded hover:bg-muted/50 transition-colors">
          <Bell className="h-4 w-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-destructive flex items-center justify-center">
              <span className="text-[7px] font-mono text-white font-bold">{unreadCount > 99 ? "99" : unreadCount}</span>
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 sm:w-96 p-0 bg-background border-border">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm font-mono font-bold text-foreground">NOTIFICATIONS</SheetTitle>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground" title="Mark all read">
                  <CheckCheck className="h-3.5 w-3.5" />
                </button>
              )}
              {signals.length > 0 && (
                <button onClick={clearAll} className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-destructive" title="Clear all">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </SheetHeader>

        {/* Source filter tabs */}
        <div className="px-3 py-2 border-b border-border/50">
          <div className="flex flex-wrap gap-1">
            {(["all", "dashboard", "multichain", "compliance", "bridge", "system"] as const).map(src => (
              <button
                key={src}
                onClick={() => setSourceFilter(src)}
                className={cn(
                  "px-2 py-0.5 rounded text-[9px] font-mono border transition-colors",
                  sourceFilter === src
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-card/30 border-border/30 text-muted-foreground hover:text-foreground"
                )}
              >
                {src.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Signal list */}
        <div className="overflow-y-auto max-h-[calc(100vh-160px)]">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-[10px] font-mono text-muted-foreground">No signals</p>
            </div>
          ) : (
            filtered.map(s => <SignalRow key={s.id} signal={s} />)
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
