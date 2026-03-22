import { useState } from "react";
import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { mockAlerts } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Bell, Plus, Check, Clock, X, Filter } from "lucide-react";

const ALERT_TYPES = ["All", "Whale Buy", "Rug Warning", "Price Threshold", "Volume Spike", "New Launch", "AI Signal", "Risk Change", "Wallet Movement"];

export default function AlertsCenterPage() {
  const [typeFilter, setTypeFilter] = useState("All");
  const [showRead, setShowRead] = useState(true);

  const filtered = mockAlerts.filter(a => {
    if (typeFilter !== "All" && !a.type.includes(typeFilter.toLowerCase().replace(" ", "_"))) return false;
    if (!showRead && a.read) return false;
    return true;
  });

  const unread = mockAlerts.filter(a => !a.read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-mono font-bold text-foreground">ALERTS CENTER</h1>
          <p className="text-xs font-mono text-muted-foreground">{unread} unread alerts</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted/50 text-muted-foreground text-xs font-mono border border-border hover:text-foreground transition-colors">
            <Check className="h-3.5 w-3.5" /> MARK ALL READ
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary/10 text-primary text-xs font-mono border border-primary/30 hover:bg-primary/20 transition-colors">
            <Plus className="h-3.5 w-3.5" /> NEW ALERT
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
        {ALERT_TYPES.map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} className={cn("px-2.5 py-1.5 rounded text-[10px] font-mono border transition-colors", typeFilter === t ? "bg-primary/10 text-primary border-primary/30" : "bg-muted/30 text-muted-foreground border-border hover:text-foreground")}>
            {t}
          </button>
        ))}
        <button onClick={() => setShowRead(!showRead)} className={cn("px-2.5 py-1.5 rounded text-[10px] font-mono border transition-colors", !showRead ? "bg-primary/10 text-primary border-primary/30" : "bg-muted/30 text-muted-foreground border-border")}>
          {showRead ? "Show All" : "Unread Only"}
        </button>
      </div>

      {/* Alerts */}
      <div className="space-y-2">
        {filtered.map(a => (
          <div key={a.id} className={cn("terminal-panel p-4 flex items-start gap-3 transition-colors",
            !a.read && "border-l-2",
            a.severity === "critical" ? "border-l-destructive bg-destructive/5" :
            a.severity === "high" ? "border-l-terminal-amber" : ""
          )}>
            <div className={cn("p-2 rounded-lg shrink-0",
              a.severity === "critical" ? "bg-destructive/10" : a.severity === "high" ? "bg-terminal-amber/10" : "bg-muted"
            )}>
              <Bell className={cn("h-4 w-4",
                a.severity === "critical" ? "text-destructive" : a.severity === "high" ? "text-terminal-amber" : "text-muted-foreground"
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <StatusChip variant={a.severity === "critical" ? "danger" : a.severity === "high" ? "warning" : a.severity === "medium" ? "info" : "muted"}>
                  {a.severity.toUpperCase()}
                </StatusChip>
                <span className="text-xs font-mono font-bold text-primary">{a.token}</span>
                {!a.read && <span className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />}
              </div>
              <p className="text-sm text-foreground">{a.message}</p>
              <p className="text-[10px] font-mono text-muted-foreground mt-1">{a.timestamp}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                <Clock className="h-3.5 w-3.5" />
              </button>
              <button className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
