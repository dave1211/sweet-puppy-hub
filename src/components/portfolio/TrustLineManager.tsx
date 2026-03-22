import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useWalletStore } from "@/stores/walletStore";
import { Link2, AlertTriangle, Shield, ShieldAlert, Plus, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { TrustLine } from "@/types/xrpl";

function generateMockTrustLines(): TrustLine[] {
  return [
    { currency: "USD", issuer: "rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq", balance: "1250.50", limit: "10000", limitPeer: "0", noRipple: true, freeze: false, authorized: true, issuerName: "GateHub", riskLevel: "safe" },
    { currency: "SOLO", issuer: "rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz", balance: "48000", limit: "1000000", limitPeer: "0", noRipple: true, freeze: false, authorized: true, issuerName: "Sologenic", riskLevel: "safe" },
    { currency: "CSC", issuer: "rCSCManTZ8ME9EoLrSHHYKW8PPwWMgkwr", balance: "125000", limit: "5000000", limitPeer: "0", noRipple: false, freeze: false, authorized: true, issuerName: "CasinoCoin", riskLevel: "caution" },
    { currency: "FAKE", issuer: "rFAKEissuer1234567890abcdefghij", balance: "0", limit: "100", limitPeer: "0", noRipple: false, freeze: false, authorized: false, issuerName: undefined, riskLevel: "danger" },
  ];
}

export function TrustLineManager() {
  const { isConnected } = useWalletStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newCurrency, setNewCurrency] = useState("");
  const [newIssuer, setNewIssuer] = useState("");
  const trustLines = useMemo(() => generateMockTrustLines(), []);

  const riskConfig = {
    safe: { icon: Shield, color: "text-primary/60", bg: "bg-primary/8", label: "Verified" },
    caution: { icon: AlertTriangle, color: "text-terminal-amber/70", bg: "bg-terminal-amber/8", label: "Caution" },
    danger: { icon: ShieldAlert, color: "text-destructive/70", bg: "bg-destructive/8", label: "Risky" },
    unknown: { icon: Info, color: "text-muted-foreground/40", bg: "bg-muted/20", label: "Unknown" },
  };

  const handleAdd = () => {
    if (!newCurrency || !newIssuer) { toast.error("Enter currency code and issuer address"); return; }
    toast.success(`Trust line for ${newCurrency} added (simulated)`);
    setShowAdd(false);
    setNewCurrency("");
    setNewIssuer("");
  };

  const handleRemove = (currency: string) => {
    toast.info(`Trust line for ${currency} removed (simulated)`);
  };

  if (!isConnected) {
    return (
      <div className="terminal-panel p-6 text-center">
        <Link2 className="h-6 w-6 text-muted-foreground/10 mx-auto mb-2" />
        <p className="text-[9px] font-mono text-muted-foreground/30">Connect wallet to manage trust lines</p>
      </div>
    );
  }

  return (
    <div className="terminal-panel">
      <div className="terminal-panel-header">
        <div className="flex items-center gap-1.5">
          <Link2 className="h-3 w-3 text-muted-foreground/50" />
          <span className="terminal-panel-title">Trust Lines</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="terminal-panel-subtitle">{trustLines.length} lines</span>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="p-0.5 hover:bg-muted/30 rounded transition-colors ml-1"
          >
            <Plus className="h-3 w-3 text-muted-foreground/40 hover:text-foreground" />
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="px-3 py-2 border-b border-border/30 space-y-1.5 bg-muted/5">
          <div className="p-1.5 rounded bg-terminal-amber/5 border border-terminal-amber/20 flex items-start gap-1.5">
            <AlertTriangle className="h-3 w-3 text-terminal-amber/60 shrink-0 mt-0.5" />
            <p className="text-[8px] font-mono text-terminal-amber/60 leading-relaxed">
              Adding a trust line allows this issuer to send you tokens. Only trust verified issuers.
            </p>
          </div>
          <Input
            value={newCurrency}
            onChange={(e) => setNewCurrency(e.target.value.toUpperCase())}
            placeholder="Currency code (e.g. USD)"
            className="h-6 text-[9px] font-mono bg-background/50 border-border/60"
          />
          <Input
            value={newIssuer}
            onChange={(e) => setNewIssuer(e.target.value)}
            placeholder="Issuer address (r...)"
            className="h-6 text-[9px] font-mono bg-background/50 border-border/60"
          />
          <Button onClick={handleAdd} className="w-full h-6 text-[8px] font-mono bg-primary/10 text-primary border border-primary/20">
            Add Trust Line
          </Button>
        </div>
      )}

      {/* Trust lines list */}
      <div className="divide-y divide-border/20 max-h-64 overflow-y-auto">
        {trustLines.map((tl) => {
          const risk = riskConfig[tl.riskLevel];
          const RiskIcon = risk.icon;
          return (
            <div key={`${tl.currency}-${tl.issuer}`} className="px-3 py-2 hover:bg-muted/10 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-foreground/80">{tl.currency}</span>
                  <div className={cn("flex items-center gap-0.5 px-1 py-0.5 rounded text-[7px] font-mono", risk.bg, risk.color)}>
                    <RiskIcon className="h-2 w-2" />
                    {risk.label}
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(tl.currency)}
                  className="p-0.5 hover:bg-destructive/10 rounded transition-colors"
                >
                  <Trash2 className="h-2.5 w-2.5 text-muted-foreground/20 hover:text-destructive/60" />
                </button>
              </div>
              <div className="flex items-center justify-between text-[8px] font-mono">
                <span className="text-muted-foreground/40">
                  {tl.issuerName ?? tl.issuer.slice(0, 12) + "…"}
                </span>
                <span className="text-foreground/50 tabular-nums">
                  {Number(tl.balance).toFixed(2)} / {Number(tl.limit).toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
