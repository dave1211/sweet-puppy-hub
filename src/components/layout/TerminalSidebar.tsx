import {
  BarChart3,
  Wallet,
  Star,
  PanelLeftClose,
  PanelLeft,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { useMarketStore } from "@/stores/marketStore";
import { WatchlistSidebar } from "./WatchlistSidebar";

export function TerminalSidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const network = useMarketStore((s) => s.network);

  return (
    <aside
      className={cn(
        "h-full border-r border-border bg-card/50 flex flex-col transition-all duration-200 shrink-0",
        sidebarOpen ? "w-56" : "w-11"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2.5 py-2 border-b border-border/60">
        {sidebarOpen && (
          <div className="flex items-center gap-1.5">
            <Layers className="h-3 w-3 text-primary/60" />
            <span className="text-[9px] font-mono font-semibold text-muted-foreground uppercase tracking-[0.1em]">
              Markets
            </span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1 rounded hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-3.5 w-3.5" />
          ) : (
            <PanelLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Content */}
      {sidebarOpen ? (
        <div className="flex-1 overflow-y-auto">
          <WatchlistSidebar />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-2">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-primary transition-colors"
            title="Markets"
          >
            <Star className="h-3.5 w-3.5" />
          </button>
          <button className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors" title="Charts">
            <BarChart3 className="h-3.5 w-3.5" />
          </button>
          <button className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors" title="Portfolio">
            <Wallet className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Footer - network status */}
      <div className="border-t border-border/40 px-2 py-1.5 mt-auto">
        {sidebarOpen ? (
          <div className="flex items-center gap-1.5 text-[8px] font-mono text-muted-foreground/60">
            <div
              className={cn(
                "h-1.5 w-1.5 rounded-full shrink-0",
                network.connected ? "bg-primary animate-pulse-glow" : "bg-destructive"
              )}
            />
            <span className="truncate">{network.connected ? "XRPL MAINNET" : "DISCONNECTED"}</span>
            {network.ledgerIndex > 0 && (
              <span className="ml-auto text-muted-foreground/40 tabular-nums">#{network.ledgerIndex}</span>
            )}
          </div>
        ) : (
          <div className="flex justify-center">
            <div
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                network.connected ? "bg-primary animate-pulse-glow" : "bg-destructive"
              )}
            />
          </div>
        )}
      </div>
    </aside>
  );
}
