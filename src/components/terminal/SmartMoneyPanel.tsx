import { Brain, Loader2, TrendingUp, TrendingDown, ArrowRightLeft, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSmartMoneyFeed } from "@/hooks/useSmartMoneyFeed";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/services/walletClassification";

function timeAgo(ts: number): string {
  if (!ts) return "—";
  const diff = Math.floor(Date.now() / 1000 - ts);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const ACTION_ICONS = {
  buy: <TrendingUp className="h-3 w-3 text-terminal-green" />,
  sell: <TrendingDown className="h-3 w-3 text-terminal-red" />,
  transfer: <ArrowRightLeft className="h-3 w-3 text-terminal-amber" />,
  add_liquidity: <Zap className="h-3 w-3 text-terminal-cyan" />,
  unknown: <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />,
};

export function SmartMoneyPanel() {
  const { classifiedWallets, events, isLoading } = useSmartMoneyFeed();

  // Only show significant events or most recent 20
  const significantEvents = events.filter((e) => e.significant);
  const displayEvents = significantEvents.length > 0 ? significantEvents.slice(0, 20) : events.slice(0, 15);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-mono">
          <Brain className="h-4 w-4 text-terminal-cyan" />
          SMART MONEY INTEL
          {events.length > 0 && (
            <span className="text-[9px] bg-terminal-cyan/15 text-terminal-cyan px-1.5 py-0.5 rounded font-mono">
              {significantEvents.length > 0 ? `${significantEvents.length} SIG` : `${events.length}`}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : events.length === 0 ? (
          <p className="text-[10px] text-muted-foreground font-mono text-center py-4">
            Track wallets to see smart money activity
          </p>
        ) : (
          <Tabs defaultValue="feed" className="w-full">
            <TabsList className="w-full h-7 bg-muted/30 mb-2">
              <TabsTrigger value="feed" className="text-[10px] font-mono h-6 flex-1">FEED</TabsTrigger>
              <TabsTrigger value="wallets" className="text-[10px] font-mono h-6 flex-1">WALLETS</TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="mt-0">
              <div className="space-y-0.5 max-h-[260px] overflow-y-auto">
                {displayEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className={`flex items-start gap-2 rounded-md px-2 py-1.5 transition-colors ${
                      evt.significant ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{ACTION_ICONS[evt.action]}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-mono font-semibold ${CATEGORY_COLORS[evt.walletCategory]}`}>
                          {evt.walletLabel}
                        </span>
                        <span className="text-[9px] font-mono text-muted-foreground uppercase">{evt.action}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-foreground/90 truncate">
                          {evt.tokenSymbol || `${evt.tokenAddress.slice(0, 6)}…`}
                        </span>
                        {evt.size != null && evt.size > 0 && (
                          <span className="text-[9px] font-mono text-muted-foreground">
                            {evt.size.toFixed(2)} SOL
                          </span>
                        )}
                        {evt.significant && (
                          <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-terminal-cyan/30 text-terminal-cyan">
                            SIG
                          </Badge>
                        )}
                      </div>
                      <p className="text-[8px] font-mono text-muted-foreground/60">{timeAgo(evt.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="wallets" className="mt-0">
              <div className="space-y-1.5 max-h-[260px] overflow-y-auto">
                {classifiedWallets.map((w) => (
                  <div key={w.address} className="rounded-md border border-border/50 px-2.5 py-2 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-foreground/90 truncate">{w.label}</span>
                      <span className={`text-[9px] font-mono font-bold ${CATEGORY_COLORS[w.classification.category]}`}>
                        {CATEGORY_LABELS[w.classification.category]}
                      </span>
                    </div>
                    <p className="text-[8px] font-mono text-muted-foreground mt-0.5">{w.classification.reason}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[8px] font-mono text-muted-foreground/70">
                        {w.classification.evidence.totalTxCount} txs
                      </span>
                      <span className="text-[8px] font-mono text-muted-foreground/70">
                        {w.classification.evidence.uniqueTokens} tokens
                      </span>
                      <span className="text-[8px] font-mono text-muted-foreground/70">
                        conf: {w.classification.confidence}
                      </span>
                    </div>
                  </div>
                ))}
                {classifiedWallets.length === 0 && (
                  <p className="text-[10px] text-muted-foreground font-mono text-center py-3">No tracked wallets</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
