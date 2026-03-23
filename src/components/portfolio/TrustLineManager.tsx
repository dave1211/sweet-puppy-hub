import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useWalletStore } from "@/stores/walletStore";
import { xrplService } from "@/services/xrplService";
import { signAndSubmitXRPL } from "@/services/walletService";
import { Link2, AlertTriangle, Shield, ShieldAlert, Plus, Trash2, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { TrustLine } from "@/types/xrpl";

const VERIFIED_ISSUERS: Record<string, { name: string; risk: "safe" | "caution" }> = {
  "rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq": { name: "GateHub", risk: "safe" },
  "rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz": { name: "Sologenic", risk: "safe" },
  "rcoreNywaoz2ZCQ8Lg2EbSLnGuRBmun6D": { name: "Coreum", risk: "safe" },
  "rCSCManTZ8ME9EoLrSHHYKW8PPwWMgkwr": { name: "CasinoCoin", risk: "caution" },
  "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B": { name: "Bitstamp", risk: "safe" },
};

function classifyRisk(issuer: string): { name?: string; risk: TrustLine["riskLevel"] } {
  const known = VERIFIED_ISSUERS[issuer];
  if (known) return { name: known.name, risk: known.risk };
  return { risk: "unknown" };
}

export function TrustLineManager() {
  const { isConnected, address, provider } = useWalletStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newCurrency, setNewCurrency] = useState("");
  const [newIssuer, setNewIssuer] = useState("");
  const [newLimit, setNewLimit] = useState("1000000000");
  const [trustLines, setTrustLines] = useState<TrustLine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  const fetchTrustLines = async () => {
    if (!isConnected || !address) { setTrustLines([]); return; }
    setIsLoading(true);
    try {
      const { tokens } = await xrplService.getBalances(address);
      const lines: TrustLine[] = tokens.map((t) => {
        const { name, risk } = classifyRisk(t.issuer);
        return {
          currency: t.currency, issuer: t.issuer, balance: t.value,
          limit: t.limit ?? "0", limitPeer: "0", noRipple: false,
          freeze: false, authorized: true, issuerName: name, riskLevel: risk,
        };
      });
      setTrustLines(lines);
    } catch { /* ignore */ }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTrustLines();
  }, [isConnected, address]);

  const riskConfig = {
    safe: { icon: Shield, color: "text-primary/60", bg: "bg-primary/8", label: "Verified" },
    caution: { icon: AlertTriangle, color: "text-terminal-amber/70", bg: "bg-terminal-amber/8", label: "Caution" },
    danger: { icon: ShieldAlert, color: "text-destructive/70", bg: "bg-destructive/8", label: "Risky" },
    unknown: { icon: Info, color: "text-muted-foreground/40", bg: "bg-muted/20", label: "Unknown" },
  };

  const handleAdd = async () => {
    if (!newCurrency || !newIssuer) { toast.error("Enter currency code and issuer address"); return; }
    if (!address || !provider) { toast.error("Connect wallet first"); return; }
    setIsSigning(true);
    try {
      const txJson = await xrplService.setTrustLine(address, newCurrency.toUpperCase(), newIssuer, newLimit);
      const txHash = await signAndSubmitXRPL(provider, txJson);
      toast.success(`Trust line added! TX: ${txHash.slice(0, 12)}…`);
      setShowAdd(false);
      setNewCurrency("");
      setNewIssuer("");
      setNewLimit("1000000000");
      // Refresh after a short delay
      setTimeout(fetchTrustLines, 3000);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to add trust line");
    }
    setIsSigning(false);
  };

  const handleRemove = async (currency: string, issuer: string) => {
    if (!address || !provider) { toast.error("Connect wallet first"); return; }
    setIsSigning(true);
    try {
      const txJson = await xrplService.removeTrustLine(address, currency, issuer);
      const txHash = await signAndSubmitXRPL(provider, txJson);
      toast.success(`Trust line removed! TX: ${txHash.slice(0, 12)}…`);
      setTimeout(fetchTrustLines, 3000);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to remove trust line");
    }
    setIsSigning(false);
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
          <span className="terminal-panel-subtitle">
            {isLoading ? "Loading…" : `${trustLines.length} lines`}
          </span>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="p-0.5 hover:bg-muted/30 rounded transition-colors ml-1"
          >
            <Plus className="h-3 w-3 text-muted-foreground/40 hover:text-foreground" />
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="px-3 py-2 border-b border-border/30 space-y-1.5 bg-muted/5">
          <div className="p-1.5 rounded bg-terminal-amber/5 border border-terminal-amber/20 flex items-start gap-1.5">
            <AlertTriangle className="h-3 w-3 text-terminal-amber/60 shrink-0 mt-0.5" />
            <p className="text-[8px] font-mono text-terminal-amber/60 leading-relaxed">
              Adding a trust line allows this issuer to send you tokens. Only trust verified issuers. This will submit a real TrustSet transaction.
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
          <Input
            value={newLimit}
            onChange={(e) => setNewLimit(e.target.value)}
            placeholder="Limit (default: 1000000000)"
            className="h-6 text-[9px] font-mono bg-background/50 border-border/60"
          />
          <Button
            onClick={handleAdd}
            disabled={isSigning}
            className="w-full h-6 text-[8px] font-mono bg-primary/10 text-primary border border-primary/20"
          >
            {isSigning ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
            {isSigning ? "Signing…" : "Add Trust Line (TrustSet TX)"}
          </Button>
        </div>
      )}

      <div className="divide-y divide-border/20 max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-6 gap-2">
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            <span className="text-[9px] font-mono text-muted-foreground">Fetching trust lines…</span>
          </div>
        ) : trustLines.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-[9px] font-mono text-muted-foreground/30">No trust lines found</p>
          </div>
        ) : (
          trustLines.map((tl) => {
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
                    onClick={() => handleRemove(tl.currency, tl.issuer)}
                    disabled={isSigning}
                    className="p-0.5 hover:bg-destructive/10 rounded transition-colors"
                    title="Remove trust line (TrustSet limit=0)"
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
          })
        )}
      </div>
    </div>
  );
}
