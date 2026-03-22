import { useQuery } from "@tanstack/react-query";
import type { NewLaunchToken } from "./useNewLaunches";

export interface LivePair extends NewLaunchToken {
  change1h: number;
  change5m: number;
  volume1h: number;
  marketCap: number;
  buyCount24h: number;
  sellCount24h: number;
  makers24h: number;
  imageUrl: string | null;
}

function fetchLivePairs(): Promise<LivePair[]> {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  return fetch(
    `https://${projectId}.supabase.co/functions/v1/token-data?action=live-pairs`,
    {
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
    }
  ).then((r) => (r.ok ? r.json() : [])).catch(() => []);
}

export function useLivePairs() {
  return useQuery<LivePair[]>({
    queryKey: ["live-pairs"],
    queryFn: fetchLivePairs,
    staleTime: 15_000,
    refetchInterval: 20_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
