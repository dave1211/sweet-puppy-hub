import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@/contexts/WalletContext";
import { useCallback } from "react";

export interface WalletToken {
  mint: string;
  balance: number;
  decimals: number;
  symbol: string;
  name: string;
  icon: string;
  tokenAccount: string;
}

export interface WalletPortfolio {
  address: string;
  solBalance: number;
  tokens: WalletToken[];
  lastUpdated: number;
}

export function useWalletPortfolio() {
  const { walletAddress, isConnected } = useWallet();
  const queryClient = useQueryClient();

  const query = useQuery<WalletPortfolio>({
    queryKey: ["wallet-portfolio", walletAddress],
    queryFn: async (): Promise<WalletPortfolio> => {
      if (!walletAddress) throw new Error("No wallet address");
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/wallet-balances?address=${walletAddress}`,
        {
          headers: {
            apikey: anonKey,
            authorization: `Bearer ${anonKey}`,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch wallet balances");
      const data = await res.json();
      return { ...data, lastUpdated: Date.now() };
    },
    enabled: isConnected && !!walletAddress,
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: 2,
    retryDelay: 3000,
    refetchOnWindowFocus: true,
  });

  const refresh = useCallback(() => {
    if (walletAddress) {
      queryClient.invalidateQueries({ queryKey: ["wallet-portfolio", walletAddress] });
    }
  }, [walletAddress, queryClient]);

  return {
    ...query,
    portfolio: query.data ?? null,
    solBalance: query.data?.solBalance ?? 0,
    tokens: query.data?.tokens ?? [],
    refresh,
  };
}
