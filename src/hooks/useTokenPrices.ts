import { useQuery } from "@tanstack/react-query";

export interface TokenPriceMap {
  [address: string]: { price: number; change24h: number };
}

export function useTokenPrices(addresses: string[]) {
  return useQuery<TokenPriceMap>({
    queryKey: ["token-prices", ...addresses.sort()],
    queryFn: async () => {
      if (addresses.length === 0) return {};
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/token-data?action=batch-prices`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ addresses }),
        }
      );
      if (!res.ok) return {};
      return res.json();
    },
    enabled: addresses.length > 0,
    refetchInterval: 25_000,
    staleTime: 20_000,
    retry: 1,
    retryDelay: 3000,
    refetchOnWindowFocus: false,
  });
}