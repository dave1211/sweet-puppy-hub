import { useState, useCallback } from "react";
import { ArrowDownUp, Globe, Zap, History, ExternalLink } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";
import { BRIDGE_ASSETS, calculateBridgeQuote, type BridgeStep, type BridgeQuote } from "./BridgeAssets";
import { BridgeAssetSelector } from "./BridgeAssetSelector";
import { BridgeConfirmStep } from "./BridgeConfirmStep";

interface BridgeTx {
  id: string;
  from: string;
  to: string;
  inputAmount: number;
  outputAmount: number;
  status: "complete" | "pending";
  timestamp: Date;
}

export function XRPBridgePanel() {
  const { isConnected } = useWallet();
  const [fromId, setFromId] = useState("xrp");
  const [toId, setToId] = useState("sol");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<BridgeStep>("select");
  const [quote, setQuote] = useState<BridgeQuote | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<BridgeTx[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const fromAsset = BRIDGE_ASSETS.find((a) => a.id === fromId)!;
  const toAsset = BRIDGE_ASSETS.find((a) => a.id === toId)!;
  const amt = parseFloat(amount);
  const isValid = !isNaN(amt) && amt > 0;

  const computedOutput = isValid
    ? ((amt * fromAsset.price) / toAsset.price * 0.997).toFixed(4)
    : "0.00";

  const handleSwapDirection = () => {
    setFromId(toId);
    setToId(fromId);
    setAmount("");
    setStep("select");
    setQuote(null);
  };

  const handleGetQuote = () => {
    if (!isConnected) { toast.error("Connect wallet first"); return; }
    if (!isValid) { toast.error("Enter a valid amount"); return; }
    const q = calculateBridgeQuote(fromAsset, toAsset, amt);
    setQuote(q);
    setStep("confirm");
  };

  const handleConfirm = useCallback(() => {
    if (!quote) return;
    setIsProcessing(true);
    setStep("processing");

    // Simulate bridge processing
    setTimeout(() => {
      const tx: BridgeTx = {
        id: Math.random().toString(36).slice(2, 10),
        from: quote.fromAsset.label,
        to: quote.toAsset.label,
        inputAmount: quote.inputAmount,
        outputAmount: quote.outputAmount,
        status: "complete",
        timestamp: new Date(),
      };
      setHistory((prev) => [tx, ...prev]);
      setIsProcessing(false);
      setStep("complete");
      toast.success(`🌉 Bridged ${quote.inputAmount.toFixed(4)} ${quote.fromAsset.label} → ${quote.outputAmount.toFixed(4)} ${quote.toAsset.label}`);
    }, 3000);
  }, [quote]);

  const handleReset = () => {
    setStep("select");
    setQuote(null);
    setAmount("");
  };

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Globe className="h-4 w-4 text-terminal-blue" />
        <h3 className="text-xs font-mono font-bold text-foreground tracking-wide">CROSS-CHAIN BRIDGE</h3>
        <span className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-[10px] font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <History className="h-3 w-3" />
            {history.length > 0 && <span className="bg-primary/20 text-primary rounded px-1">{history.length}</span>}
          </button>
          <span className="text-[10px] font-mono text-terminal-blue bg-terminal-blue/10 px-1.5 py-0.5 rounded">XRP↔SOL</span>
        </span>
      </div>

      {/* History Panel */}
      {showHistory && history.length > 0 && (
        <div className="mb-3 space-y-1.5 max-h-32 overflow-y-auto">
          <div className="text-[9px] font-mono text-muted-foreground">RECENT BRIDGES</div>
          {history.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between rounded bg-muted/20 border border-border px-2 py-1.5 text-[9px] font-mono">
              <span className="text-foreground">{tx.inputAmount.toFixed(2)} {tx.from} → {tx.outputAmount.toFixed(2)} {tx.to}</span>
              <span className="text-primary">✓</span>
            </div>
          ))}
        </div>
      )}

      {/* Select Step */}
      {step === "select" && (
        <div className="space-y-2">
          <BridgeAssetSelector
            label="FROM"
            selectedId={fromId}
            onSelect={setFromId}
            amount={amount}
            onAmountChange={setAmount}
            excludeId={toId}
          />

          <div className="flex justify-center -my-1">
            <button
              onClick={handleSwapDirection}
              className="rounded-full bg-card border border-border p-1.5 hover:bg-muted/50 transition-colors z-10"
            >
              <ArrowDownUp className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>

          <BridgeAssetSelector
            label="TO"
            selectedId={toId}
            onSelect={setToId}
            readOnly
            computedAmount={computedOutput}
            excludeId={fromId}
          />

          {/* Rate Preview */}
          {isValid && (
            <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground px-1">
              <span>Rate: 1 {fromAsset.label} = {(fromAsset.price / toAsset.price).toFixed(4)} {toAsset.label}</span>
              <span>Fee: 0.3%</span>
            </div>
          )}

          <button
            onClick={handleGetQuote}
            disabled={!isConnected || !isValid}
            className="w-full flex items-center justify-center gap-1.5 rounded bg-terminal-blue/15 border border-terminal-blue/30 py-2.5 text-[10px] font-mono text-terminal-blue hover:bg-terminal-blue/25 transition-colors disabled:opacity-40"
          >
            <Zap className="h-3 w-3" />
            GET BRIDGE QUOTE
          </button>

          {!isConnected && (
            <p className="text-[9px] font-mono text-muted-foreground text-center">Connect wallet to bridge assets</p>
          )}
        </div>
      )}

      {/* Confirm Step */}
      {(step === "confirm" || step === "processing") && quote && (
        <BridgeConfirmStep
          quote={quote}
          onConfirm={handleConfirm}
          onCancel={handleReset}
          isProcessing={isProcessing}
        />
      )}

      {/* Complete Step */}
      {step === "complete" && quote && (
        <div className="space-y-3 text-center">
          <div className="text-3xl">🌉</div>
          <div className="text-xs font-mono font-bold text-primary">BRIDGE COMPLETE</div>
          <div className="text-[10px] font-mono text-muted-foreground">
            {quote.inputAmount.toFixed(4)} {quote.fromAsset.label} → {quote.outputAmount.toFixed(4)} {quote.toAsset.label}
          </div>
          <div className="flex items-center justify-center gap-1 text-[9px] font-mono text-muted-foreground">
            <ExternalLink className="h-3 w-3" />
            <span>View on Explorer</span>
          </div>
          <button
            onClick={handleReset}
            className="w-full rounded bg-primary/10 border border-primary/20 py-2 text-[10px] font-mono text-primary hover:bg-primary/20 transition-colors"
          >
            BRIDGE AGAIN
          </button>
        </div>
      )}
    </div>
  );
}
