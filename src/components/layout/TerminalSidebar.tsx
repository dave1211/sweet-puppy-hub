import { useEffect } from "react";
import {
  BarChart3,
  Wallet,
  Activity,
  Star,
  TrendingUp,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { useMarketStore } from "@/stores/marketStore";
import { useWalletStore } from "@/stores/walletStore";
import { WatchlistSidebar } from "./WatchlistSidebar";

export function TerminalSidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const network = useMarketStore((s) => s.network);
  const isConnected = useWalletStore((s) => s.isConnected);

  return (
    <aside
      className={cn(
        "h-full border-r border-border bg-card flex flex-col transition-all duration-200 shrink-0",
        sidebarOpen ? "w-64" : "w-12"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        {sidebarOpen && (
          <span className="text-xs font-mono font-bold text-foreground tracking-wide">
            ASSETS
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Content */}
      {sidebarOpen ? (
        <div className="flex-1 overflow-y-auto">
          <WatchlistSidebar />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-3">
          <button className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Assets">
            <Star className="h-4 w-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Trading">
            <BarChart3 className="h-4 w-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Portfolio">
            <Wallet className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Footer - network status */}
      <div className="border-t border-border p-2">
        {sidebarOpen ? (
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
            <div
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                network.connected ? "bg-primary animate-pulse" : "bg-destructive"
              )}
            />
            <span>{network.connected ? "XRPL CONNECTED" : "DISCONNECTED"}</span>
            {network.ledgerIndex > 0 && (
              <span className="ml-auto">#{network.ledgerIndex}</span>
            )}
          </div>
        ) : (
          <div className="flex justify-center">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                network.connected ? "bg-primary animate-pulse" : "bg-destructive"
              )}
            />
          </div>
        )}
      </div>
    </aside>
  );
}
