import { useState } from "react";
import { StatusChip } from "@/components/shared/StatusChip";
import { cn } from "@/lib/utils";
import { Plus, Search, Wallet, Trash2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useTrackedWallets } from "@/hooks/useTrackedWallets";
import { toast } from "sonner";

export default function WalletTrackerPage() {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newAddr, setNewAddr] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const { wallets, isLoading, addWallet, removeWallet } = useTrackedWallets();

  const filtered = wallets.filter(w => !search || (w.label ?? "").toLowerCase().includes(search.toLowerCase()) || w.address.includes(search));

  const handleAdd = () => {
    if (!newAddr.trim()) return;
    addWallet.mutate({ address: newAddr.trim(), label: newLabel.trim() || undefined }, {
      onSuccess: () => { setNewAddr(""); setNewLabel(""); setShowAdd(false); toast.success("Wallet added"); },
      onError: () => toast.error("Failed to add wallet"),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-mono font-bold text-foreground">WALLET TRACKER</h1>
          <p className="text-xs font-mono text-muted-foreground">{wallets.length} wallets tracked</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary/10 text-primary text-xs font-mono border border-primary/30 hover:bg-primary/20 transition-colors">
          <Plus className="h-3.5 w-3.5" /> ADD WALLET
        </button>
      </div>

      {showAdd && (
        <div className="terminal-panel p-4 space-y-3">
          <h3 className="text-xs font-mono font-semibold text-foreground">Add Wallet</h3>
          <div className="flex gap-2">
            <input value={newAddr} onChange={e => setNewAddr(e.target.value)} placeholder="Solana wallet address..." className="flex-1 bg-muted/50 border border-border rounded px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50" />
            <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Label..." className="w-32 bg-muted/50 border border-border rounded px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50" />
            <button onClick={handleAdd} disabled={addWallet.isPending} className="px-4 py-2 rounded bg-primary text-primary-foreground text-xs font-mono font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
              {addWallet.isPending ? "…" : "TRACK"}
            </button>
          </div>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search wallets..." className="w-full bg-muted/50 border border-border rounded pl-8 pr-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-xs font-mono text-muted-foreground">Loading wallets…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Wallet className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs font-mono text-muted-foreground">No wallets tracked yet. Add a Solana wallet address to start monitoring.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(w => (
            <div key={w.id} className="terminal-panel p-4 space-y-3 hover:border-primary/20 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10"><Wallet className="h-4 w-4 text-primary" /></div>
                  <div>
                    <p className="text-sm font-mono font-bold text-foreground">{w.label || "Unnamed"}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{w.address.slice(0, 8)}…{w.address.slice(-4)}</p>
                  </div>
                </div>
                <StatusChip variant="info">LIVE</StatusChip>
              </div>
              <div className="flex items-center justify-between">
                <Link to={`/wallet/${w.address}`} className="text-[10px] font-mono text-primary hover:underline">VIEW ACTIVITY →</Link>
                <button onClick={() => removeWallet.mutate(w.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
