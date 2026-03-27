import { useQueries } from "@tanstack/react-query";

export interface WalletBalanceData {
  address: string;
  solBalance: number;
  tokenCount: number;
  isLoading: boolean;
  error: boolean;
}

async function fetchBalance(address: string): Promise<{ solBalance: number; tokenCount: number }> {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const res = await fetch(
    `https://${projectId}.supabase.co/functions/v1/wallet-balances?address=${address}`,
    { headers: { apikey: anonKey, authorization: `Bearer ${anonKey}` } }
  );
  if (!res.ok) throw new Error("Failed to fetch wallet balances");
  const data = await res.json();
  return {
    solBalance: data.solBalance ?? 0,
    tokenCount: data.tokens?.length ?? 0,
  };
}

/**
 * Fetches SOL balance and token count for multiple wallet addresses.
 */
export function useWalletBalances(addresses: string[]): Map<string, WalletBalanceData> {
  const queries = useQueries({
    queries: addresses.map(addr => ({
      queryKey: ["wallet-balance-profile", addr],
      queryFn: () => fetchBalance(addr),
      staleTime: 30_000,
      refetchInterval: 60_000,
      enabled: !!addr,
    })),
  });

  const map = new Map<string, WalletBalanceData>();
  addresses.forEach((addr, i) => {
    const q = queries[i];
    map.set(addr, {
      address: addr,
      solBalance: q.data?.solBalance ?? 0,
      tokenCount: q.data?.tokenCount ?? 0,
      isLoading: q.isLoading,
      error: q.isError,
    });
  });

  return map;
}
