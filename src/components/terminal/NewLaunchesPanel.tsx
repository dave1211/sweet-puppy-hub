import { Rocket, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNewLaunches } from "@/hooks/useNewLaunches";
import { useSelectedToken } from "@/contexts/SelectedTokenContext";

export function NewLaunchesPanel() {
  const { data: launches, isLoading } = useNewLaunches();
  const { selectToken } = useSelectedToken();
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-mono"><Rocket className="h-4 w-4 text-terminal-amber" />NEW LAUNCHES</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        : !launches || launches.length === 0 ? <p className="text-[10px] text-muted-foreground font-mono text-center py-4">No launches found…</p>
        : <div className="space-y-1 max-h-[220px] overflow-y-auto">{launches.slice(0, 8).map((token) => (
          <div key={token.address} onClick={() => selectToken(token.address)} className="flex items-center justify-between rounded-md border border-border bg-muted/50 px-3 py-2 hover:bg-muted cursor-pointer transition-colors">
            <div className="min-w-0 flex-1"><p className="text-xs font-mono font-bold">{token.symbol}</p><p className="text-[10px] font-mono text-muted-foreground truncate">{token.dexId}</p></div>
            <div className="text-right shrink-0"><p className="text-[10px] font-mono">${token.price < 0.01 ? token.price.toFixed(6) : token.price.toFixed(4)}</p><p className={`text-[9px] font-mono ${token.change24h >= 0 ? "text-terminal-green" : "text-terminal-red"}`}>{token.change24h >= 0 ? "+" : ""}{token.change24h.toFixed(1)}%</p></div>
          </div>
        ))}</div>}
      </CardContent>
    </Card>
  );
}