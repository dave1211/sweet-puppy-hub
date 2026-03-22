// Sniper Filters Panel
import { Filter, X } from "lucide-react";
import { useSniperStore } from "../stores/sniperStore";
import { useState } from "react";

export function SniperFilters() {
  const { filters, setFilter, resetFilters } = useSniperStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border bg-card/30">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground w-full transition-colors"
      >
        <Filter className="h-3 w-3" />
        FILTERS
        {(filters.minLiquidity > 0 || filters.maxRiskScore < 100 || filters.smartMoneyOnly) && (
          <span className="bg-primary/20 text-primary rounded px-1 text-[9px]">ACTIVE</span>
        )}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[8px] font-mono text-muted-foreground block mb-0.5">MIN LIQUIDITY</label>
              <input
                type="number"
                value={filters.minLiquidity || ""}
                onChange={(e) => setFilter("minLiquidity", Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full bg-muted/30 border border-border rounded px-2 py-1 text-[10px] font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-[8px] font-mono text-muted-foreground block mb-0.5">MAX RISK</label>
              <input
                type="number"
                value={filters.maxRiskScore < 100 ? filters.maxRiskScore : ""}
                onChange={(e) => setFilter("maxRiskScore", Number(e.target.value) || 100)}
                placeholder="100"
                className="w-full bg-muted/30 border border-border rounded px-2 py-1 text-[10px] font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-[8px] font-mono text-muted-foreground block mb-0.5">MIN VOLUME</label>
              <input
                type="number"
                value={filters.minVolume || ""}
                onChange={(e) => setFilter("minVolume", Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full bg-muted/30 border border-border rounded px-2 py-1 text-[10px] font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-[8px] font-mono text-muted-foreground block mb-0.5">MIN HOLDERS</label>
              <input
                type="number"
                value={filters.minHolders || ""}
                onChange={(e) => setFilter("minHolders", Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full bg-muted/30 border border-border rounded px-2 py-1 text-[10px] font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {[
              { key: "smartMoneyOnly" as const, label: "SMART $ ONLY" },
              { key: "verifiedOnly" as const, label: "VERIFIED ONLY" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key, !filters[key])}
                className={`text-[9px] font-mono px-2 py-1 rounded transition-colors ${
                  filters[key]
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "bg-muted/20 text-muted-foreground border border-transparent"
                }`}
              >
                {label}
              </button>
            ))}
            <button onClick={resetFilters} className="ml-auto text-[9px] font-mono text-muted-foreground hover:text-foreground flex items-center gap-1">
              <X className="h-3 w-3" /> CLEAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
