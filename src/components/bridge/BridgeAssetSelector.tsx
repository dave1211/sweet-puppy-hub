import { useState } from "react";
import { ArrowDown, Check, Loader2 } from "lucide-react";
import { BRIDGE_ASSETS, type BridgeAsset } from "./BridgeAssets";

interface Props {
  label: string;
  selectedId: string;
  onSelect: (id: string) => void;
  amount?: string;
  onAmountChange?: (val: string) => void;
  readOnly?: boolean;
  computedAmount?: string;
  excludeId?: string;
}

export function BridgeAssetSelector({
  label, selectedId, onSelect, amount, onAmountChange, readOnly, computedAmount, excludeId,
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = BRIDGE_ASSETS.find((a) => a.id === selectedId);
  const available = BRIDGE_ASSETS.filter((a) => a.id !== excludeId);

  return (
    <div className="rounded-lg bg-muted/30 border border-border p-3">
      <div className="text-[9px] font-mono text-muted-foreground mb-1.5">{label}</div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 rounded-md bg-card border border-border px-2.5 py-1.5 text-xs font-mono text-foreground hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm">{selected?.icon}</span>
            <span className="font-bold">{selected?.label}</span>
            <ArrowDown className="h-3 w-3 text-muted-foreground" />
          </button>
          {open && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-md shadow-lg min-w-[140px]">
              {available.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => { onSelect(asset.id); setOpen(false); }}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-[11px] font-mono transition-colors hover:bg-muted/50 ${
                    asset.id === selectedId ? "text-primary" : "text-foreground"
                  }`}
                >
                  <span>{asset.icon}</span>
                  <div className="text-left">
                    <div className="font-bold">{asset.label}</div>
                    <div className="text-[8px] text-muted-foreground">{asset.chain}</div>
                  </div>
                  {asset.id === selectedId && <Check className="h-3 w-3 ml-auto text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 text-right">
          {readOnly ? (
            <div className="text-sm font-mono font-bold text-foreground">{computedAmount || "0.00"}</div>
          ) : (
            <input
              type="number"
              value={amount}
              onChange={(e) => onAmountChange?.(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="w-full text-right bg-transparent text-sm font-mono font-bold text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          )}
          <div className="text-[9px] font-mono text-muted-foreground">
            ${selected ? (parseFloat(readOnly ? computedAmount || "0" : amount || "0") * selected.price).toFixed(2) : "0.00"} USD
          </div>
        </div>
      </div>
    </div>
  );
}
