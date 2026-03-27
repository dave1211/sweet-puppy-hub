import { useState } from "react";
import {
  Wallet, Plus, Shield, Tag, Trash2, Star, Eye, Zap,
  FlaskConical, Landmark, HelpCircle, ChevronDown, ChevronUp,
  AlertTriangle, Activity, Layers
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useWalletProfiles } from "@/hooks/useWalletProfiles";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";
import type { WalletRole } from "@/stores/walletProfileStore";

const ROLE_CONFIG: Record<WalletRole, { icon: typeof Wallet; label: string; color: string }> = {
  trading: { icon: Zap, label: "TRADING", color: "text-primary" },
  treasury: { icon: Landmark, label: "TREASURY", color: "text-terminal-cyan" },
  watch_only: { icon: Eye, label: "WATCH-ONLY", color: "text-terminal-yellow" },
  experimental: { icon: FlaskConical, label: "EXPERIMENTAL", color: "text-terminal-amber" },
  unknown: { icon: HelpCircle, label: "UNASSIGNED", color: "text-muted-foreground" },
};

const ALL_ROLES: WalletRole[] = ["trading", "treasury", "watch_only", "experimental", "unknown"];

export function WalletsOverviewPanel() {
  const { profiles, isLoading, addWallet, updateWallet, removeWallet } = useWalletProfiles();
  const { walletAddress, isConnected } = useWallet();
  const [showAdd, setShowAdd] = useState(false);
  const [newAddr, setNewAddr] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newRole, setNewRole] = useState<WalletRole>("unknown");
  const [newWatchOnly, setNewWatchOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAddConnected = () => {
    if (!walletAddress) { toast.error("No wallet connected"); return; }
    addWallet({ address: walletAddress, isPrimary: profiles.length === 0 });
  };

  const handleAddManual = () => {
    const addr = newAddr.trim();
    if (!addr || addr.length < 32) { toast.error("Enter a valid wallet address"); return; }
    addWallet({ address: addr, label: newLabel.trim() || undefined, role: newRole, isWatchOnly: newWatchOnly });
    setNewAddr(""); setNewLabel(""); setNewRole("unknown"); setNewWatchOnly(false); setShowAdd(false);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-mono">
            <Layers className="h-4 w-4 text-primary" />
            WALLETS ({profiles.length})
          </div>
          <div className="flex gap-1">
            {isConnected && !profiles.some(p => p.address === walletAddress) && (
              <Button size="sm" variant="outline" onClick={handleAddConnected} className="h-6 text-[9px] font-mono">
                <Plus className="h-3 w-3 mr-1" />ADD CONNECTED
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)} className="h-6 text-[9px] font-mono">
              <Plus className="h-3 w-3 mr-1" />{showAdd ? "CANCEL" : "ADD"}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Add form */}
        {showAdd && (
          <div className="p-2 border border-border/60 rounded bg-background/50 space-y-1.5">
            <Input placeholder="Wallet address" value={newAddr} onChange={e => setNewAddr(e.target.value)} className="h-7 text-[10px] font-mono bg-background" />
            <Input placeholder="Label (optional)" value={newLabel} onChange={e => setNewLabel(e.target.value)} className="h-7 text-[10px] font-mono bg-background" />
            <div className="flex gap-1 flex-wrap">
              {ALL_ROLES.map(r => {
                const rc = ROLE_CONFIG[r];
                return (
                  <button key={r} onClick={() => setNewRole(r)} className={cn(
                    "text-[8px] font-mono px-1.5 py-0.5 rounded border transition-all",
                    newRole === r ? `${rc.color} border-current bg-current/10` : "text-muted-foreground/40 border-border/30"
                  )}>{rc.label}</button>
                );
              })}
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground">
                <input type="checkbox" checked={newWatchOnly} onChange={e => setNewWatchOnly(e.target.checked)} className="rounded" />
                Watch-only
              </label>
              <Button size="sm" onClick={handleAddManual} className="h-6 text-[9px] font-mono bg-primary/15 text-primary border border-primary/25 hover:bg-primary/25">
                ADD WALLET
              </Button>
            </div>
          </div>
        )}

        {/* Wallet list */}
        {isLoading && <p className="text-[9px] font-mono text-muted-foreground text-center py-4">Loading wallets…</p>}
        {!isLoading && profiles.length === 0 && (
          <p className="text-[9px] font-mono text-muted-foreground/60 text-center py-4">
            No wallets configured. Connect a wallet or add one manually.
          </p>
        )}

        {profiles.map(p => {
          const rc = ROLE_CONFIG[p.role];
          const RoleIcon = rc.icon;
          const isExpanded = expandedId === p.id;
          const isCurrent = p.address === walletAddress;

          return (
            <div key={p.id} className={cn(
              "border rounded p-2 transition-all",
              isCurrent ? "border-primary/30 bg-primary/5" : "border-border/40 bg-background/30"
            )}>
              {/* Header */}
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                <RoleIcon className={cn("h-3.5 w-3.5 shrink-0", rc.color)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-foreground truncate">
                      {p.label || `${p.address.slice(0, 6)}…${p.address.slice(-4)}`}
                    </span>
                    {p.isPrimary && <Star className="h-3 w-3 text-terminal-yellow fill-terminal-yellow/30" />}
                    {isCurrent && <Badge variant="outline" className="text-[6px] px-1 py-0 h-3 font-mono border-primary/30 text-primary">ACTIVE</Badge>}
                  </div>
                  <p className="text-[8px] font-mono text-muted-foreground/50 truncate">{p.address}</p>
                </div>
                <Badge variant="outline" className={cn("text-[7px] px-1 py-0 h-4 font-mono border-current shrink-0", rc.color)}>{rc.label}</Badge>
                {isExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground/40" /> : <ChevronDown className="h-3 w-3 text-muted-foreground/40" />}
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-2 pt-2 border-t border-border/30 space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-[8px] font-mono">
                    <div><span className="text-muted-foreground/50 block">CHAIN</span><span className="text-foreground">{p.chain.toUpperCase()}</span></div>
                    <div><span className="text-muted-foreground/50 block">TYPE</span><span className={rc.color}>{p.isWatchOnly ? "WATCH-ONLY" : "FULL"}</span></div>
                    <div><span className="text-muted-foreground/50 block">RISK</span><span className="text-muted-foreground">{p.riskLevel ?? "—"}</span></div>
                  </div>

                  {/* Role selector */}
                  <div>
                    <span className="text-[7px] font-mono text-muted-foreground/40 mb-1 block">ASSIGN ROLE</span>
                    <div className="flex gap-1 flex-wrap">
                      {ALL_ROLES.map(r => {
                        const rr = ROLE_CONFIG[r];
                        return (
                          <button key={r} onClick={() => updateWallet({ id: p.id, role: r })} className={cn(
                            "text-[7px] font-mono px-1 py-0.5 rounded border transition-all",
                            p.role === r ? `${rr.color} border-current bg-current/10` : "text-muted-foreground/30 border-border/20 hover:border-border/40"
                          )}>{rr.label}</button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5">
                    {!p.isPrimary && (
                      <Button size="sm" variant="outline" onClick={() => updateWallet({ id: p.id, isPrimary: true })} className="h-5 text-[7px] font-mono">
                        <Star className="h-2.5 w-2.5 mr-0.5" />SET PRIMARY
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => removeWallet(p.id)} className="h-5 text-[7px] font-mono text-destructive border-destructive/30 hover:bg-destructive/10">
                      <Trash2 className="h-2.5 w-2.5 mr-0.5" />REMOVE
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
