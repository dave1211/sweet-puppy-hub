import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTradingStore } from "@/stores/tradingStore";
import { useMarketStore } from "@/stores/marketStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function TradeConfirmModal() {
  const {
    showConfirm, setShowConfirm,
    side, orderType, price, amount, slippage,
    isSubmitting, setSubmitting, setLastTxResult,
  } = useTradingStore();
  const { activePair, lastPrice } = useMarketStore();

  const numPrice = orderType === "market" ? lastPrice : Number(price);
  const numAmount = Number(amount);
  const total = numPrice * numAmount;

  const handleConfirm = async () => {
    setSubmitting(true);
    // Simulate tx signing
    await new Promise((r) => setTimeout(r, 1500));
    const fakeTxHash = `TX${Date.now().toString(36).toUpperCase()}`;
    setLastTxResult(fakeTxHash);
    setSubmitting(false);
    setShowConfirm(false);
    toast.success(`${side.toUpperCase()} order submitted`, {
      description: `${numAmount} ${activePair.base.currency} @ ${numPrice.toFixed(5)} — TX: ${fakeTxHash.slice(0, 12)}…`,
    });
  };

  return (
    <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">
            CONFIRM {side.toUpperCase()} ORDER
          </DialogTitle>
          <DialogDescription className="text-xs font-mono text-muted-foreground">
            Review your order details before signing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-3">
          <Row label="Pair" value={activePair.label} />
          <Row label="Side" value={side.toUpperCase()} valueClass={side === "buy" ? "text-primary" : "text-destructive"} />
          <Row label="Type" value={orderType.toUpperCase()} />
          <Row label="Price" value={`${numPrice.toFixed(5)} ${activePair.quote.currency}`} />
          <Row label="Amount" value={`${numAmount} ${activePair.base.currency}`} />
          <Row label="Total" value={`${total.toFixed(5)} ${activePair.quote.currency}`} />
          {orderType === "market" && <Row label="Slippage" value={`${slippage}%`} />}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setShowConfirm(false)} className="text-xs font-mono">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={cn(
              "text-xs font-mono",
              side === "buy"
                ? "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
                : "bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30"
            )}
          >
            {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : null}
            {isSubmitting ? "Signing…" : `Confirm ${side.toUpperCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between text-[11px] font-mono">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-foreground", valueClass)}>{value}</span>
    </div>
  );
}
