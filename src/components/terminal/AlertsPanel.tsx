import { useState } from "react";
import { Bell, Plus, X, Loader2, AlertTriangle, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAlerts } from "@/hooks/useAlerts";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { toast } from "sonner";

export function AlertsPanel() {
  const { alerts, isLoading, addAlert, toggleAlert, removeAlert } = useAlerts();
  const { items: watchlistItems } = useWatchlist();
  const [showForm, setShowForm] = useState(false);
  const [address, setAddress] = useState("");
  const [direction, setDirection] = useState("above");
  const [threshold, setThreshold] = useState("");

  const alertAddresses = [...new Set(alerts.map((a) => a.address))];
  const { data: prices } = useTokenPrices(alertAddresses);

  const handleAdd = () => {
    if (!address.trim() || !threshold.trim()) return;
    const t = parseFloat(threshold);
    if (isNaN(t) || t <= 0) { toast.error("Threshold must be a positive number"); return; }
    addAlert.mutate({ address: address.trim(), kind: "price", threshold: t, direction }, {
      onSuccess: () => { setAddress(""); setThreshold(""); setShowForm(false); toast.success("Alert created"); },
      onError: () => toast.error("Failed to create alert"),
    });
  };

  const getLabel = (addr: string) => {
    const item = watchlistItems.find((w) => w.address === addr);
    return item?.label || `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  };

  const categorized = alerts.map((alert) => {
    const priceData = prices?.[alert.address];
    const currentPrice = priceData?.price;
    const isTriggered = currentPrice !== undefined && ((alert.direction === "above" && currentPrice >= alert.threshold) || (alert.direction === "below" && currentPrice <= alert.threshold));
    return { ...alert, currentPrice, isTriggered };
  });

  const activeAlerts = categorized.filter((a) => a.enabled && !a.isTriggered);
  const triggeredAlerts = categorized.filter((a) => a.enabled && a.isTriggered);
  const disabledAlerts = categorized.filter((a) => !a.enabled);

  const renderAlertRow = (alert: typeof categorized[0]) => (
    <div key={alert.id} className={`flex items-center justify-between rounded-md border px-3 py-2 group transition-colors ${alert.isTriggered && alert.enabled ? "border-terminal-amber/50 bg-terminal-amber/10 hover:bg-terminal-amber/15" : !alert.enabled ? "border-border/50 bg-muted/30 opacity-60 hover:opacity-80" : "border-border bg-muted/50 hover:bg-muted"}`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {alert.isTriggered && alert.enabled && <AlertTriangle className="h-3 w-3 text-terminal-amber shrink-0" />}
          {!alert.enabled && <BellOff className="h-3 w-3 text-muted-foreground shrink-0" />}
          <p className="text-xs font-medium truncate">{getLabel(alert.address)}</p>
        </div>
        <p className="text-[10px] font-mono text-muted-foreground">
          {alert.direction} ${alert.threshold}
          {alert.currentPrice !== undefined && <span className="ml-1 text-foreground/60">· now ${alert.currentPrice < 0.01 ? alert.currentPrice.toFixed(6) : alert.currentPrice.toFixed(2)}</span>}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Switch checked={alert.enabled} onCheckedChange={(enabled) => toggleAlert.mutate({ id: alert.id, enabled })} className="scale-75" />
        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeAlert.mutate(alert.id)}><X className="h-3 w-3 text-destructive" /></Button>
      </div>
    </div>
  );

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-mono">
          <Bell className="h-4 w-4 text-terminal-amber" />ALERTS
          {triggeredAlerts.length > 0 && <span className="text-[9px] bg-terminal-amber/20 text-terminal-amber px-1.5 py-0.5 rounded font-mono">{triggeredAlerts.length} triggered</span>}
        </CardTitle>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4" /></Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {showForm && (
          <div className="space-y-2 rounded-md border border-border bg-muted p-3">
            <Input placeholder="Token address..." value={address} onChange={(e) => setAddress(e.target.value)} className="h-8 font-mono text-xs bg-background" />
            <div className="grid grid-cols-2 gap-2">
              <Select value={direction} onValueChange={setDirection}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="above">Price Above</SelectItem><SelectItem value="below">Price Below</SelectItem></SelectContent></Select>
              <Input placeholder="Threshold ($)" type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="h-8 text-xs bg-background" />
            </div>
            <Button size="sm" className="w-full h-8 text-xs font-mono" onClick={handleAdd} disabled={addAlert.isPending}>{addAlert.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "CREATE ALERT"}</Button>
          </div>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : alerts.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4 font-mono">No alerts configured</p>
        ) : (
          <div className="space-y-3">
            {triggeredAlerts.length > 0 && <div className="space-y-1"><p className="text-[9px] font-mono text-terminal-amber uppercase tracking-wider px-1">Triggered</p>{triggeredAlerts.map(renderAlertRow)}</div>}
            {activeAlerts.length > 0 && <div className="space-y-1">{triggeredAlerts.length > 0 && <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider px-1">Active</p>}{activeAlerts.map(renderAlertRow)}</div>}
            {disabledAlerts.length > 0 && <div className="space-y-1"><p className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-wider px-1">Disabled</p>{disabledAlerts.map(renderAlertRow)}</div>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}