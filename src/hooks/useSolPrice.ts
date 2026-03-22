import { useQuery } from "@tanstack/react-query";

export interface SolPriceData {
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
}

export function useSolPrice() {
  return useQuery<SolPriceData>({
    queryKey: ["sol-price"],
    queryFn: async () => {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/token-data?action=sol-price`,
        {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch SOL price");
      return res.json();
    },
    refetchInterval: 30_000,
    staleTime: 25_000,
    retry: 0,
    refetchOnWindowFocus: false,
  });
}