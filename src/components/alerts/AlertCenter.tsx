import { Bell, Check, Trash2, X, AlertTriangle, Info, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAlertStore } from "@/stores/alertStore";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import type { Alert, AlertSeverity } from "@/types/xrpl";

export function AlertCenter() {
  const { alerts, unreadCount, rules, isOpen, setOpen, markRead, markAllRead, dismissAlert, clearAll, toggleRule } = useAlertStore();
  const [tab, setTab] = useState<"feed" | "settings">("feed");

  const severityIcon = (s: AlertSeverity) => {
    switch (s) {
      case "critical": return <AlertTriangle className="h-3 w-3 text-destructive" />;
      case "warning": return <AlertTriangle className="h-3 w-3 text-terminal-amber" />;
      default: return <Info className="h-3 w-3 text-terminal-blue/60" />;
    }
  };

  return (
    <div className="terminal-panel">
      <div className="terminal-panel-header">
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <Bell className="h-3 w-3 text-muted-foreground/50" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-destructive flex items-center justify-center">
                <span className="text-[6px] font-mono text-white font-bold">{unreadCount > 9 ? "9+" : unreadCount}</span>
              </div>
            )}
          </div>
          <span className="terminal-panel-title">Alerts</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex gap-0.5 bg-muted/30 rounded p-0.5">
            {(["feed", "settings"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-1.5 py-0.5 text-[7px] font-mono uppercase rounded transition-all",
                  tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground/40"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          {tab === "feed" && alerts.length > 0 && (
            <button onClick={markAllRead} className="text-[7px] font-mono text-primary/50 hover:text-primary transition-colors px-1">
              Read all
            </button>
          )}
        </div>
      </div>

      {tab === "feed" ? (
        <div className="max-h-72 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-6 w-6 text-muted-foreground/10 mx-auto mb-2" />
              <p className="text-[9px] font-mono text-muted-foreground/30">No alerts yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {alerts.slice(0, 30).map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => markRead(alert.id)}
                  className={cn(
                    "px-3 py-2 flex items-start gap-2 cursor-pointer transition-colors",
                    alert.read ? "opacity-50" : "hover:bg-muted/10"
                  )}
                >
                  <div className="mt-0.5 shrink-0">{severityIcon(alert.severity)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-mono text-foreground/80 font-medium">{alert.title}</p>
                    <p className="text-[8px] font-mono text-muted-foreground/40 mt-0.5 leading-relaxed">{alert.message}</p>
                    <p className="text-[7px] font-mono text-muted-foreground/25 mt-1 tabular-nums">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); dismissAlert(alert.id); }}
                    className="p-0.5 hover:bg-muted/20 rounded shrink-0"
                  >
                    <X className="h-2.5 w-2.5 text-muted-foreground/30" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-2.5 space-y-1">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between py-1.5 px-1">
              <div className="flex items-center gap-2">
                <Zap className={cn("h-2.5 w-2.5", rule.enabled ? "text-primary/60" : "text-muted-foreground/20")} />
                <span className={cn("text-[10px] font-mono", rule.enabled ? "text-foreground/70" : "text-muted-foreground/30")}>
                  {rule.label}
                </span>
              </div>
              <Switch
                checked={rule.enabled}
                onCheckedChange={() => toggleRule(rule.id)}
                className="scale-75"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
