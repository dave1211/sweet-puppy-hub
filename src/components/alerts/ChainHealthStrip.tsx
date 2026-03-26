/**
 * Chain health strip for Multi-Chain Hub.
 * Shows current health status per chain with signal counts.
 */
import { useMemo } from "react";
import { Wifi, WifiOff, AlertTriangle, Loader2 } from "lucide-react";
import { ACTIVE_CHAINS } from "@/lib/multichain";
import { useChainStatus } from "@/hooks/useMultiChain";
import { useSignalStore, filterSignals } from "@/stores/signalEngine";
import type { ChainId } from "@/lib/multichain/types";
import { cn } from "@/lib/utils";

function ChainHealthDot({ chainId }: { chainId: ChainId }) {
  const { data: status, isLoading } = useChainStatus(chainId);
  const signals = useSignalStore(s => s.signals);
  const chainSignals = useMemo(
    () => filterSignals(signals, { chainId, category: "health", showDismissed: false }).filter(s => !s.read).length,
    [signals, chainId]
  );

  if (isLoading) return <Loader2 className="h-2.5 w-2.5 animate-spin text-muted-foreground" />;

  const connected = status?.connected ?? false;

  return (
    <span className="relative">
      {connected
        ? <Wifi className="h-2.5 w-2.5 text-terminal-green" />
        : <WifiOff className="h-2.5 w-2.5 text-destructive" />}
      {chainSignals > 0 && (
        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-terminal-amber" />
      )}
    </span>
  );
}

export function ChainHealthStrip({ chains }: { chains?: typeof ACTIVE_CHAINS }) {
  const list = chains ?? ACTIVE_CHAINS;

  return (
    <div className="flex flex-wrap gap-2">
      {list.map(c => (
        <div
          key={c.id}
          className="flex items-center gap-1.5 px-2 py-1 rounded border border-border/30 bg-card/20 text-[9px] font-mono text-muted-foreground"
        >
          <span>{c.icon}</span>
          <span>{c.symbol}</span>
          <ChainHealthDot chainId={c.id} />
        </div>
      ))}
    </div>
  );
}
