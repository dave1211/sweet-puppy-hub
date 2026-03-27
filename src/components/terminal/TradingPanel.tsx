import { useState } from "react";
import { Zap, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SwapConfirmModal } from "./SwapConfirmModal";
import { useSelectedToken } from "@/contexts/SelectedTokenContext";
import { useWallet } from "@/contexts/WalletContext";
import { getSafeguards } from "@/lib/executionEngine";
import { toast } from "sonner";
import { usePositionSizing } from "@/hooks/usePositionSizing";
import { PositionSizeGuide } from "@/components/trading/PositionSizeGuide";

export function TradingPanel() {
  const { selectedAddress: selectedToken } = useSelectedToken();
  const { isConnected } = useWallet();
  const [tokenAddr, setTokenAddr] = useState("");
  const [showSwap, setShowSwap] = useState(false);
  const [amountUSD, setAmountUSD] = useState(0);
  const activeAddr = tokenAddr.trim() || selectedToken || "";
  const safeguards = getSafeguards();
  const sizing = usePositionSizing(activeAddr || null, amountUSD);
  const isLive = safeguards.liveEnabled && safeguards.userConfirmed && !safeguards.emergencyStop;

  const handleBuy = () => { if (!activeAddr) { toast.error("Enter a token address or select a token"); return; } if (!isConnected) { toast.error("Connect your wallet first"); return; } setShowSwap(true); };
  const handleSwapExecute = (swapTx: string) => { console.info("[TradingPanel] Swap TX ready:", swapTx.slice(0, 20) + "…"); toast.success("Transaction built — wallet signing not yet connected"); setShowSwap(false); };
  const symbol = activeAddr ? `${activeAddr.slice(0, 4)}…${activeAddr.slice(-4)}` : "TOKEN";

  return (
    <>
      <SwapConfirmModal open={showSwap} onClose={() => setShowSwap(false)} tokenAddress={activeAddr} tokenSymbol={symbol} onExecute={handleSwapExecute} />
      <Card className="border-border bg-card">
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-mono"><Zap className="h-4 w-4 text-terminal-yellow" />QUICK TRADE{isLive ? <Badge variant="outline" className="text-[7px] px-1 py-0 h-4 font-mono border-terminal-red/40 text-terminal-red">LIVE</Badge> : <Badge variant="outline" className="text-[7px] px-1 py-0 h-4 font-mono border-terminal-yellow/40 text-terminal-yellow">PREVIEW</Badge>}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder={selectedToken ? `Selected: ${selectedToken.slice(0, 8)}…` : "Token address..."} value={tokenAddr} onChange={(e) => setTokenAddr(e.target.value)} className="h-8 font-mono text-xs bg-background" />
          <Input placeholder="Amount (USD)" type="number" step="any" value={amountUSD || ""} onChange={(e) => setAmountUSD(Number(e.target.value) || 0)} className="h-8 font-mono text-xs bg-background" />
          {sizing && <PositionSizeGuide result={sizing} compact />}
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleBuy} className="h-9 text-xs font-mono bg-terminal-green/20 text-terminal-green border border-terminal-green/30 hover:bg-terminal-green/30"><ArrowRight className="h-3 w-3 mr-1" />BUY</Button>
            <Button className="h-9 text-xs font-mono bg-terminal-red/20 text-terminal-red border border-terminal-red/30 hover:bg-terminal-red/30" disabled>SELL (soon)</Button>
          </div>
          {!isConnected && <p className="text-[8px] font-mono text-terminal-yellow text-center">Connect wallet to trade</p>}
        </CardContent>
      </Card>
    </>
  );
}