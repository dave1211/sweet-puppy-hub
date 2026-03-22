import { useState, useEffect } from "react";
import { StatusChip } from "@/components/shared/StatusChip";
import { cn } from "@/lib/utils";
import { Plus, Search, Wallet, Trash2, Loader2, Zap, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useTrackedWallets } from "@/hooks/useTrackedWallets";
import { toast } from "sonner";

// Well-known Solana whale/smart-money wallets (real addresses)
const KNOWN_WHALES = [
  { address: "CKs1E69a2e9TmH4mKKLrXFF8kD3ZnwKjoEuXa6sz9WqX", label: "Jump Trading" },
  { address: "2AQdpHJ2JpcEgPiATUXjQxA8QmafFegfQwSLWSprPicm", label: "Coinbase" },
  { address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", label: "Binance" },
  { address: "H8sMJSCQxfKiFTCfDR3DUMLPwcRbM61LGFJ8N4dK3WjS", label: "Coinbase Custody" },
  { address: "4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T", label: "Alameda Research" },
  { address: "7rhxnLV8C8To5MqGkJYhQ86TiGGqRLsMzgTD2JoqJyyJ", label: "Raydium Authority" },
  { address: "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1", label: "Raydium Pool" },
  { address: "HWHvQhFmJB3NUcu1aihKmrKegfVxBEHzwVX6yZCKEsi1", label: "Phantom Whale" },
];

export default function WalletTrackerPage() {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newAddr, setNewAddr] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { wallets, isLoading, addWallet, removeWallet } = useTrackedWallets();

  const filtered = wallets.filter(w => !search || (w.label ?? "").toLowerCase().includes(search.toLowerCase()) || w.address.includes(search));

  const handleAdd = () => {
    if (!newAddr.trim()) return;
    addWallet.mutate({ address: newAddr.trim(), label: newLabel.trim() || undefined }, {
      onSuccess: () => { setNewAddr(""); setNewLabel(""); setShowAdd(false); toast.success("Wallet added — fetching on-chain activity…"); },
      onError: () => toast.error("Failed to add wallet"),
    });
  };

  const handleAddKnown = (whale: typeof KNOWN_WHALES[0]) => {
    if (wallets.some(w => w.address === whale.address)) {
      toast.info(`${whale.label} already tracked`);
      return;
    }
    addWallet.mutate({ address: whale.address, label: whale.label }, {
      onSuccess: () => toast.success(`Now tracking ${whale.label}`),
      onError: () => toast.error("Failed to add wallet"),
    });
  };

  const handleAddAllWhales = () => {
    let added = 0;
    for (const whale of KNOWN_WHALES) {
      if (!wallets.some(w => w.address === whale.address)) {
        addWallet.mutate({ address: whale.address, label: whale.label });
        added++;
      }
    }
    if (added > 0) toast.success(`Adding ${added} whale wallets — activity will load shortly`);
    else toast.info("All known whales already tracked");
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-lg font-mono font-bold text-foreground">WALLET TRACKER</h1>
          <p className="text-xs font-mono text-muted-foreground">{wallets.length} wallets tracked · Real on-chain data via Solana RPC</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSuggestions(!showSuggestions)} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-terminal-amber/10 text-terminal-amber text-xs font-mono border border-terminal-amber/30 hover:bg-terminal-amber/20 transition-colors">
            <Zap className="h-3.5 w-3.5" /> WHALE WALLETS
          </button>
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary/10 text-primary text-xs font-mono border border-primary/30 hover:bg-primary/20 transition-colors">
            <Plus className="h-3.5 w-3.5" /> ADD WALLET
          </button>
        </div>
      </div>

      {/* Known whale wallets suggestions */}
      {showSuggestions && (
        <div className="terminal-panel p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-semibold text-foreground">Known Whale & Smart Money Wallets</h3>
            <button onClick={handleAddAllWhales} className="text-[10px] font-mono px-2.5 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              TRACK ALL
            </button>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground">Real Solana addresses — activity fetched live from on-chain data</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {KNOWN_WHALES.map(whale => {
              const alreadyTracked = wallets.some(w => w.address === whale.address);
              return (
                <button
                  key={whale.address}
                  onClick={() => handleAddKnown(whale)}
                  disabled={alreadyTracked || addWallet.isPending}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                    alreadyTracked
                      ? "bg-terminal-green/5 border-terminal-green/20 cursor-default"
                      : "bg-muted/20 border-border hover:border-primary/30 hover:bg-primary/5"
                  )}
                >
                  <div className="p-1.5 rounded bg-terminal-amber/10 shrink-0">
                    <Wallet className="h-3.5 w-3.5 text-terminal-amber" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-mono font-medium text-foreground">{whale.label}</p>
                    <p className="text-[9px] font-mono text-muted-foreground truncate">{whale.address}</p>
                  </div>
                  {alreadyTracked && <StatusChip variant="success">TRACKED</StatusChip>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showAdd && (
        <div className="terminal-panel p-4 space-y-3">
          <h3 className="text-xs font-mono font-semibold text-foreground">Add Custom Wallet</h3>
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
        <div className="text-center py-16 space-y-3">
          <Wallet className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs font-mono text-muted-foreground">No wallets tracked yet.</p>
          <p className="text-[10px] font-mono text-muted-foreground">Click <strong className="text-terminal-amber">WHALE WALLETS</strong> above to start tracking real smart money addresses, or add your own custom wallet.</p>
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
                <Link to={`/wallet/${w.address}`} className="text-[10px] font-mono text-primary hover:underline flex items-center gap-1">
                  VIEW ACTIVITY <ExternalLink className="h-3 w-3" />
                </Link>
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
