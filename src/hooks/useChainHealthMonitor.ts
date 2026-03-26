/**
 * Multi-chain health monitor hook.
 * Lightweight polling, emits signals on status changes.
 * Never blocks boot — runs after mount.
 */
import { useEffect, useRef, useCallback } from "react";
import { ACTIVE_CHAINS, getChainAdapter } from "@/lib/multichain";
import type { ChainId, ChainNetworkStatus } from "@/lib/multichain/types";
import { useSignalStore } from "@/stores/signalEngine";

const POLL_INTERVAL = 120_000; // 2 min
const STALE_THRESHOLD = 300_000; // 5 min

export type HealthStatus = "healthy" | "degraded" | "unavailable" | "stale";

export interface ChainHealthEntry {
  chainId: ChainId;
  status: HealthStatus;
  latency: number;
  blockHeight: number;
  lastChecked: number;
}

function deriveHealth(ns: ChainNetworkStatus): HealthStatus {
  if (!ns.connected) return "unavailable";
  if (ns.latency > 5000) return "degraded";
  if (Date.now() - ns.lastChecked > STALE_THRESHOLD) return "stale";
  return "healthy";
}

export function useChainHealthMonitor() {
  const prevRef = useRef<Map<ChainId, HealthStatus>>(new Map());
  const emit = useSignalStore(s => s.emit);

  const check = useCallback(async () => {
    const chains = ACTIVE_CHAINS.slice(0, 10); // cap for safety
    const results = await Promise.allSettled(
      chains.map(async c => {
        const adapter = getChainAdapter(c.id);
        const ns = await adapter.getNetworkStatus();
        return { chainId: c.id, ns };
      })
    );

    results.forEach(r => {
      if (r.status !== "fulfilled") return;
      const { chainId, ns } = r.value;
      const health = deriveHealth(ns);
      const prev = prevRef.current.get(chainId);

      // Emit signal on status change only
      if (prev && prev !== health && health !== "healthy") {
        emit({
          category: "health",
          severity: health === "unavailable" ? "critical" : "warning",
          source: "system",
          title: `${chainId.toUpperCase()} ${health}`,
          message: `Network ${health}${ns.latency > 0 ? ` (${ns.latency}ms)` : ""}`,
          chainId,
          dedupeKey: `health-${chainId}-${health}`,
        });
      }

      prevRef.current.set(chainId, health);
    });
  }, [emit]);

  useEffect(() => {
    // Delay first check so it doesn't block boot
    const timer = setTimeout(check, 5_000);
    const interval = setInterval(check, POLL_INTERVAL);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [check]);
}
