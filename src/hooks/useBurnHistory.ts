import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BurnRecord {
  id: string;
  wallet_address: string;
  token_mint: string;
  token_symbol: string;
  token_name: string;
  amount: number;
  decimals: number;
  signature: string;
  account_closed: boolean;
  rent_reclaimed: number;
  created_at: string;
}

export async function insertBurnRecord(record: Omit<BurnRecord, "id" | "created_at">) {
  const { error } = await (supabase as any).from("burn_history").insert(record);
  if (error) console.error("[BurnHistory] insert error:", error);
}

export function useBurnHistory(walletAddress: string | null) {
  return useQuery<BurnRecord[]>({
    queryKey: ["burn-history", walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      const { data, error } = await (supabase as any)
        .from("burn_history")
        .select("*")
        .eq("wallet_address", walletAddress)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!walletAddress,
    staleTime: 10_000,
  });
}
