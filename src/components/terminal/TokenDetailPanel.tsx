import { useState } from "react";
import { TrendingUp, TrendingDown, BarChart3, Copy, Check, RefreshCw, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useTokenInfo } from "@/hooks/useTokenInfo";
import { useSelectedToken } from "@/contexts/SelectedTokenContext";
import { useSmartMoney } from "@/hooks/useSmartMoney";
import { useWhaleProfiles } from "@/hooks/useWhaleProfiles";
import { RugBadge, assessRug } from "./RugBadge";
import { toast } from "sonner";

function formatNumber(n: number): string { if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`; if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`; if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`; return `$${n.toFixed(2)}`; }
function formatPrice(p: number): string { if (p === 0) return "$0.00"; if (p < 0.0001) return `$${p.toFixed(10)}`; if (p < 0.01) return `$${p.toFixed(8)}`; if (p < 1) return `$${p.toFixed(4)}`; return `$${p.toFixed(2)}`; }

export function TokenDetailPanel() {
  const { items } = useWatchlist();
  const { selectedAddress: contextAddress, selectToken } = useSelectedToken();
  const { getTokenIntel } = useSmartMoney();
  const { tokenWhaleCount } = useWhaleProfiles();
  const [copied, setCopied] = useState(false);
  const displayAddress = contextAddress || (items.length > 0 ? items[0].address : null);
  const { data: tokenInfo, isLoading, dataUpdatedAt, refetch, isFetching } = useTokenInfo(displayAddress);

  const handleCopyAddress = () => { if (!displayAddress) return; navigator.clipboard.writeText(displayAddress); setCopied(true); toast.success("Address copied"); setTimeout(() => setCopied(false), 2000); };

  if (!displayAddress) return (<Card className="border-border bg-card"><CardContent className="py-12 text-center"><BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground font-mono">Add a token to your watchlist to view details</p></CardContent></Card>);
  if (isLoading || !tokenInfo) return (<Card className="border-border bg-card"><CardContent className="py-12 text-center space-y-2"><div className="h-4 w-24 bg-muted rounded animate-pulse mx-auto" /><div className="h-6 w-32 bg-muted rounded animate-pulse mx-auto" /><p className="text-[10px] text-muted-foreground font-mono mt-2">Fetching token intelligence…</p></CardContent></Card>);

  const isPositive = tokenInfo.change24h > 0;
  const lastRefresh = dataUpdatedAt ? new Date(dataUpdatedAt) : null;
  const rugAssessment = assessRug({ liquidity: tokenInfo.volume24h * 0.1, volume24h: tokenInfo.volume24h, change24h: tokenInfo.change24h, marketCap: tokenInfo.marketCap, price: tokenInfo.price });

  return (
    <div className="space-y-4">
      {items.length > 1 && (<div className="flex gap-1 flex-wrap">{items.map((item) => (<button key={item.id} onClick={() => selectToken(item.address)} className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${item.address === displayAddress ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>{item.label || item.address.slice(0, 6)}</button>))}</div>)}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3"><CardTitle className="flex items-center justify-between"><div className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-terminal-cyan" /><span className="font-mono text-sm">{tokenInfo.symbol}</span><span className="text-xs text-muted-foreground">{tokenInfo.name}</span></div><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => refetch()} disabled={isFetching}><RefreshCw className={`h-3 w-3 text-muted-foreground ${isFetching ? "animate-spin" : ""}`} /></Button></CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end justify-between"><div className="flex items-center gap-2"><p className="font-mono text-2xl font-bold">{formatPrice(tokenInfo.price)}</p><RugBadge assessment={rugAssessment} /></div><p className={`text-sm font-mono flex items-center gap-1 ${isPositive ? "text-terminal-green" : "text-terminal-red"}`}>{isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}{isPositive ? "+" : ""}{tokenInfo.change24h.toFixed(2)}%</p></div>
          <div className="grid grid-cols-2 gap-2">{[{ label: "Volume 24h", value: formatNumber(tokenInfo.volume24h) }, { label: "Market Cap", value: formatNumber(tokenInfo.marketCap) }].map((stat) => (<div key={stat.label} className="rounded-md border border-border bg-muted/50 p-2"><p className="text-[10px] text-muted-foreground font-mono uppercase">{stat.label}</p><p className="text-xs font-mono font-medium">{stat.value}</p></div>))}</div>
          <div className="rounded-md border border-border bg-muted/50 p-2"><p className="text-[10px] text-muted-foreground font-mono uppercase mb-1">Contract Address</p><div className="flex items-center gap-1.5"><p className="text-[10px] font-mono text-foreground/80 truncate flex-1">{displayAddress}</p><Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={handleCopyAddress}>{copied ? <Check className="h-3 w-3 text-terminal-green" /> : <Copy className="h-3 w-3 text-muted-foreground" />}</Button></div></div>
          {(() => { const intel = getTokenIntel(displayAddress); if (!intel) return null; const whaleC = tokenWhaleCount[displayAddress] ?? 0; const labelStyle = intel.label === "ACCUMULATING" ? "bg-terminal-green/10 text-terminal-green border-terminal-green/30" : intel.label === "ACTIVE" ? "bg-terminal-cyan/10 text-terminal-cyan border-terminal-cyan/30" : "bg-terminal-yellow/10 text-terminal-yellow border-terminal-yellow/30"; return (<div className="rounded-md border border-border bg-muted/50 p-2"><div className="flex items-center gap-1.5 mb-1"><Brain className="h-3 w-3 text-terminal-cyan" /><p className="text-[10px] text-muted-foreground font-mono uppercase">Wallet Intel</p></div><div className="flex items-center gap-2"><span className={`text-[8px] font-mono px-1 py-0.5 rounded border ${labelStyle}`}>{intel.label}</span>{whaleC > 0 && <span className="text-[8px] font-mono font-bold px-1 py-0.5 rounded border bg-terminal-blue/10 text-terminal-blue border-terminal-blue/30">🐋 {whaleC}</span>}<span className="text-[9px] font-mono text-muted-foreground">{intel.walletCount} wallet{intel.walletCount !== 1 ? "s" : ""}</span></div></div>); })()}
          <div className="flex items-center justify-between"><p className="text-[10px] text-muted-foreground font-mono">Live data · Multi-source</p>{lastRefresh && <p className="text-[10px] text-muted-foreground/60 font-mono">Updated {lastRefresh.toLocaleTimeString()}</p>}</div>
        </CardContent>
      </Card>
    </div>
  );
}