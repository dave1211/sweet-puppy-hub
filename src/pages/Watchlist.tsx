import { useState } from "react";
import { Plus, X, Eye, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { fetchTokenInfo } from "@/hooks/useTokenInfo";
import { toast } from "sonner";

const Watchlist = () => {
  const { items, isLoading, addItem, removeItem } = useWatchlist();
  const [address, setAddress] = useState(""); const [label, setLabel] = useState(""); const [copiedId, setCopiedId] = useState<string | null>(null); const [resolving, setResolving] = useState(false);
  const addresses = items.map((i) => i.address); const { data: prices } = useTokenPrices(addresses);
  const handleAdd = async () => { if (!address.trim()) { toast.error("Token address is required"); return; } setResolving(true); try { let resolvedLabel = label.trim() || undefined; const info = await fetchTokenInfo(address.trim()); if (!info && !resolvedLabel) { toast.error("Token not found"); return; } if (info && !resolvedLabel) resolvedLabel = info.symbol || info.name; addItem.mutate({ address: address.trim(), label: resolvedLabel }, { onSuccess: () => { setAddress(""); setLabel(""); toast.success("Token added"); }, onError: () => toast.error("Failed") }); } catch { toast.error("Network error"); } finally { setResolving(false); } };
  const handleCopy = (addr: string, id: string) => { navigator.clipboard.writeText(addr); setCopiedId(id); setTimeout(() => setCopiedId(null), 1500); };
  const isPending = addItem.isPending || resolving;
  return (
    <div className="space-y-6">
      <div><h2 className="text-lg font-mono font-bold flex items-center gap-2"><Eye className="h-5 w-5 text-primary" />WATCHLIST</h2><p className="text-sm text-muted-foreground mt-1">Track token addresses for quick access and monitoring.</p></div>
      <Card className="border-border bg-card"><CardHeader className="pb-3"><CardTitle className="text-sm font-mono">ADD TOKEN</CardTitle></CardHeader><CardContent className="space-y-3"><Input placeholder="Token address..." value={address} onChange={(e) => setAddress(e.target.value)} className="h-9 font-mono text-xs bg-background" /><Input placeholder="Label (auto-resolved if blank)" value={label} onChange={(e) => setLabel(e.target.value)} className="h-9 text-xs bg-background" /><Button size="sm" className="h-9 text-xs font-mono" onClick={handleAdd} disabled={isPending}>{isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}ADD TO WATCHLIST</Button></CardContent></Card>
      <Card className="border-border bg-card"><CardHeader className="pb-3"><CardTitle className="text-sm font-mono flex items-center justify-between"><span>TRACKED TOKENS</span><span className="text-xs text-muted-foreground font-normal">{items.length} token{items.length !== 1 ? "s" : ""}</span></CardTitle></CardHeader><CardContent>{isLoading ? <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> : items.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8 font-mono">No tokens tracked yet.</p> : <div className="space-y-2">{items.map((item) => { const priceData = prices?.[item.address]; return (<div key={item.id} className="flex items-center justify-between rounded-md border border-border bg-muted/50 px-4 py-3 group hover:bg-muted transition-colors"><div className="min-w-0 flex-1"><p className="text-sm font-medium">{item.label || "Unnamed Token"}</p><p className="text-xs font-mono text-muted-foreground truncate">{item.address}</p></div>{priceData && <div className="text-right mr-2"><p className="text-xs font-mono">${priceData.price < 0.01 ? priceData.price.toFixed(6) : priceData.price.toFixed(2)}</p><p className={`text-[10px] font-mono ${priceData.change24h >= 0 ? "text-terminal-green" : "text-terminal-red"}`}>{priceData.change24h >= 0 ? "+" : ""}{priceData.change24h.toFixed(1)}%</p></div>}<div className="flex items-center gap-1 shrink-0 ml-2"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(item.address, item.id)}>{copiedId === item.id ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3 text-muted-foreground" />}</Button><Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeItem.mutate(item.id)}><X className="h-3 w-3 text-destructive" /></Button></div></div>); })}</div>}</CardContent></Card>
    </div>
  );
};
export default Watchlist;