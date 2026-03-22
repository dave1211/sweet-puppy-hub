import { Brain, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSmartMoney } from "@/hooks/useSmartMoney";

export function SmartMoneyPanel() {
  const { tokens, isLoading } = useSmartMoney();
  const sorted = [...tokens].sort((a, b) => b.walletCount - a.walletCount || b.latestTime - a.latestTime);
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-mono"><Brain className="h-4 w-4 text-terminal-cyan" />SMART MONEY</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        : sorted.length === 0 ? <p className="text-xs text-muted-foreground font-mono text-center py-4">No smart money signals yet</p>
        : <div className="space-y-1 max-h-[200px] overflow-y-auto">{sorted.map((t) => (
          <div key={t.tokenAddress} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-primary/5 transition-colors">
            <span className="text-[10px] font-mono text-foreground/90 truncate">{t.tokenSymbol || `${t.tokenAddress.slice(0, 6)}…`}</span>
            <span className="text-[9px] font-mono text-muted-foreground">{t.walletCount} wallet{t.walletCount !== 1 ? "s" : ""}</span>
          </div>
        ))}</div>}
      </CardContent>
    </Card>
  );
}