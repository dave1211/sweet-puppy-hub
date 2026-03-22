import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTradingStore } from "@/stores/tradingStore";
import { useMarketStore } from "@/stores/marketStore";
import { useWalletStore } from "@/stores/walletStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { TradeConfirmModal } from "./TradeConfirmModal";

export function TradeForm() {
  const {
    side, orderType, price, amount, slippage,
    setSide, setOrderType, setPrice, setAmount, setSlippage,
    showConfirm, setShowConfirm,
  } = useTradingStore();
  const { activePair, lastPrice } = useMarketStore();
  const { isConnected } = useWalletStore();

  const numPrice = orderType === "market" ? lastPrice : Number(price) || 0;
  const numAmount = Number(amount) || 0;
  const total = numPrice * numAmount;

  const handleSubmit = () => {
    if (!isConnected) {
      toast.error("Connect wallet first");
      return;
    }
    if (numAmount <= 0) {
      toast.error("Enter an amount");
      return;
    }
    if (orderType === "limit" && numPrice <= 0) {
      toast.error("Enter a price");
      return;
    }
    setShowConfirm(true);
  };

  return (
    <>
      <TradeConfirmModal />
      <div className="border border-border rounded bg-card">
        <div className="px-3 py-2 border-b border-border">
          <span className="text-xs font-mono font-bold text-foreground">TRADE</span>
        </div>

        <div className="p-3 space-y-3">
          {/* Buy / Sell toggle */}
          <div className="grid grid-cols-2 gap-1 p-0.5 bg-muted rounded">
            <button
              onClick={() => setSide("buy")}
              className={cn(
                "py-1.5 text-xs font-mono font-bold rounded transition-colors",
                side === "buy"
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              BUY
            </button>
            <button
              onClick={() => setSide("sell")}
              className={cn(
                "py-1.5 text-xs font-mono font-bold rounded transition-colors",
                side === "sell"
                  ? "bg-destructive/20 text-destructive"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              SELL
            </button>
          </div>

          {/* Order type */}
          <div className="flex gap-1">
            {(["limit", "market"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setOrderType(t)}
                className={cn(
                  "flex-1 py-1 text-[10px] font-mono uppercase rounded border transition-colors",
                  orderType === t
                    ? "border-primary/30 text-primary bg-primary/5"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Price (limit only) */}
          {orderType === "limit" && (
            <div>
              <label className="text-[10px] font-mono text-muted-foreground mb-1 block">
                PRICE ({activePair.quote.currency})
              </label>
              <Input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00000"
                className="h-8 text-xs font-mono bg-background"
                type="number"
                step="any"
              />
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="text-[10px] font-mono text-muted-foreground mb-1 block">
              AMOUNT ({activePair.base.currency})
            </label>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="h-8 text-xs font-mono bg-background"
              type="number"
              step="any"
            />
            {/* Quick percent buttons */}
            <div className="flex gap-1 mt-1.5">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  className="flex-1 py-0.5 text-[9px] font-mono border border-border rounded text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Slippage (market only) */}
          {orderType === "market" && (
            <div>
              <label className="text-[10px] font-mono text-muted-foreground mb-1 block">
                SLIPPAGE TOLERANCE
              </label>
              <div className="flex gap-1">
                {[0.5, 1, 2, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSlippage(s)}
                    className={cn(
                      "flex-1 py-1 text-[10px] font-mono rounded border transition-colors",
                      slippage === s
                        ? "border-primary/30 text-primary bg-primary/5"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {s}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Total preview */}
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground px-1">
            <span>Total</span>
            <span className="text-foreground">
              {total > 0 ? total.toFixed(5) : "—"} {activePair.quote.currency}
            </span>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            className={cn(
              "w-full h-9 text-xs font-mono font-bold",
              side === "buy"
                ? "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
                : "bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30"
            )}
          >
            {side === "buy" ? "BUY" : "SELL"} {activePair.base.currency}
          </Button>

          {!isConnected && (
            <p className="text-[9px] font-mono text-muted-foreground/60 text-center">
              Connect wallet to trade
            </p>
          )}
        </div>
      </div>
    </>
  );
}
