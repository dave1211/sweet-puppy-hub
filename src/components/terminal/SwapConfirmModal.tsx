import { useState } from "react";
import { ArrowRight, AlertTriangle, Route, Loader2, Shield, TrendingDown } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useJupiterSwap } from "@/hooks/useJupiterSwap";
import { useWallet } from "@/contexts/WalletContext";

interface SwapConfirmModalProps { open: boolean; onClose: () => void; tokenAddress: string; tokenSymbol: string; onExecute?: (swapTx: string) => void; }

export function SwapConfirmModal({ open, onClose, tokenAddress, tokenSymbol, onExecute }: SwapConfirmModalProps) {
  const { walletAddress } = useWallet();
  const { getQuote, buildSwapTransaction, clearPreview, preview, isQuoting, isBuilding, error } = useJupiterSwap();
  const [amountSOL, setAmountSOL] = useState("0.1");
  const [slippageBps, setSlippageBps] = useState(50);

  const handleGetQuote = () => { const amt = parseFloat(amountSOL); if (isNaN(amt) || amt <= 0) return; getQuote(tokenAddress, amt, slippageBps); };
  const handleConfirmSwap = async () => { if (!walletAddress || !preview) return; const amt = parseFloat(amountSOL); const result = await buildSwapTransaction(tokenAddress, amt, walletAddress, slippageBps); if (result?.swapTransaction && onExecute) onExecute(result.swapTransaction); };
  const handleClose = () => { clearPreview(); onClose(); };
  const impactSeverity = preview && preview.priceImpact > 5 ? "text-terminal-red" : preview && preview.priceImpact > 1 ? "text-terminal-yellow" : "text-terminal-green";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono text-base"><ArrowRight className="h-5 w-5 text-primary" />SWAP SOL → {tokenSymbol}</DialogTitle>
          <DialogDescription className="text-[10px] font-mono text-muted-foreground">Jupiter aggregator · best route · you sign the transaction</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[9px] font-mono text-muted-foreground uppercase">Amount (SOL)</label>
            <Input type="number" value={amountSOL} onChange={(e) => setAmountSOL(e.target.value)} min={0.001} step={0.01} className="font-mono text-sm h-9" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between"><span className="text-[9px] font-mono text-muted-foreground uppercase">Slippage Tolerance</span><span className="text-[9px] font-mono text-foreground font-bold">{(slippageBps / 100).toFixed(1)}%</span></div>
            <Slider value={[slippageBps]} onValueChange={([v]) => setSlippageBps(v)} min={10} max={500} step={10} />
          </div>
          {!preview && <Button onClick={handleGetQuote} disabled={isQuoting || !amountSOL} className="w-full text-xs font-mono">{isQuoting ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Fetching Quote…</> : "Get Quote"}</Button>}
          {error && <div className="rounded border border-terminal-red/30 bg-terminal-red/5 px-3 py-2"><p className="text-[10px] font-mono text-terminal-red">{error}</p></div>}
          {preview && (
            <div className="space-y-2 rounded border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between"><span className="text-[9px] font-mono text-muted-foreground">You Pay</span><span className="text-xs font-mono font-bold text-foreground">{preview.inputAmountSOL} SOL</span></div>
              <div className="flex items-center justify-between"><span className="text-[9px] font-mono text-muted-foreground">You Receive</span><span className="text-xs font-mono font-bold text-terminal-green">~{preview.outputAmount.toLocaleString()} {tokenSymbol}</span></div>
              <div className="flex items-center justify-between"><span className="text-[9px] font-mono text-muted-foreground">Min Received</span><span className="text-[10px] font-mono text-foreground">{preview.minimumReceived.toLocaleString()} {tokenSymbol}</span></div>
              <div className="flex items-center justify-between"><span className="text-[9px] font-mono text-muted-foreground flex items-center gap-1"><TrendingDown className="h-3 w-3" />Price Impact</span><span className={`text-[10px] font-mono font-bold ${impactSeverity}`}>{preview.priceImpact.toFixed(2)}%</span></div>
              <div className="flex items-center justify-between"><span className="text-[9px] font-mono text-muted-foreground flex items-center gap-1"><Route className="h-3 w-3" />Route</span><div className="flex items-center gap-1">{preview.route.map((r, i) => <Badge key={i} variant="outline" className="text-[7px] px-1 py-0 h-4 font-mono">{r}</Badge>)}</div></div>
              {preview.priceImpact > 5 && <div className="flex items-center gap-1.5 rounded bg-terminal-red/10 px-2 py-1.5 border border-terminal-red/30"><AlertTriangle className="h-3 w-3 text-terminal-red shrink-0" /><span className="text-[9px] font-mono text-terminal-red">High price impact — consider reducing trade size</span></div>}
              <div className="flex items-center gap-1.5 rounded bg-muted/50 px-2 py-1.5 border border-border"><Shield className="h-3 w-3 text-terminal-yellow shrink-0" /><span className="text-[8px] font-mono text-muted-foreground">Transaction will be sent to your wallet for signing. No auto-execution.</span></div>
            </div>
          )}
        </div>
        {preview && (
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleClose} className="text-xs font-mono">Cancel</Button>
            <Button onClick={handleConfirmSwap} disabled={isBuilding || !walletAddress} className="text-xs font-mono">{isBuilding ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Building TX…</> : "Confirm & Sign"}</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}