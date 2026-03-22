import { useState } from "react";
import { StatusChip } from "@/components/shared/StatusChip";
import { cn } from "@/lib/utils";
import { Bell, Plus, X, Loader2 } from "lucide-react";
import { useAlerts } from "@/hooks/useAlerts";
import { toast } from "sonner";

export default function AlertsCenterPage() {
  const { alerts, isLoading, addAlert, toggleAlert, removeAlert } = useAlerts();
  const [showCreate, setShowCreate] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newKind, setNewKind] = useState("price");
  const [newThreshold, setNewThreshold] = useState("");
  const [newDirection, setNewDirection] = useState("above");

  const handleCreate = () => {
    if (!newAddress.trim() || !newThreshold) return;
    addAlert.mutate({ address: newAddress.trim(), kind: newKind, threshold: parseFloat(newThreshold), direction: newDirection }, {
      onSuccess: () => { setNewAddress(""); setNewThreshold(""); setShowCreate(false); toast.success("Alert created"); },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-mono font-bold text-foreground">ALERTS CENTER</h1>
          <p className="text-xs font-mono text-muted-foreground">{alerts.filter(a => a.enabled).length} active alerts</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary/10 text-primary text-xs font-mono border border-primary/30 hover:bg-primary/20 transition-colors">
          <Plus className="h-3.5 w-3.5" /> NEW ALERT
        </button>
      </div>

      {showCreate && (
        <div className="terminal-panel p-4 space-y-3">
          <h3 className="text-xs font-mono font-semibold text-foreground">Create Alert</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="Token address..." className="bg-muted/50 border border-border rounded px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50" />
            <select value={newKind} onChange={e => setNewKind(e.target.value)} className="bg-muted/50 border border-border rounded px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
              <option value="price">Price</option>
              <option value="volume">Volume</option>
              <option value="liquidity">Liquidity</option>
            </select>
            <select value={newDirection} onChange={e => setNewDirection(e.target.value)} className="bg-muted/50 border border-border rounded px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
            <input value={newThreshold} onChange={e => setNewThreshold(e.target.value)} placeholder="Threshold value..." type="number" className="bg-muted/50 border border-border rounded px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50" />
          </div>
          <button onClick={handleCreate} disabled={addAlert.isPending} className="px-4 py-2 rounded bg-primary text-primary-foreground text-xs font-mono font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
            CREATE ALERT
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs font-mono text-muted-foreground">No alerts configured. Create one to monitor token prices, volume, or liquidity.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map(a => (
            <div key={a.id} className={cn("terminal-panel p-4 flex items-start gap-3 transition-colors", !a.enabled && "opacity-50")}>
              <div className={cn("p-2 rounded-lg shrink-0", a.enabled ? "bg-primary/10" : "bg-muted")}>
                <Bell className={cn("h-4 w-4", a.enabled ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <StatusChip variant={a.enabled ? "success" : "muted"} dot>{a.kind.toUpperCase()}</StatusChip>
                  <span className="text-xs font-mono text-foreground">{a.direction} {a.threshold}</span>
                </div>
                <p className="text-[11px] text-muted-foreground font-mono">{a.address.slice(0, 16)}…{a.address.slice(-4)}</p>
                <p className="text-[10px] font-mono text-muted-foreground mt-1">{new Date(a.created_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => toggleAlert.mutate({ id: a.id, enabled: !a.enabled })} className={cn("px-2 py-1 rounded text-[10px] font-mono border transition-colors", a.enabled ? "bg-terminal-amber/10 text-terminal-amber border-terminal-amber/30" : "bg-terminal-green/10 text-terminal-green border-terminal-green/30")}>
                  {a.enabled ? "PAUSE" : "ENABLE"}
                </button>
                <button onClick={() => removeAlert.mutate(a.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
