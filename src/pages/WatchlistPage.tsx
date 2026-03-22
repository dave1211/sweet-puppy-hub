import { useState } from "react";
import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { cn } from "@/lib/utils";
import { Star, Plus, Bell, Trash2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { formatPrice } from "@/data/mockData";
import { toast } from "sonner";

export default function WatchlistPage() {
  const { items, isLoading, addItem, removeItem } = useWatchlist();
  const [newAddr, setNewAddr] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const addresses = items.map(i => i.address);
  const { data: prices } = useTokenPrices(addresses);

  const handleAdd = () => {
    if (!newAddr.trim()) return;
    addItem.mutate({ address: newAddr.trim(), label: newLabel.trim() || undefined }, {
      onSuccess: () => { setNewAddr(""); setNewLabel(""); toast.success("Token added to watchlist"); },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-mono font-bold text-foreground">WATCHLIST</h1>
          <p className="text-xs font-mono text-muted-foreground">{items.length} tokens tracked</p>
        </div>
      </div>

      <div className="terminal-panel p-4 space-y-3">
        <h3 className="text-xs font-mono font-semibold text-foreground">Add Token</h3>
        <div className="flex gap-2">
          <input value={newAddr} onChange={e => setNewAddr(e.target.value)} placeholder="Token contract address..." className="flex-1 bg-muted/50 border border-border rounded px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50" />
          <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Label..." className="w-28 bg-muted/50 border border-border rounded px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50" />
          <button onClick={handleAdd} disabled={addItem.isPending} className="px-4 py-2 rounded bg-primary text-primary-foreground text-xs font-mono font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Star className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs font-mono text-muted-foreground">Your watchlist is empty. Add token addresses above to track prices.</p>
        </div>
      ) : (
        <PanelShell title="Watched Tokens" subtitle={`${items.length} tokens`} noPad>
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-3">TOKEN</th>
                <th className="text-right p-3">PRICE</th>
                <th className="text-right p-3">24H</th>
                <th className="text-left p-3 hidden md:table-cell">ADDED</th>
                <th className="text-center p-3 w-20">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const priceData = prices?.[item.address];
                return (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <Link to={`/token/${item.address}`} className="flex items-center gap-2 hover:text-primary">
                        <Star className="h-3.5 w-3.5 text-terminal-amber fill-terminal-amber" />
                        <div>
                          <p className="font-medium text-foreground">{item.label || item.address.slice(0, 8) + "…"}</p>
                          <p className="text-[9px] text-muted-foreground">{item.address.slice(0, 12)}…</p>
                        </div>
                      </Link>
                    </td>
                    <td className="p-3 text-right text-foreground">{priceData ? formatPrice(priceData.price) : "—"}</td>
                    <td className={cn("p-3 text-right", priceData ? (priceData.change24h >= 0 ? "text-terminal-green" : "text-destructive") : "text-muted-foreground")}>
                      {priceData ? `${priceData.change24h >= 0 ? "+" : ""}${priceData.change24h.toFixed(1)}%` : "—"}
                    </td>
                    <td className="p-3 text-left hidden md:table-cell text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => removeItem.mutate(item.id)} className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </PanelShell>
      )}
    </div>
  );
}
