import { ChevronDown } from "lucide-react";
import { useMarketStore } from "@/stores/marketStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function PairSelector() {
  const { activePair, availablePairs, setActivePair } = useMarketStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-muted/40 border border-border/60 text-xs font-mono font-bold text-foreground hover:bg-muted/60 hover:border-border transition-all">
          <span className="text-primary/80 text-[10px]">●</span>
          {activePair.label}
          <ChevronDown className="h-3 w-3 text-muted-foreground/60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44 bg-card border-border">
        {availablePairs.map((pair) => (
          <DropdownMenuItem
            key={pair.label}
            onClick={() => setActivePair(pair)}
            className={cn(
              "text-[11px] font-mono cursor-pointer",
              pair.label === activePair.label && "text-primary font-bold"
            )}
          >
            <span className={cn(
              "mr-2 text-[8px]",
              pair.label === activePair.label ? "text-primary" : "text-muted-foreground/30"
            )}>●</span>
            {pair.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
