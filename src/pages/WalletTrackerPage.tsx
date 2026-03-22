import { useState } from "react";
import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { ScoreMeter } from "@/components/shared/ScoreMeter";
import { mockWallets } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Plus, Search, Wallet, Tag, Eye } from "lucide-react";
import { Link } from "react-router-dom";

export default function WalletTrackerPage() {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newAddr, setNewAddr] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const filtered = mockWallets.filter(w => !search || w.label.toLowerCase().includes(search.toLowerCase()) || w.address.includes(search));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-mono font-bold text-foreground">WALLET TRACKER</h1>
          <p className="text-xs font-mono text-muted-foreground">{mockWallets.length} wallets tracked</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary/10 text-primary text-xs font-mono border border-primary/30 hover:bg-primary/20 transition-colors">
          <Plus className="h-3.5 w-3.5" /> ADD WALLET
        </button>
      </div>

      {showAdd && (
        <div className="terminal-panel p-4 space-y-3">
          <h3 className="text-xs font-mono font-semibold text-foreground">Add Wallet</h3>
          <div className="flex gap-2">
            <input value={newAddr} onChange={e => setNewAddr(e.target.value)} placeholder="Wallet address..." className="flex-1 bg-muted/50 border border-border rounded px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50" />
            <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Label..." className="w-32 bg-muted/50 border border-border rounded px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50" />
            <button className="px-4 py-2 rounded bg-primary text-primary-foreground text-xs font-mono font-medium hover:bg-primary/90 transition-colors">TRACK</button>
          </div>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search wallets..." className="w-full bg-muted/50 border border-border rounded pl-8 pr-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(w => (
          <Link key={w.id} to={`/wallet/${w.id}`} className="terminal-panel p-4 space-y-3 hover:border-primary/20 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10"><Wallet className="h-4 w-4 text-primary" /></div>
                <div>
                  <p className="text-sm font-mono font-bold text-foreground">{w.label}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{w.address}</p>
                </div>
              </div>
              <StatusChip variant={w.type === "whale" ? "info" : w.type === "sniper" ? "success" : w.type === "degen" ? "warning" : "muted"}>
                {w.type.toUpperCase()}
              </StatusChip>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[9px] text-muted-foreground uppercase">Win Rate</p>
                <p className={cn("text-xs font-mono font-medium", w.winRate >= 70 ? "text-terminal-green" : "text-foreground")}>{w.winRate}%</p>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground uppercase">7d PnL</p>
                <p className={cn("text-xs font-mono font-medium", w.pnl7d >= 0 ? "text-terminal-green" : "text-destructive")}>{w.pnl7d >= 0 ? "+" : ""}{w.pnl7d.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground uppercase">Trust</p>
                <p className="text-xs font-mono font-medium text-foreground">{w.trustScore}</p>
              </div>
            </div>

            <ScoreMeter value={w.trustScore} label="TRUST" size="sm" />

            <p className="text-[10px] text-muted-foreground font-mono">{w.recentAction}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
