import { useMemo } from "react";
import { useTrackedWallets } from "./useTrackedWallets";
import { useWalletActivity, WalletTransaction } from "./useWalletActivity";

export type SmartMoneyLabel = "ACCUMULATING" | "ACTIVE" | "WATCH";

export interface SmartMoneyToken {
  tokenAddress: string;
  tokenSymbol: string | null;
  walletCount: number;
  interactionCount: number;
  latestTime: number;
  label: SmartMoneyLabel;
  walletLabels: string[];
}

function classifyLabel(interactionCount: number, walletCount: number): SmartMoneyLabel {
  if (interactionCount >= 3 || walletCount >= 2) return "ACCUMULATING";
  if (interactionCount >= 2) return "ACTIVE";
  return "WATCH";
}

export function useSmartMoney() {
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

  const allActivities = useMemo(() => {
    const entries: { walletAddress: string; walletLabel: string; tx: WalletTransaction }[] = [];
    const sources = [
      { addr: w0, data: a0.data, label: wallets[0]?.label },
      { addr: w1, data: a1.data, label: wallets[1]?.label },
      { addr: w2, data: a2.data, label: wallets[2]?.label },
      { addr: w3, data: a3.data, label: wallets[3]?.label },
      { addr: w4, data: a4.data, label: wallets[4]?.label },
    ];
    for (const s of sources) {
      if (!s.addr || !s.data) continue;
      for (const tx of s.data) {
        entries.push({ walletAddress: s.addr, walletLabel: s.label || `${s.addr.slice(0, 4)}…${s.addr.slice(-4)}`, tx });
      }
    }
    return entries;
  }, [w0, w1, w2, w3, w4, a0.data, a1.data, a2.data, a3.data, a4.data, wallets]);

  const isLoading = a0.isLoading || a1.isLoading || a2.isLoading || a3.isLoading || a4.isLoading;

  const tokens = useMemo(() => {
    const map = new Map<string, { tokenSymbol: string | null; wallets: Set<string>; walletLabels: Set<string>; count: number; latestTime: number }>();
    for (const entry of allActivities) {
      const addr = entry.tx.tokenAddress;
      if (!addr) continue;
      const existing = map.get(addr);
      if (existing) {
        existing.wallets.add(entry.walletAddress);
        existing.walletLabels.add(entry.walletLabel);
        existing.count++;
        if (entry.tx.blockTime && entry.tx.blockTime > existing.latestTime) existing.latestTime = entry.tx.blockTime;
        if (!existing.tokenSymbol && entry.tx.tokenSymbol) existing.tokenSymbol = entry.tx.tokenSymbol;
      } else {
        map.set(addr, { tokenSymbol: entry.tx.tokenSymbol, wallets: new Set([entry.walletAddress]), walletLabels: new Set([entry.walletLabel]), count: 1, latestTime: entry.tx.blockTime || 0 });
      }
    }

    const result: SmartMoneyToken[] = [];
    for (const [tokenAddress, data] of map.entries()) {
      result.push({ tokenAddress, tokenSymbol: data.tokenSymbol, walletCount: data.wallets.size, interactionCount: data.count, latestTime: data.latestTime, label: classifyLabel(data.count, data.wallets.size), walletLabels: Array.from(data.walletLabels) });
    }
    result.sort((a, b) => b.interactionCount - a.interactionCount || b.latestTime - a.latestTime);
    return result;
  }, [allActivities]);

  const getTokenIntel = (tokenAddress: string | null): SmartMoneyToken | null => {
    if (!tokenAddress) return null;
    return tokens.find((t) => t.tokenAddress === tokenAddress) ?? null;
  };

  return { tokens, isLoading, getTokenIntel };
}