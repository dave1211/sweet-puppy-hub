import { useMemo } from "react";
import { useTrackedWallets } from "./useTrackedWallets";
import { useWalletActivity } from "./useWalletActivity";

export interface SmartMoneyEntry { count: number; lastSeen: number; }

export function useSmartMoneyMap() {
  const { wallets } = useTrackedWallets();
  const w0 = wallets[0]?.address ?? null;
  const w1 = wallets[1]?.address ?? null;
  const w2 = wallets[2]?.address ?? null;
  const w3 = wallets[3]?.address ?? null;
  const w4 = wallets[4]?.address ?? null;

  const a0 = useWalletActivity(w0);
  const a1 = useWalletActivity(w1);
  const a2 = useWalletActivity(w2);
  const a3 = useWalletActivity(w3);
  const a4 = useWalletActivity(w4);

  const isLoading = a0.isLoading || a1.isLoading || a2.isLoading || a3.isLoading || a4.isLoading;

  const map = useMemo(() => {
    const result: Record<string, SmartMoneyEntry> = {};
    const allData = [a0.data, a1.data, a2.data, a3.data, a4.data];
    for (const txList of allData) {
      if (!txList) continue;
      for (const tx of txList) {
        if (!tx.tokenAddress) continue;
        const existing = result[tx.tokenAddress];
        if (existing) { existing.count += 1; existing.lastSeen = Math.max(existing.lastSeen, tx.blockTime ?? 0); }
        else { result[tx.tokenAddress] = { count: 1, lastSeen: tx.blockTime ?? 0 }; }
      }
    }
    return result;
  }, [a0.data, a1.data, a2.data, a3.data, a4.data]);

  return { map, isLoading };
}