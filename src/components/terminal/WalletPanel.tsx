import { useState } from "react";
import { Wallet, Plus, X, Loader2, WifiOff, RefreshCw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTrackedWallets } from "@/hooks/useTrackedWallets";
import { useWalletActivity } from "@/hooks/useWalletActivity";
import { useWallet } from "@/contexts/WalletContext";
import { PanelShell } from "@/components/shared/PanelShell";
import { toast } from "sonner";

export function WalletPanel() {
  const { wallets, isLoading, addWallet, removeWallet } = useTrackedWallets();
  const { walletAddress, connected } = useWallet();
  const [showForm, setShowForm] = useState(false);
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const activeAddress = selectedWallet || (wallets.length > 0 ? wallets[0].address : null);
  const { data: activity, isLoading: activityLoading } = useWalletActivity(activeAddress);

  const handleAdd = () => {
    const addr = address.trim();
    if (!addr || addr.length < 32 || addr.length > 44) { toast.error("Invalid Solana wallet address"); return; }
    addWallet.mutate({ address: addr, label: label.trim() || undefined }, {
      onSuccess: () => { setAddress(""); setLabel(""); setShowForm(false); toast.success("Wallet tracked"); },
      onError: () => toast.error("Failed to add wallet"),
    });
  };

  const handleCopy = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PanelShell
      title="WALLET TRACKER"
      status={connected ? "live" : "offline"}
      glow={connected ? "blue" : "none"}
      actions={
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
        </Button>
      }
    >
      {/* Connected wallet display */}
      {connected && walletAddress && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="status-dot status-dot-live" />
              <span className="text-[10px] font-mono text-primary uppercase">Connected</span>
            </div>
            <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors">
              {copied ? <Check className="h-3 w-3 text-terminal-green" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
          <p className="text-[10px] font-mono text-foreground/70 mt-1.5 truncate">
            {walletAddress}
          </p>
        </div>
      )}

      {!connected && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 mb-3 text-center">
          <WifiOff className="h-5 w-5 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-[10px] font-mono text-muted-foreground">No wallet connected</p>
          <p className="text-[9px] font-mono text-muted-foreground/50 mt-0.5">Connect via the top bar</p>
        </div>
      )}

      {/* Add wallet form */}
      {showForm && (
        <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-3 mb-3">
          <Input placeholder="Wallet address..." value={address} onChange={(e) => setAddress(e.target.value)} className="h-8 font-mono text-xs bg-background" />
          <Input placeholder="Label (optional)..." value={label} onChange={(e) => setLabel(e.target.value)} className="h-8 text-xs bg-background" />
          <Button size="sm" className="w-full h-8 text-xs font-mono" onClick={handleAdd} disabled={addWallet.isPending}>
            {addWallet.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "TRACK WALLET"}
          </Button>
        </div>
      )}

      {/* Tracked wallets */}
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : wallets.length === 0 ? (
        <div className="text-center py-4">
          <Wallet className="h-6 w-6 text-muted-foreground/30 mx-auto" />
          <p className="text-[10px] text-muted-foreground font-mono mt-2">Track wallets to surface early activity</p>
        </div>
      ) : (
        <div className="space-y-1">
          {wallets.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedWallet(w.address)}
              className={`w-full text-left text-[10px] font-mono px-3 py-2 rounded-lg border transition-all flex items-center justify-between group ${
                activeAddress === w.address
                  ? "border-terminal-blue/30 bg-terminal-blue/5 text-terminal-blue"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-border/80"
              }`}
            >
              <span className="truncate">{w.label || `${w.address.slice(0, 6)}…${w.address.slice(-4)}`}</span>
              <button
                onClick={(e) => { e.stopPropagation(); removeWallet.mutate(w.id); }}
                className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity shrink-0 ml-2"
              >
                <X className="h-3 w-3" />
              </button>
            </button>
          ))}
        </div>
      )}

      {/* Recent activity for selected wallet */}
      {activeAddress && activity && activity.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider mb-2">Recent Activity</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {activity.slice(0, 5).map((tx) => (
              <div key={tx.signature} className="flex items-center justify-between text-[9px] font-mono px-2 py-1 rounded bg-muted/30">
                <span className="text-foreground/70 truncate">{tx.signature.slice(0, 12)}…</span>
                <span className={tx.err ? "text-terminal-red" : "text-terminal-green"}>
                  {tx.err ? "FAIL" : "OK"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </PanelShell>
  );
}
