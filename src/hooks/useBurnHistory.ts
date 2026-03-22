import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

export async function insertBurnRecord(record: Omit<BurnRecord, "id" | "created_at"> & { user_id: string }) {
  const { error } = await (supabase as any).from("burn_history").insert(record);
  if (error) console.error("[BurnHistory] insert error:", error);
}

export function useBurnHistory(walletAddress: string | null) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<BurnRecord[]>({
    queryKey: ["burn-history", walletAddress, userId],
    queryFn: async () => {
      if (!walletAddress) return [];
      const { data, error } = await (supabase as any)
        .from("burn_history")
        .select("*")
        .eq("user_id", userId!)
        .eq("wallet_address", walletAddress)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!walletAddress && !!userId,
    staleTime: 10_000,
  });
}
