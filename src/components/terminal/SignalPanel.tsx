import { Zap, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTrendingSignals } from "@/hooks/useNewLaunches";

export function SignalPanel() {
  const { data: trending, isLoading } = useTrendingSignals();
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-mono"><Zap className="h-4 w-4 text-terminal-green" />SNIPER SIGNALS</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        : !trending || trending.length === 0 ? <p className="text-[10px] text-muted-foreground font-mono text-center py-4">Scanning for signals…</p>
        : <div className="space-y-1 max-h-[260px] overflow-y-auto">{trending.slice(0, 10).map((token) => (
          <div key={token.address} className="flex items-center justify-between rounded-md border border-border bg-muted/50 px-3 py-2 hover:bg-muted transition-colors">
            <span className="text-xs font-mono font-bold">{token.symbol}</span>
            <span className={`text-[9px] font-mono ${token.change24h >= 0 ? "text-terminal-green" : "text-terminal-red"}`}>{token.change24h >= 0 ? "+" : ""}{token.change24h.toFixed(1)}%</span>
          </div>
        ))}</div>}
      </CardContent>
    </Card>
  );
}