import { Crosshair, Power } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useSniperMode } from "@/hooks/useSniperMode";

export function SniperModePanel() {
  const { enabled, toggle } = useSniperMode();
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2"><CardTitle className="flex items-center justify-between text-sm font-mono"><span className="flex items-center gap-2"><Crosshair className="h-4 w-4 text-terminal-red" />SNIPER MODE<span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${enabled ? "bg-terminal-green/15 text-terminal-green border-terminal-green/30" : "bg-muted text-muted-foreground border-border"}`}>{enabled ? "ACTIVE" : "OFF"}</span></span><div className="flex items-center gap-2"><Power className={`h-3.5 w-3.5 ${enabled ? "text-terminal-green" : "text-muted-foreground"}`} /><Switch checked={enabled} onCheckedChange={toggle} /></div></CardTitle></CardHeader>
      <CardContent>
        <div className="text-center py-4 space-y-1"><p className="text-[10px] text-muted-foreground font-mono">{enabled ? "Scanning for entries..." : "Toggle ON to start simulating trades"}</p></div>
        <p className="text-[8px] text-muted-foreground/50 font-mono text-center">Simulation Only · No Real Trades</p>
      </CardContent>
    </Card>
  );
}