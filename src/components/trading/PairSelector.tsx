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
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border text-sm font-mono font-bold text-foreground hover:bg-muted transition-colors">
          {activePair.label}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {availablePairs.map((pair) => (
          <DropdownMenuItem
            key={pair.label}
            onClick={() => setActivePair(pair)}
            className={cn(
              "text-xs font-mono",
              pair.label === activePair.label && "text-primary font-bold"
            )}
          >
            {pair.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
