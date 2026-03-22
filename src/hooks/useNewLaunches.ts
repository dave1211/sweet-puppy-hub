import { useQuery } from "@tanstack/react-query";

export interface NewLaunchToken {
  address: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  liquidity: number;
  pairCreatedAt: number;
  dexId: string;
  url: string;
}

function fetchFromEdge(action: string): Promise<NewLaunchToken[]> {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  return fetch(
    `https://${projectId}.supabase.co/functions/v1/token-data?action=${action}`,
    {
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
    }
  ).then((r) => (r.ok ? r.json() : [])).catch(() => []);
}

export function useNewLaunches() {
  return useQuery<NewLaunchToken[]>({
    queryKey: ["new-launches"],
    queryFn: () => fetchFromEdge("new-launches"),
    staleTime: 10_000,
    refetchInterval: 15_000,
    retry: 0,
    refetchOnWindowFocus: false,
  });
}

export function useTrendingSignals() {
  return useQuery<NewLaunchToken[]>({
    queryKey: ["trending-signals"],
    queryFn: () => fetchFromEdge("trending-signals"),
    staleTime: 15_000,
    refetchInterval: 20_000,
    retry: 0,
    refetchOnWindowFocus: false,
  });
}