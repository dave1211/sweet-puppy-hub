import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TannerTokenStats {
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  liquidity: number;
  pairAddress: string | null;
  dexId: string | null;
  holders: number | null;
  lastUpdated: string;
}

async function fetchTannerStats(): Promise<TannerTokenStats> {
  const { data, error } = await supabase.functions.invoke("tanner-token-stats");
  if (error) throw error;
  return data as TannerTokenStats;
}

export function useTannerTokenStats() {
  return useQuery({
    queryKey: ["tanner-token-stats"],
    queryFn: fetchTannerStats,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}