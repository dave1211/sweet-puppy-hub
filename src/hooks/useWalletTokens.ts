import { useQuery } from "@tanstack/react-query";

import { useWallet } from "@/contexts/WalletContext";

export interface TokenBalance {
  mint: string;
  balance: number;
  decimals: number;
  symbol: string;
  name: string;
  icon: string;
  tokenAccount: string;
}

interface WalletBalancesResponse {
  address: string;
  solBalance: number;
  tokens: TokenBalance[];
}

export function useWalletTokens() {
  const { walletAddress, isConnected } = useWallet();

  return useQuery<WalletBalancesResponse>({
    queryKey: ["wallet-balances", walletAddress],
    queryFn: async () => {
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
      return res.json();
    },
    enabled: isConnected && !!walletAddress,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
