import { useState } from "react";
import { Plus, X, Eye, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { useTokenSignals } from "@/hooks/useTokenSignals";
import { useSelectedToken } from "@/contexts/SelectedTokenContext";
import { fetchTokenInfo } from "@/hooks/useTokenInfo";
import { toast } from "sonner";

export function WatchlistPanel() {
  const { items, isLoading, addItem, removeItem } = useWatchlist();
  const { selectToken } = useSelectedToken();
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [resolving, setResolving] = useState(false);
  const addresses = items.map((i) => i.address);
  const { data: prices } = useTokenPrices(addresses);
  const signals = useTokenSignals(prices);

  const handleManualAdd = async () => {
    const raw = query.trim();
    if (!raw) return;
    setResolving(true);
    try {
      const info = await fetchTokenInfo(raw);
      if (!info) { toast.error("Token not found"); return; }
      const label = info.symbol || info.name;
      selectToken(raw);
      addItem.mutate({ address: raw, label }, { onSuccess: () => { setQuery(""); setShowForm(false); toast.success("Token added"); }, onError: () => toast.error("Failed to add") });
    } catch { toast.error("Network error"); } finally { setResolving(false); }
  };

  const isPending = addItem.isPending || resolving;
  const signalBadgeClass = (type: string) => { switch (type) { case "momentum": return "bg-terminal-green/15 text-terminal-green border-terminal-green/30"; case "volatile": return "bg-terminal-red/15 text-terminal-red border-terminal-red/30"; case "watch": return "bg-terminal-amber/15 text-terminal-amber border-terminal-amber/30"; default: return ""; } };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3"><CardTitle className="flex items-center gap-2 text-sm font-mono"><Eye className="h-4 w-4 text-primary" />WATCHLIST</CardTitle><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4" /></Button></CardHeader>
      <CardContent className="space-y-2">
        {showForm && (<div className="space-y-2 rounded-md border border-border bg-muted p-3"><div className="relative"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" /><Input placeholder="Search token or paste address…" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleManualAdd()} className="h-8 font-mono text-xs bg-background pl-7" /></div><Button size="sm" className="w-full h-8 text-xs font-mono" onClick={handleManualAdd} disabled={isPending || !query.trim()}>{isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "ADD BY ADDRESS"}</Button></div>)}
        {isLoading ? <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        : items.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4 font-mono">No tokens tracked yet</p>
        : <div className="space-y-1">{items.map((item) => { const priceData = prices?.[item.address]; const isUp = priceData && priceData.change24h >= 0; const signal = signals[item.address]; return (
          <div key={item.id} onClick={() => selectToken(item.address)} className="flex items-center justify-between rounded-md border border-border bg-muted/50 px-3 py-2.5 group hover:bg-muted transition-colors cursor-pointer">
            <div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><p className="text-xs font-bold truncate">{item.label || "Unnamed"}</p>{signal && <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${signalBadgeClass(signal.signal!)}`}>{signal.label}</span>}</div><p className="text-[10px] font-mono text-muted-foreground truncate">{item.address.slice(0, 6)}…{item.address.slice(-4)}</p></div>
            <div className="text-right mr-2 shrink-0">{priceData ? <><p className="text-xs font-mono font-medium">${priceData.price < 0.01 ? priceData.price.toFixed(6) : priceData.price.toFixed(2)}</p><p className={`text-[10px] font-mono ${isUp ? "text-terminal-green" : "text-terminal-red"}`}>{isUp ? "▲" : "▼"} {Math.abs(priceData.change24h).toFixed(1)}%</p></> : <p className="text-[10px] font-mono text-muted-foreground">—</p>}</div>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => { e.stopPropagation(); removeItem.mutate(item.id); }}><X className="h-3 w-3 text-destructive" /></Button>
          </div>
        ); })}</div>}
      </CardContent>
    </Card>
  );
}