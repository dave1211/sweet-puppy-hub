import { Target, Loader2, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUnifiedSignals, UnifiedLabel } from "@/hooks/useUnifiedSignals";
import { PlatformLinks, PlatformBadge } from "./PlatformLinks";
import { useSelectedToken } from "@/contexts/SelectedTokenContext";
import { useNavigate } from "react-router-dom";

const labelStyles: Record<UnifiedLabel, string> = {
  "HIGH SIGNAL": "bg-terminal-green/15 text-terminal-green border-terminal-green/30",
  MEDIUM: "bg-terminal-cyan/15 text-terminal-cyan border-terminal-cyan/30",
  LOW: "bg-muted text-muted-foreground border-border",
};

export function TopSignalsPanel() {
  const { tokens, isLoading } = useUnifiedSignals();
  const { selectToken } = useSelectedToken();
  const navigate = useNavigate();
  const top = tokens.slice(0, 10);

  const handleSnipe = (address: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Pre-select token and navigate to sniper
    selectToken(address);
    navigate("/sniper");
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-mono"><Target className="h-4 w-4 text-terminal-green" />TOP SIGNALS{top.length > 0 && <span className="text-[9px] bg-terminal-green/15 text-terminal-green px-1.5 py-0.5 rounded font-mono">{top.filter((t) => t.label === "HIGH SIGNAL").length} high</span>}</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        : top.length === 0 ? <p className="text-[10px] text-muted-foreground font-mono text-center py-4">Scanning for signals…</p>
        : <div className="space-y-1 max-h-[300px] overflow-y-auto">{top.map((token, idx) => (
          <div
            key={token.address}
            onClick={() => selectToken(token.address)}
            className="rounded-md border border-border bg-muted/50 px-2.5 py-2 hover:bg-muted transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted-foreground w-4 text-right shrink-0">{idx + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold group-hover:text-primary transition-colors">{token.symbol}</span>
                  <span className={`text-[7px] font-mono px-1 py-0.5 rounded border ${labelStyles[token.label]}`}>{token.label}</span>
                  <PlatformBadge dexId={token.dexId} address={token.address} />
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <p className="text-[10px] font-mono font-bold">{token.score}</p>
                  <p className={`text-[9px] font-mono ${token.change24h >= 0 ? "text-terminal-green" : "text-terminal-red"}`}>{token.change24h >= 0 ? "+" : ""}{token.change24h.toFixed(1)}%</p>
                </div>
                {/* Quick Snipe Button */}
                <button
                  onClick={(e) => handleSnipe(token.address, e)}
                  className="flex items-center gap-0.5 px-1.5 py-1 rounded text-[8px] font-mono font-bold bg-terminal-green/10 text-terminal-green border border-terminal-green/20 hover:bg-terminal-green/25 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Zap className="h-2.5 w-2.5" />
                  BUY
                </button>
              </div>
            </div>
            <div className="ml-6 mt-1 flex items-center gap-1.5">
              <PlatformLinks address={token.address} dexId={token.dexId} url={token.url} compact />
            </div>
          </div>
        ))}</div>}
        <p className="text-[8px] text-muted-foreground/50 font-mono text-center mt-2">Heuristic ranking · not financial advice</p>
      </CardContent>
    </Card>
  );
}
