// Sniper Execution Panel — Real Jupiter buy/sell with TX tracking
import { useState } from "react";
import { Zap, Shield, AlertTriangle, ChevronDown, ChevronUp, X, Loader2 } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { useExecutionStore } from "../stores/executionStore";
import { useJupiterSwap } from "@/hooks/useJupiterSwap";
import { supabase } from "@/integrations/supabase/client";
import { useDeviceId } from "@/hooks/useDeviceId";
import { toast } from "sonner";
import type { SniperToken } from "../types";
import { STATE_COLORS, RISK_COLORS, SCORE_COLORS } from "../types";

const QUICK_AMOUNTS = [0.05, 0.1, 0.25, 0.5, 1.0];
const SELL_PERCENTS = [25, 50, 75, 100];

async function logSwapTx(params: {
  deviceId: string; tokenAddress: string; tokenSymbol: string; tokenName: string;
  amountSOL: number; side: "buy" | "sell"; signature: string; score: number; risk: number; state: string;
}) {
  await supabase.from("snipe_history").insert({
    device_id: params.deviceId,
    token_address: params.tokenAddress,
    token_symbol: params.tokenSymbol,
    token_name: params.tokenName,
    amount_sol: params.amountSOL,
    score: params.score,
    risk: params.risk,
    state: params.state,
    status: params.side === "buy" ? "active" : "profit",
    entry_price: 0,
    entry_time: new Date().toISOString(),
  });
}

