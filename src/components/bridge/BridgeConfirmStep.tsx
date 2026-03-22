import { ArrowRight, Clock, Route, Percent, Shield } from "lucide-react";
import type { BridgeQuote } from "./BridgeAssets";

interface Props {
  quote: BridgeQuote;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export function BridgeConfirmStep({ quote, onConfirm, onCancel, isProcessing }: Props) {
  return (
    <div className="space-y-3">
      <div className="text-[10px] font-mono text-muted-foreground mb-1">CONFIRM BRIDGE</div>

      {/* Summary */}
      <div className="flex items-center justify-between rounded-lg bg-muted/30 border border-border p-3">
        <div className="text-center">
          <span className="text-lg">{quote.fromAsset.icon}</span>
          <div className="text-xs font-mono font-bold text-foreground">{quote.inputAmount.toFixed(4)}</div>
          <div className="text-[9px] font-mono text-muted-foreground">{quote.fromAsset.label}</div>
        </div>
        <ArrowRight className="h-4 w-4 text-primary" />
        <div className="text-center">
          <span className="text-lg">{quote.toAsset.icon}</span>
          <div className="text-xs font-mono font-bold text-primary">{quote.outputAmount.toFixed(4)}</div>
          <div className="text-[9px] font-mono text-muted-foreground">{quote.toAsset.label}</div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1.5">
        {[
          { icon: Route, label: "Route", value: quote.route.join(" → ") },
          { icon: Percent, label: "Fee", value: `${quote.fee.toFixed(6)} ${quote.fromAsset.label} (${quote.feePercent}%)` },
          { icon: Clock, label: "Est. Time", value: quote.estimatedTime },
          { icon: Shield, label: "Price Impact", value: `${quote.priceImpact}%` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center justify-between text-[10px] font-mono">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Icon className="h-3 w-3" /> {label}
            </span>
            <span className="text-foreground">{value}</span>
          </div>
        ))}
      </div>

      {/* Rate */}
      <div className="rounded bg-primary/5 border border-primary/20 p-2 text-center">
        <div className="text-[9px] font-mono text-muted-foreground">RATE</div>
        <div className="text-xs font-mono text-primary font-bold">
          1 {quote.fromAsset.label} = {(quote.fromAsset.price / quote.toAsset.price).toFixed(4)} {quote.toAsset.label}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 rounded border border-border py-2 text-[10px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40"
        >
          CANCEL
        </button>
        <button
          onClick={onConfirm}
          disabled={isProcessing}
          className="flex-1 rounded bg-primary/15 border border-primary/30 py-2 text-[10px] font-mono text-primary hover:bg-primary/25 transition-colors disabled:opacity-40"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-1.5">
              <span className="animate-spin"><svg className="h-3 w-3" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.3"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/></svg></span>
              BRIDGING…
            </span>
          ) : "CONFIRM BRIDGE"}
        </button>
      </div>
    </div>
  );
}
