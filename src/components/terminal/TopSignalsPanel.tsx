import { Target, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUnifiedSignals, UnifiedLabel } from "@/hooks/useUnifiedSignals";

const labelStyles: Record<UnifiedLabel, string> = {
  "HIGH SIGNAL": "bg-terminal-green/15 text-terminal-green border-terminal-green/30",
  MEDIUM: "bg-terminal-cyan/15 text-terminal-cyan border-terminal-cyan/30",
  LOW: "bg-muted text-muted-foreground border-border",
};

export function TopSignalsPanel() {
  const { tokens, isLoading } = useUnifiedSignals();
  const top = tokens.slice(0, 10);
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-mono"><Target className="h-4 w-4 text-terminal-green" />TOP SIGNALS{top.length > 0 && <span className="text-[9px] bg-terminal-green/15 text-terminal-green px-1.5 py-0.5 rounded font-mono">{top.filter((t) => t.label === "HIGH SIGNAL").length} high</span>}</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        : top.length === 0 ? <p className="text-[10px] text-muted-foreground font-mono text-center py-4">Scanning for signals…</p>
        : <div className="space-y-1 max-h-[300px] overflow-y-auto">{top.map((token, idx) => (
          <div key={token.address} className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-2.5 py-2 hover:bg-muted transition-colors">
            <span className="text-[10px] font-mono text-muted-foreground w-4 text-right shrink-0">{idx + 1}</span>
            <div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><span className="text-xs font-mono font-bold">{token.symbol}</span><span className={`text-[7px] font-mono px-1 py-0.5 rounded border ${labelStyles[token.label]}`}>{token.label}</span></div></div>
            <div className="text-right shrink-0"><p className="text-[10px] font-mono font-bold">{token.score}</p><p className={`text-[9px] font-mono ${token.change24h >= 0 ? "text-terminal-green" : "text-terminal-red"}`}>{token.change24h >= 0 ? "+" : ""}{token.change24h.toFixed(1)}%</p></div>
          </div>
        ))}</div>}
        <p className="text-[8px] text-muted-foreground/50 font-mono text-center mt-2">Heuristic ranking · not financial advice</p>
      </CardContent>
    </Card>
  );
}