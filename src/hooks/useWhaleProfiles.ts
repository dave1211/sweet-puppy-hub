import { useMemo } from "react";
import { useTrackedWallets } from "./useTrackedWallets";
import { useWalletActivity } from "./useWalletActivity";
import { classifyWallet, WalletProfile, WhaleClass } from "@/lib/whale";

export interface WhaleProfile extends WalletProfile { whaleClass: WhaleClass; }

export function useWhaleProfiles() {
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

  const { profiles, whaleAddresses, tokenWhaleCount } = useMemo(() => {
    const sources = [
      { addr: w0, data: a0.data, label: wallets[0]?.label },
      { addr: w1, data: a1.data, label: wallets[1]?.label },
      { addr: w2, data: a2.data, label: wallets[2]?.label },
      { addr: w3, data: a3.data, label: wallets[3]?.label },
      { addr: w4, data: a4.data, label: wallets[4]?.label },
    ];

    const profiles: WhaleProfile[] = [];
    const whaleAddresses = new Set<string>();
    const tokenWhaleMap = new Map<string, Set<string>>();

    for (const s of sources) {
      if (!s.addr || !s.data) continue;
      const tokenSet = new Set<string>();
      let latest = 0;
      for (const tx of s.data) {
        if (tx.tokenAddress) tokenSet.add(tx.tokenAddress);
        if (tx.blockTime && tx.blockTime > latest) latest = tx.blockTime;
      }
      const profile: WalletProfile = { address: s.addr, label: s.label || `${s.addr.slice(0, 4)}…${s.addr.slice(-4)}`, totalInteractions: s.data.length, uniqueTokens: tokenSet.size, latestActivity: latest };
      const whaleClass = classifyWallet(profile);
      profiles.push({ ...profile, whaleClass });
      if (whaleClass === "whale") {
        whaleAddresses.add(s.addr);
        for (const tokenAddr of tokenSet) {
          if (!tokenWhaleMap.has(tokenAddr)) tokenWhaleMap.set(tokenAddr, new Set());
          tokenWhaleMap.get(tokenAddr)!.add(s.addr);
        }
      }
    }

    const tokenWhaleCount: Record<string, number> = {};
    for (const [token, whaleSet] of tokenWhaleMap) { tokenWhaleCount[token] = whaleSet.size; }
    return { profiles, whaleAddresses, tokenWhaleCount };
  }, [w0, w1, w2, w3, w4, a0.data, a1.data, a2.data, a3.data, a4.data, wallets]);

  return { profiles, whaleAddresses, tokenWhaleCount, isLoading };
}