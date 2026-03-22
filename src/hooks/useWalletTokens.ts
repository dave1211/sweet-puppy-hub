import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
      const { data, error } = await supabase.functions.invoke("wallet-balances", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        body: undefined,
      });

      // supabase.functions.invoke doesn't support query params well for GET,
      // so we'll call it directly
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
