import { useState } from "react";
import { Wallet, Plus, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTrackedWallets } from "@/hooks/useTrackedWallets";
import { useWalletActivity } from "@/hooks/useWalletActivity";
import { toast } from "sonner";

export function WalletPanel() {
  const { wallets, isLoading, addWallet, removeWallet } = useTrackedWallets();
  const [showForm, setShowForm] = useState(false);
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const activeAddress = selectedWallet || (wallets.length > 0 ? wallets[0].address : null);
  const { data: activity, isLoading: activityLoading } = useWalletActivity(activeAddress);

  const handleAdd = () => {
    const addr = address.trim();
    if (!addr || addr.length < 32 || addr.length > 44) { toast.error("Invalid Solana wallet address"); return; }
    addWallet.mutate({ address: addr, label: label.trim() || undefined }, { onSuccess: () => { setAddress(""); setLabel(""); setShowForm(false); toast.success("Wallet tracked"); }, onError: () => toast.error("Failed to add wallet") });
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3"><CardTitle className="flex items-center gap-2 text-sm font-mono"><Wallet className="h-4 w-4 text-terminal-blue" />WALLET TRACKER</CardTitle><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4" /></Button></CardHeader>
      <CardContent className="space-y-2">
        {showForm && (<div className="space-y-2 rounded-md border border-border bg-muted p-3"><Input placeholder="Wallet address..." value={address} onChange={(e) => setAddress(e.target.value)} className="h-8 font-mono text-xs bg-background" /><Input placeholder="Label (optional)..." value={label} onChange={(e) => setLabel(e.target.value)} className="h-8 text-xs bg-background" /><Button size="sm" className="w-full h-8 text-xs font-mono" onClick={handleAdd} disabled={addWallet.isPending}>{addWallet.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "TRACK WALLET"}</Button></div>)}
        {isLoading ? <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        : wallets.length === 0 ? <div className="text-center py-4"><Wallet className="h-6 w-6 text-muted-foreground/40 mx-auto" /><p className="text-xs text-muted-foreground font-mono mt-2">Track wallets to surface early activity</p></div>
        : <div className="flex gap-1 flex-wrap">{wallets.map((w) => (<button key={w.id} onClick={() => setSelectedWallet(w.address)} className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors flex items-center gap-1 ${activeAddress === w.address ? "border-terminal-blue bg-terminal-blue/10 text-terminal-blue" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>{w.label || `${w.address.slice(0, 4)}…${w.address.slice(-4)}`}<button onClick={(e) => { e.stopPropagation(); removeWallet.mutate(w.id); }} className="hover:text-destructive"><X className="h-2.5 w-2.5" /></button></button>))}</div>}
      </CardContent>
    </Card>
  );
}