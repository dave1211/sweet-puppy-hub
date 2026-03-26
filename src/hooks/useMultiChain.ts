import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getChainAdapter, getMultiChainPortfolio, ACTIVE_CHAINS } from "@/lib/multichain";
import type { ChainId, ChainBalance, ChainNetworkStatus, MultiChainPortfolio } from "@/lib/multichain";

export interface ChainWalletConfig {
  chainId: ChainId;
  address: string;
}

/**
 * Hook for multi-chain portfolio data.
 * Fetches balances in parallel across chains, each failing independently.
 */
export function useMultiChainPortfolio(wallets: Partial<Record<ChainId, string>>) {
  const walletKey = JSON.stringify(wallets);
  const hasWallets = Object.values(wallets).some(Boolean);

  return useQuery<MultiChainPortfolio>({
    queryKey: ["multichain-portfolio", walletKey],
    queryFn: () => getMultiChainPortfolio(wallets),
    enabled: hasWallets,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  });
}

/**
 * Hook for individual chain network status.
 */
export function useChainStatus(chainId: ChainId) {
  return useQuery<ChainNetworkStatus>({
    queryKey: ["chain-status", chainId],
    queryFn: () => getChainAdapter(chainId).getNetworkStatus(),
    staleTime: 60_000,
    refetchInterval: 120_000,
    retry: 1,
  });
}

/**
 * Hook for managing multi-chain wallet addresses.
 * Persists wallet addresses per chain in localStorage.
 */
export function useMultiChainWallets() {
  const STORAGE_KEY = "tanner_multichain_wallets";

  const loadWallets = (): Partial<Record<ChainId, string>> => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const [wallets, setWalletsState] = useState<Partial<Record<ChainId, string>>>(loadWallets);

  const setWallet = useCallback((chainId: ChainId, address: string | null) => {
    setWalletsState(prev => {
      const next = { ...prev };
      if (address) {
        next[chainId] = address;
      } else {
        delete next[chainId];
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch { /* quota exceeded — ignore */ }
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setWalletsState({});
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  return { wallets, setWallet, clearAll };
}
