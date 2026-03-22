import { useEffect, useRef } from "react";
import { useSmartMoneyMap, SmartMoneyEntry } from "./useSmartMoneyMap";
import { detectSniperActivity } from "@/lib/sniper";
import { toast } from "sonner";

const COOLDOWN_MS = 5 * 60 * 1000;
const FRESHNESS_SECONDS = 300;

export function useSmartMoneyAlerts() {
  const { map, isLoading } = useSmartMoneyMap();
  const cooldowns = useRef<Record<string, number>>({});
  const prevMapRef = useRef<Record<string, SmartMoneyEntry>>({});
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (!initialLoadDone.current) { initialLoadDone.current = true; prevMapRef.current = { ...map }; return; }
    const now = Date.now();
    const nowSec = now / 1000;
    for (const [tokenAddress, entry] of Object.entries(map)) {
      if (entry.count < 2) continue;
      if (entry.lastSeen <= 0 || nowSec - entry.lastSeen >= FRESHNESS_SECONDS) continue;
      const prev = prevMapRef.current[tokenAddress];
      const isNew = !prev || entry.count > prev.count || entry.lastSeen > (prev.lastSeen ?? 0);
      if (!isNew) continue;
      const lastAlerted = cooldowns.current[tokenAddress] ?? 0;
      if (now - lastAlerted < COOLDOWN_MS) continue;
      cooldowns.current[tokenAddress] = now;
      const shortAddr = `${tokenAddress.slice(0, 4)}…${tokenAddress.slice(-4)}`;
      const snType = detectSniperActivity(entry.count, entry.lastSeen);
      if (snType === "sniper") {
        toast.error(`🎯 SNIPER: ${shortAddr} (${entry.count} wallets)`, { description: `High-conviction convergence detected · just now`, duration: 8000 });
      } else {
        toast(`🔥 Smart Money: ${shortAddr}`, { description: `${entry.count} wallets active · just now`, duration: 6000 });
      }
    }
    prevMapRef.current = { ...map };
  }, [map, isLoading]);
}