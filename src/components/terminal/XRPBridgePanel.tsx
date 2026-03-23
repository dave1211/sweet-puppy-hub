import { useState, useEffect } from "react";
import { ArrowLeftRight, Globe, Zap, Loader2, Route, AlertTriangle } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { useWalletStore } from "@/stores/walletStore";
import { xrplService } from "@/services/xrplService";
import { signAndSubmitXRPL } from "@/services/walletService";
import { toast } from "sonner";

interface PathAlternative {
  source_amount: unknown;
  paths_computed: unknown[];
}

export function XRPBridgePanel() {
  const { isConnected: solConnected } = useWallet();
  const xrplWallet = useWalletStore();
  const [destAddress, setDestAddress] = useState("");
  const [destCurrency, setDestCurrency] = useState("USD");
  const [destIssuer, setDestIssuer] = useState("rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq");
  const [destAmount, setDestAmount] = useState("");
  const [paths, setPaths] = useState<PathAlternative[]>([]);
  const [selectedPath, setSelectedPath] = useState<number>(0);
  const [isFinding, setIsFinding] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const xrpBalance = Number(xrplWallet.xrpBalance) / 1_000_000;

  const findPaths = async () => {
    if (!xrplWallet.address || !destAddress || !destAmount) {
      toast.error("Fill in destination address, currency, and amount");
      return;
    }
    setIsFinding(true);
    setPaths([]);
    try {
      const destAmt = destCurrency === "XRP"
        ? { currency: "XRP", value: destAmount }
        : { currency: destCurrency, issuer: destIssuer, value: destAmount };

      const alts = await xrplService.findPath(
        xrplWallet.address,
        destAddress,
        destAmt
      );
      setPaths(alts as PathAlternative[]);
      setSelectedPath(0);
      if (alts.length === 0) {
        toast.info("No payment paths found for this pair");
      } else {
        toast.success(`Found ${alts.length} payment path(s)`);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Pathfinding failed");
    }
    setIsFinding(false);
  };

  const executeBridge = async () => {
    if (!xrplWallet.address || !xrplWallet.provider || paths.length === 0) return;
    setIsSending(true);
    try {
      const path = paths[selectedPath];
      const deliverAmount = destCurrency === "XRP"
        ? { currency: "XRP", value: destAmount }
        : { currency: destCurrency, issuer: destIssuer, value: destAmount };

      const txJson = xrplService.buildPaymentTx(
        xrplWallet.address,
        destAddress,
        deliverAmount,
        path.paths_computed,
        path.source_amount
      );

      const txHash = await signAndSubmitXRPL(xrplWallet.provider, txJson);
      toast.success(`Bridge payment sent! TX: ${txHash.slice(0, 16)}…`);
      setPaths([]);
      setDestAmount("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Transaction failed");
    }
    setIsSending(false);
  };

  const formatSourceAmount = (amt: unknown): string => {
    if (typeof amt === "string") return `${(Number(amt) / 1_000_000).toFixed(6)} XRP`;
    if (typeof amt === "object" && amt !== null) {
      const a = amt as { value: string; currency: string };
      return `${Number(a.value).toFixed(4)} ${a.currency}`;
    }
    return "—";
  };

  if (!xrplWallet.isConnected) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-center">
        <Globe className="h-5 w-5 text-muted-foreground/20 mx-auto mb-2" />
        <p className="text-[9px] font-mono text-muted-foreground/40">Connect XRPL wallet to use bridge</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-terminal-blue" />
        <h3 className="text-xs font-mono font-bold text-foreground tracking-wide">XRP BRIDGE — PATHFINDING</h3>
        <span className="ml-auto text-[9px] font-mono text-primary">{xrpBalance.toFixed(2)} XRP</span>
      </div>

      {/* Destination */}
      <div className="space-y-1.5">
        <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Destination</div>
        <input
          value={destAddress}
          onChange={(e) => setDestAddress(e.target.value)}
          placeholder="Destination r-address…"
          className="w-full bg-muted/20 border border-border rounded px-2 py-1.5 text-[10px] font-mono text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/40"
        />
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <span className="text-[8px] font-mono text-muted-foreground/50">Currency</span>
            <input
              value={destCurrency}
              onChange={(e) => setDestCurrency(e.target.value.toUpperCase())}
              placeholder="USD"
              className="w-full bg-muted/20 border border-border rounded px-2 py-1 text-[10px] font-mono text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/40"
            />
          </div>
          <div>
            <span className="text-[8px] font-mono text-muted-foreground/50">Amount</span>
            <input
              value={destAmount}
              onChange={(e) => setDestAmount(e.target.value)}
              placeholder="0.00"
              type="number"
              step="0.01"
              className="w-full bg-muted/20 border border-border rounded px-2 py-1 text-[10px] font-mono text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/40"
            />
          </div>
        </div>
        {destCurrency !== "XRP" && (
          <div>
            <span className="text-[8px] font-mono text-muted-foreground/50">Issuer</span>
            <input
              value={destIssuer}
              onChange={(e) => setDestIssuer(e.target.value)}
              placeholder="Issuer r-address"
              className="w-full bg-muted/20 border border-border rounded px-2 py-1 text-[10px] font-mono text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/40"
            />
          </div>
        )}
      </div>

      {/* Find Paths */}
      <button
        onClick={findPaths}
        disabled={isFinding}
        className="w-full flex items-center justify-center gap-1.5 rounded bg-primary/10 border border-primary/20 py-2 text-[10px] font-mono text-primary hover:bg-primary/20 transition-colors disabled:opacity-40"
      >
        {isFinding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Route className="h-3 w-3" />}
        {isFinding ? "Finding paths…" : "FIND PAYMENT PATHS"}
      </button>

      {/* Path Results */}
      {paths.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
            {paths.length} path(s) found
          </div>
          {paths.map((p, i) => (
            <button
              key={i}
              onClick={() => setSelectedPath(i)}
              className={`w-full text-left p-2 rounded border transition-colors text-[10px] font-mono ${
                i === selectedPath
                  ? "border-primary/40 bg-primary/5 text-primary"
                  : "border-border bg-muted/10 text-muted-foreground hover:bg-muted/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>Path #{i + 1}</span>
                <span className="font-bold">{formatSourceAmount(p.source_amount)}</span>
              </div>
              <div className="text-[8px] text-muted-foreground/60 mt-0.5">
                {(p.paths_computed as unknown[])?.length ?? 0} hop(s)
              </div>
            </button>
          ))}

          <button
            onClick={executeBridge}
            disabled={isSending}
            className="w-full flex items-center justify-center gap-1.5 rounded bg-terminal-blue/15 border border-terminal-blue/30 py-2 text-[10px] font-mono text-terminal-blue hover:bg-terminal-blue/25 transition-colors disabled:opacity-40"
          >
            {isSending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
            {isSending ? "Signing…" : "EXECUTE BRIDGE PAYMENT"}
          </button>
        </div>
      )}

      <div className="p-1.5 rounded bg-terminal-amber/5 border border-terminal-amber/15 flex items-start gap-1.5">
        <AlertTriangle className="h-2.5 w-2.5 text-terminal-amber/50 shrink-0 mt-0.5" />
        <p className="text-[7px] font-mono text-terminal-amber/50 leading-relaxed">
          Uses XRPL ripple_path_find for real cross-currency pathfinding. Verify amounts before signing.
        </p>
      </div>
    </div>
  );
}
