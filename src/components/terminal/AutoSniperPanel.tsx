import { Crosshair, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AutoSniperPanel() {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-mono">
          <Crosshair className="h-4 w-4 text-terminal-red" />AUTO SNIPER
          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-terminal-amber/15 text-terminal-amber border border-terminal-amber/30">DRY RUN</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-4 space-y-1">
          <Crosshair className="h-5 w-5 text-muted-foreground/30 mx-auto" />
          <p className="text-[10px] text-muted-foreground font-mono">Scaffold · No live execution · Preview only</p>
        </div>
      </CardContent>
    </Card>
  );
}