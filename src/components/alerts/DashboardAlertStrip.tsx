/**
 * Compact alert strip for the main dashboard.
 * Shows only top-priority unread signals. Never heavy.
 */
import { useSignalStore, filterSignals } from "@/stores/signalEngine";
import { AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export function DashboardAlertStrip() {
  const { signals, dismiss } = useSignalStore();

  const urgent = useMemo(() =>
    filterSignals(signals, { showDismissed: false })
      .filter(s => !s.read)
      .slice(0, 3),
    [signals]
  );

  if (urgent.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {urgent.map(s => (
        <div
          key={s.id}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-mono",
            s.severity === "critical"
              ? "bg-destructive/5 border-destructive/20 text-destructive"
              : s.severity === "warning"
              ? "bg-terminal-amber/5 border-terminal-amber/20 text-terminal-amber"
              : "bg-primary/5 border-primary/20 text-primary"
          )}
        >
          {s.severity === "critical" ? <AlertCircle className="h-3 w-3 shrink-0" /> :
           s.severity === "warning" ? <AlertTriangle className="h-3 w-3 shrink-0" /> :
           <Info className="h-3 w-3 shrink-0" />}
          <span className="flex-1 truncate">{s.title}: {s.message}</span>
          <button onClick={() => dismiss(s.id)} className="shrink-0 p-0.5 rounded hover:bg-background/50">
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
