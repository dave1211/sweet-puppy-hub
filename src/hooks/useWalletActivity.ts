import { useQuery } from "@tanstack/react-query";

export interface WalletTransaction {
  signature: string;
  blockTime: number | null;
  slot: number;
  err: unknown;
  memo: string | null;
  tokenAddress: string | null;
  type: "buy" | "sell" | "transfer" | "unknown";
  amount: number | null;
  tokenSymbol: string | null;
}

export function useWalletActivity(address: string | null) {
  return useQuery<WalletTransaction[]>({
    queryKey: ["wallet-activity", address],
    queryFn: async () => {
      if (!address) return [];
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/token-data?action=wallet-activity&address=${encodeURIComponent(address)}&limit=10`,
        {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!address,
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: 0,
    refetchOnWindowFocus: false,
  });
}