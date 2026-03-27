import { cn } from "@/lib/utils";
import { useTradingStore } from "@/stores/tradingStore";
import { useMarketStore } from "@/stores/marketStore";
import { useWalletStore } from "@/stores/walletStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { TradeConfirmModal } from "./TradeConfirmModal";
import { PositionSizeGuide } from "./PositionSizeGuide";
import { usePositionSizing } from "@/hooks/usePositionSizing";
import { ArrowDownUp, Lock } from "lucide-react";

export function TradeForm() {
  const {
    side, orderType, price, amount, slippage,
    setSide, setOrderType, setPrice, setAmount, setSlippage,
    setShowConfirm,
  } = useTradingStore();
  const { activePair, lastPrice } = useMarketStore();
  const { isConnected } = useWalletStore();

  const numPrice = orderType === "market" ? lastPrice : Number(price) || 0;
  const numAmount = Number(amount) || 0;
  const total = numPrice * numAmount;

  const sizing = usePositionSizing(
    activePair.base.currency ?? null,
    total,
    { tokenSymbol: activePair.base.currency }
  );

  const handleSubmit = () => {
    if (!isConnected) { toast.error("Connect wallet first"); return; }
    if (numAmount <= 0) { toast.error("Enter an amount"); return; }
    if (orderType === "limit" && numPrice <= 0) { toast.error("Enter a price"); return; }
    setShowConfirm(true);
  };

  return (
    <>
      <TradeConfirmModal />
      <div className="terminal-panel">
        <div className="terminal-panel-header">
          <div className="flex items-center gap-1.5">
            <ArrowDownUp className="h-3 w-3 text-muted-foreground/50" />
            <span className="terminal-panel-title">Trade</span>
          </div>
          <span className="terminal-panel-subtitle">{activePair.label}</span>
        </div>

        <div className="p-2.5 space-y-2.5">
          {/* Buy / Sell */}
          <div className="grid grid-cols-2 gap-0.5 p-0.5 bg-muted/30 rounded">
            <button
              onClick={() => setSide("buy")}
              className={cn(
                "py-2 text-[10px] font-mono font-bold rounded transition-all",
                side === "buy"
                  ? "bg-primary/15 text-primary shadow-sm glow-green"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              BUY
            </button>
            <button
              onClick={() => setSide("sell")}
              className={cn(
                "py-2 text-[10px] font-mono font-bold rounded transition-all",
                side === "sell"
                  ? "bg-destructive/15 text-destructive shadow-sm glow-red"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              SELL
            </button>
          </div>

          {/* Order type */}
          <div className="flex gap-0.5 bg-muted/20 rounded p-0.5">
            {(["limit", "market"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setOrderType(t)}
                className={cn(
                  "flex-1 py-1 text-[9px] font-mono uppercase tracking-wider rounded transition-all",
                  orderType === t
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground/50"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Price */}
          {orderType === "limit" && (
            <div>
              <label className="text-[8px] font-mono text-muted-foreground/50 mb-1 block uppercase tracking-wider">
                Price ({activePair.quote.currency})
              </label>
              <Input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00000"
                className="h-7 text-[11px] font-mono bg-background/50 border-border/60"
                type="number"
                step="any"
              />
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="text-[8px] font-mono text-muted-foreground/50 mb-1 block uppercase tracking-wider">
              Amount ({activePair.base.currency})
            </label>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="h-7 text-[11px] font-mono bg-background/50 border-border/60"
              type="number"
              step="any"
            />
            <div className="flex gap-0.5 mt-1">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  className="flex-1 py-0.5 text-[8px] font-mono border border-border/40 rounded text-muted-foreground/40 hover:text-muted-foreground hover:border-border/60 transition-colors"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Slippage */}
          {orderType === "market" && (
            <div>
              <label className="text-[8px] font-mono text-muted-foreground/50 mb-1 block uppercase tracking-wider">
                Slippage
              </label>
              <div className="flex gap-0.5">
                {[0.5, 1, 2, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSlippage(s)}
                    className={cn(
                      "flex-1 py-1 text-[9px] font-mono rounded transition-all",
                      slippage === s
                        ? "bg-card text-foreground border border-border/60"
                        : "text-muted-foreground/40 border border-transparent"
                    )}
                  >
                    {s}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between text-[9px] font-mono px-0.5 py-1 border-t border-border/30">
            <span className="text-muted-foreground/50">Est. Total</span>
            <span className="text-foreground tabular-nums">
              {total > 0 ? total.toFixed(5) : "—"} {activePair.quote.currency}
            </span>
          </div>

          {/* Position sizing guidance */}
          {sizing && total > 0 && <PositionSizeGuide result={sizing} />}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!isConnected}
            className={cn(
              "w-full h-9 text-[10px] font-mono font-bold tracking-wider uppercase transition-all",
              side === "buy"
                ? "bg-primary/15 text-primary border border-primary/25 hover:bg-primary/25 hover:border-primary/40"
                : "bg-destructive/15 text-destructive border border-destructive/25 hover:bg-destructive/25 hover:border-destructive/40"
            )}
          >
            {!isConnected && <Lock className="h-3 w-3 mr-1.5" />}
            {isConnected
              ? `${side === "buy" ? "BUY" : "SELL"} ${activePair.base.currency}`
              : "Connect Wallet"}
          </Button>
        </div>
      </div>
    </>
  );
}
