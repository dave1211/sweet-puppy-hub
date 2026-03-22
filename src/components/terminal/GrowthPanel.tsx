import { Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUnifiedSignals } from "@/hooks/useUnifiedSignals";

export function GrowthPanel() {
  const { tokens } = useUnifiedSignals();
  const signalsToday = tokens.filter((t) => t.label === "HIGH SIGNAL").length;
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-mono"><Flame className="h-4 w-4 text-terminal-yellow" />GROWTH</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-1.5">
          <div className="rounded border border-border bg-muted/30 p-2 text-center"><p className="text-[8px] font-mono text-muted-foreground">SIGNALS</p><p className="text-sm font-mono font-bold text-terminal-green">{signalsToday}</p></div>
          <div className="rounded border border-border bg-muted/30 p-2 text-center"><p className="text-[8px] font-mono text-muted-foreground">WIN RATE</p><p className="text-sm font-mono font-bold text-foreground">—%</p></div>
          <div className="rounded border border-border bg-muted/30 p-2 text-center"><p className="text-[8px] font-mono text-muted-foreground">TRADES</p><p className="text-sm font-mono font-bold text-foreground">0</p></div>
        </div>
      </CardContent>
    </Card>
  );
}