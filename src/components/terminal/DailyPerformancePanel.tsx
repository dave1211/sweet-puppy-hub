import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUnifiedSignals } from "@/hooks/useUnifiedSignals";

export function DailyPerformancePanel() {
  const { tokens } = useUnifiedSignals();
  const signalsToday = tokens.filter((t) => t.label === "HIGH SIGNAL").length;
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-mono"><BarChart3 className="h-4 w-4 text-terminal-green" />DAILY PERFORMANCE</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded border border-border bg-muted/30 p-2.5 text-center"><p className="text-[8px] font-mono text-muted-foreground uppercase">Signals Today</p><p className="text-xl font-mono font-bold text-foreground">{signalsToday}</p></div>
          <div className="rounded border border-border bg-muted/30 p-2.5 text-center"><p className="text-[8px] font-mono text-muted-foreground uppercase">Win Rate</p><p className="text-xl font-mono font-bold text-muted-foreground">—</p></div>
        </div>
        <p className="text-[8px] text-muted-foreground/50 font-mono text-center mt-2">Simulated results · not financial advice</p>
      </CardContent>
    </Card>
  );
}