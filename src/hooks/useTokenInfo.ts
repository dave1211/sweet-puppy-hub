import { useQuery } from "@tanstack/react-query";

export interface TokenInfo {
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
}

export async function fetchTokenInfo(address: string): Promise<TokenInfo | null> {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const res = await fetch(
    `https://${projectId}.supabase.co/functions/v1/token-data?action=token-info&address=${encodeURIComponent(address)}`,
    {
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
    }
  );
  if (!res.ok) return null;
  return res.json();
}

export function useTokenInfo(address: string | null) {
  return useQuery<TokenInfo | null>({
    queryKey: ["token-info", address],
    queryFn: () => (address ? fetchTokenInfo(address) : null),
    enabled: !!address,
    staleTime: 30000,
    refetchInterval: 30000,
  });
}