export function SniperExecution({ token: st }: { token: SniperToken | null }) {
  const deviceId = useDeviceId();
  const { isConnected, walletAddress, signAndSendTransaction, refreshBalance } = useWallet();
  const { config, setAmount, setSlippage, setPriorityFee, isConfirmOpen, openConfirm, closeConfirm, isFastMode } = useExecutionStore();
  const { buildSwapTransaction, buildSellTransaction, preview, getQuote, isQuoting, isBuilding, error: jupError, clearPreview } = useJupiterSwap();
  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [txPhase, setTxPhase] = useState<string>("");
  const [isSelling, setIsSelling] = useState(false);

  const openSolscan = (sig: string) => window.open(`https://solscan.io/tx/${sig}`, "_blank");

  const handleBuy = async () => {
    if (!st) return;
    if (!isConnected || !walletAddress) { toast.error("Connect wallet first"); return; }
    if (config.amountSOL <= 0) { toast.error("Enter buy amount"); return; }
    if (isFastMode) {
      await executeBuy();
    } else {
      setTxPhase("Fetching quote…");
      const q = await getQuote(st.token.address, config.amountSOL, config.slippageBps);
      setTxPhase("");
      if (q) openConfirm();
    }
  };

  const executeBuy = async () => {
    if (!st || !walletAddress) return;
    setIsExecuting(true);
    try {
      setTxPhase("Building transaction…");
      const result = await buildSwapTransaction(st.token.address, config.amountSOL, walletAddress, config.slippageBps);
      if (!result?.swapTransaction) throw new Error(jupError || "Failed to build swap transaction");

      setTxPhase("Awaiting wallet signature…");
      const txBytes = Uint8Array.from(atob(result.swapTransaction), (c) => c.charCodeAt(0));
      const { signature } = await signAndSendTransaction(txBytes);

      // Log to DB
      logSwapTx({
        deviceId, tokenAddress: st.token.address, tokenSymbol: st.token.symbol,
        tokenName: st.token.name, amountSOL: config.amountSOL, side: "buy",
        signature, score: st.score.total, risk: st.risk.total, state: st.state,
      });

      setTxPhase("");
      closeConfirm();
      clearPreview();
      toast.success(`🎯 Sniped ${st.token.symbol} — ${config.amountSOL} SOL`, {
        description: `TX: ${signature.slice(0, 8)}…${signature.slice(-8)}`,
        action: { label: "View", onClick: () => openSolscan(signature) },
      });
      refreshBalance();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Swap failed";
      toast.error(msg.includes("rejected") || msg.includes("cancelled") ? "Transaction rejected by wallet" : `Swap failed: ${msg}`);
    } finally {
      setIsExecuting(false);
      setTxPhase("");
    }
  };

  const handleSell = async (pct: number) => {
    if (!st || !walletAddress) { toast.error("Connect wallet first"); return; }
    setIsSelling(true);
    setTxPhase(`Selling ${pct}%…`);
    try {
      // Fetch token balance from RPC
      const balRes = await fetch("https://api.mainnet-beta.solana.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: 1, method: "getTokenAccountsByOwner",
          params: [walletAddress, { mint: st.token.address }, { encoding: "jsonParsed" }],
        }),
      });
      const balData = await balRes.json();
      const accounts = balData?.result?.value ?? [];
      if (accounts.length === 0) { toast.error(`No ${st.token.symbol} balance found`); return; }

      const info = accounts[0].account.data.parsed.info;
      const totalBalance = parseFloat(info.tokenAmount.uiAmountString || "0");
      const decimals = info.tokenAmount.decimals;
      if (totalBalance <= 0) { toast.error(`No ${st.token.symbol} balance`); return; }

      const sellAmount = (totalBalance * pct) / 100;

      setTxPhase("Building sell transaction…");
      const result = await buildSellTransaction(st.token.address, sellAmount, decimals, walletAddress, config.slippageBps);
      if (!result?.swapTransaction) throw new Error(jupError || "Failed to build sell TX");

      setTxPhase("Awaiting wallet signature…");
      const txBytes = Uint8Array.from(atob(result.swapTransaction), (c) => c.charCodeAt(0));
      const { signature } = await signAndSendTransaction(txBytes);

      logSwapTx({
        deviceId, tokenAddress: st.token.address, tokenSymbol: st.token.symbol,
        tokenName: st.token.name, amountSOL: 0, side: "sell",
        signature, score: st.score.total, risk: st.risk.total, state: st.state,
      });

      toast.success(`💰 Sold ${pct}% of ${st.token.symbol}`, {
        description: `TX: ${signature.slice(0, 8)}…${signature.slice(-8)}`,
        action: { label: "View", onClick: () => openSolscan(signature) },
      });
      refreshBalance();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sell failed";
      toast.error(msg.includes("rejected") ? "Transaction rejected" : `Sell failed: ${msg}`);
    } finally {
      setIsSelling(false);
      setTxPhase("");
    }
  };

  if (!st) {
    return (
      <div className="flex items-center justify-center h-32 text-[10px] font-mono text-muted-foreground">
        Select a token to trade
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      {/* Token Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono font-bold text-foreground">{st.token.symbol}</span>
          <span className={`text-[8px] font-mono px-1 py-0.5 rounded border ${STATE_COLORS[st.state]}`}>{st.state}</span>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-mono">
          <span className={SCORE_COLORS[st.score.band]}>S:{st.score.total}</span>
          <span className={RISK_COLORS[st.risk.band]}>R:{st.risk.total}</span>
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-1">
        <button onClick={() => setTab("buy")} className={`flex-1 py-1.5 rounded text-[10px] font-mono font-bold transition-colors ${tab === "buy" ? "bg-terminal-green/15 text-terminal-green border border-terminal-green/30" : "bg-muted/30 text-muted-foreground border border-transparent"}`}>BUY</button>
        <button onClick={() => setTab("sell")} className={`flex-1 py-1.5 rounded text-[10px] font-mono font-bold transition-colors ${tab === "sell" ? "bg-terminal-red/15 text-terminal-red border border-terminal-red/30" : "bg-muted/30 text-muted-foreground border border-transparent"}`}>SELL</button>
      </div>

      {tab === "buy" ? (
        <>
          <div className="flex gap-1">
            {QUICK_AMOUNTS.map((amt) => (
              <button key={amt} onClick={() => setAmount(amt)} className={`flex-1 py-1 rounded text-[9px] font-mono transition-colors ${config.amountSOL === amt ? "bg-primary/15 text-primary border border-primary/30" : "bg-muted/20 text-muted-foreground border border-transparent hover:text-foreground"}`}>{amt}</button>
            ))}
          </div>
          <div className="bg-muted/20 border border-border rounded px-2 py-1.5">
            <div className="text-[8px] font-mono text-muted-foreground mb-0.5">AMOUNT (SOL)</div>
            <input type="number" value={config.amountSOL || ""} onChange={(e) => setAmount(Number(e.target.value) || 0)} placeholder="0.00" step="0.01" className="w-full bg-transparent text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none font-bold" />
          </div>
          <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground hover:text-foreground w-full transition-colors">
            {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />} ADVANCED
          </button>
          {showAdvanced && (
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-muted/20 border border-border rounded px-2 py-1"><div className="text-[7px] font-mono text-muted-foreground">SLIPPAGE (BPS)</div><input type="number" value={config.slippageBps} onChange={(e) => setSlippage(Number(e.target.value) || 50)} className="w-full bg-transparent text-[10px] font-mono text-foreground focus:outline-none" /></div>
                <div className="bg-muted/20 border border-border rounded px-2 py-1"><div className="text-[7px] font-mono text-muted-foreground">PRIORITY FEE</div><input type="number" value={config.priorityFeeLamports} onChange={(e) => setPriorityFee(Number(e.target.value) || 0)} className="w-full bg-transparent text-[10px] font-mono text-foreground focus:outline-none" /></div>
              </div>
            </div>
          )}
          {st.risk.flags.length > 0 && (
            <div className="bg-terminal-amber/5 border border-terminal-amber/20 rounded px-2 py-1.5 space-y-1">
              <div className="flex items-center gap-1 text-[9px] font-mono text-terminal-amber"><AlertTriangle className="h-3 w-3" /> {st.risk.flags.length} WARNING{st.risk.flags.length > 1 ? "S" : ""}</div>
              {st.risk.flags.slice(0, 2).map((f) => <div key={f.id} className="text-[8px] font-mono text-muted-foreground">{f.label}</div>)}
            </div>
          )}
          <button onClick={handleBuy} disabled={!isConnected || config.amountSOL <= 0 || isExecuting || isQuoting} className="w-full flex items-center justify-center gap-1.5 rounded py-2.5 text-[11px] font-mono font-bold transition-colors bg-terminal-green/15 text-terminal-green border border-terminal-green/30 hover:bg-terminal-green/25 disabled:opacity-40">
            {isExecuting || isQuoting ? <span className="flex items-center gap-1.5 animate-pulse"><Loader2 className="h-3.5 w-3.5 animate-spin" />{txPhase || "EXECUTING…"}</span> : <><Zap className="h-3.5 w-3.5" />{isFastMode ? "⚡ FAST SNIPE" : "SNIPE BUY"}</>}
          </button>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            {SELL_PERCENTS.map((pct) => (
              <button key={pct} onClick={() => handleSell(pct)} disabled={!isConnected || isSelling} className="py-2 rounded text-[10px] font-mono font-bold bg-terminal-red/10 text-terminal-red border border-terminal-red/20 hover:bg-terminal-red/20 transition-colors disabled:opacity-40">
                {isSelling ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : `SELL ${pct}%`}
              </button>
            ))}
          </div>
          <button onClick={() => handleSell(100)} disabled={!isConnected || isSelling} className="w-full py-2.5 rounded text-[11px] font-mono font-bold bg-terminal-red/20 text-terminal-red border border-terminal-red/40 hover:bg-terminal-red/30 transition-colors disabled:opacity-40">
            {isSelling ? <span className="flex items-center justify-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" />{txPhase}</span> : "🚨 EMERGENCY EXIT"}
          </button>
        </>
      )}

      {!isConnected && <p className="text-[9px] font-mono text-muted-foreground text-center">Connect wallet to trade</p>}

      {/* Confirm Modal */}
      {isConfirmOpen && st && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-lg p-4 w-80 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-foreground">CONFIRM SNIPE</span>
              <button onClick={closeConfirm}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="space-y-1.5 text-[10px] font-mono">
              <div className="flex justify-between"><span className="text-muted-foreground">Token</span><span className="text-foreground font-bold">{st.token.symbol}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="text-foreground">{config.amountSOL} SOL</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Slippage</span><span className="text-foreground">{config.slippageBps / 100}%</span></div>
              {preview && (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">You Receive</span><span className="text-terminal-green font-bold">~{preview.outputAmount.toLocaleString()} {st.token.symbol}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Min Received</span><span className="text-foreground">{preview.minimumReceived.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Price Impact</span><span className={preview.priceImpact > 5 ? "text-terminal-red" : preview.priceImpact > 1 ? "text-terminal-amber" : "text-terminal-green"}>{preview.priceImpact.toFixed(2)}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Route</span><span className="text-foreground">{preview.route.join(" → ")}</span></div>
                </>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">Score</span><span className={SCORE_COLORS[st.score.band]}>{st.score.total} {st.score.band}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Risk</span><span className={RISK_COLORS[st.risk.band]}>{st.risk.total} {st.risk.band}</span></div>
            </div>
            {st.risk.band !== "LOW" && (
              <div className="bg-terminal-amber/10 border border-terminal-amber/20 rounded px-2 py-1.5 flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-terminal-amber" />
                <span className="text-[9px] font-mono text-terminal-amber">Risk acknowledged: {st.risk.band}</span>
              </div>
            )}
            {preview && preview.priceImpact > 5 && (
              <div className="bg-terminal-red/10 border border-terminal-red/20 rounded px-2 py-1.5 flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 text-terminal-red" />
                <span className="text-[9px] font-mono text-terminal-red">High price impact — consider reducing size</span>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => { closeConfirm(); clearPreview(); }} className="flex-1 py-2 rounded border border-border text-[10px] font-mono text-muted-foreground hover:text-foreground">CANCEL</button>
              <button onClick={executeBuy} disabled={isExecuting || isBuilding} className="flex-1 py-2 rounded bg-terminal-green/15 border border-terminal-green/30 text-[10px] font-mono font-bold text-terminal-green hover:bg-terminal-green/25 disabled:opacity-40">
                {isExecuting ? <span className="flex items-center justify-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />{txPhase || "SNIPING…"}</span> : "CONFIRM & SIGN"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
