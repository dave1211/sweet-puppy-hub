import { useQuery } from "@tanstack/react-query";

export interface TokenOverview {
  holders: number;
  uniqueWallets: number;
  trade24h: number;
  buy24h: number;
  sell24h: number;
  v24hUSD: number;
  mc: number;
  supply: number;
  price: number;
  priceChange24h: number;
  // Enriched fields from DexScreener fallback
  buyCount?: number;
  sellCount?: number;
  txCount?: number;
  holderCount?: number;
  topHolderPct?: number;
  lpLocked?: boolean | null;
  deployerAddress?: string | null;
  website?: string | null;
  twitter?: string | null;
  telegram?: string | null;
  imageUrl?: string | null;
}

function fetchTokenOverview(address: string): Promise<TokenOverview | null> {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  return fetch(
    `https://${projectId}.supabase.co/functions/v1/token-data?action=token-overview&address=${encodeURIComponent(address)}`,
    {
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
    }
  ).then((r) => (r.ok ? r.json() : null)).catch(() => null);
}

export function useTokenOverview(address: string | null) {
  return useQuery<TokenOverview | null>({
    queryKey: ["token-overview", address],
    queryFn: () => (address ? fetchTokenOverview(address) : null),
    enabled: !!address,
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: 1,
  });
}
