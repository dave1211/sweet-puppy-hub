import { Zap, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTrendingSignals } from "@/hooks/useNewLaunches";
import { useSelectedToken } from "@/contexts/SelectedTokenContext";
import { useNavigate } from "react-router-dom";
import { PlatformLinks, PlatformBadge } from "./PlatformLinks";

export function SignalPanel() {
  const { data: trending, isLoading } = useTrendingSignals();
  const { selectToken } = useSelectedToken();
  const navigate = useNavigate();

  const handleSnipe = (address: string, e: React.MouseEvent) => {
    e.stopPropagation();
    selectToken(address);
    navigate("/sniper");
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-mono"><Zap className="h-4 w-4 text-terminal-green" />SNIPER SIGNALS</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        : !trending || trending.length === 0 ? <p className="text-[10px] text-muted-foreground font-mono text-center py-4">Scanning for signals…</p>
        : <div className="space-y-1 max-h-[260px] overflow-y-auto">{trending.slice(0, 10).map((token) => (
          <div
            key={token.address}
            onClick={() => selectToken(token.address)}
            className="rounded-md border border-border bg-muted/50 px-3 py-2 hover:bg-muted cursor-pointer transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold group-hover:text-primary transition-colors">{token.symbol}</span>
                <PlatformBadge dexId={token.dexId} address={token.address} />
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-mono ${token.change24h >= 0 ? "text-terminal-green" : "text-terminal-red"}`}>{token.change24h >= 0 ? "+" : ""}{token.change24h.toFixed(1)}%</span>
                <button
                  onClick={(e) => handleSnipe(token.address, e)}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-terminal-green/10 text-terminal-green border border-terminal-green/20 hover:bg-terminal-green/25 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Zap className="h-2.5 w-2.5" />
                  BUY
                </button>
              </div>
            </div>
            <div className="mt-1">
              <PlatformLinks address={token.address} dexId={token.dexId} url={token.url} compact />
            </div>
          </div>
        ))}</div>}
      </CardContent>
    </Card>
  );
}
