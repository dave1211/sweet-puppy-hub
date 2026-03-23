import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getReferralCode } from "@/lib/referral";

export interface RewardRecord {
  id: string;
  device_id: string;
  user_id: string;
  referral_code: string;
  referred_by: string | null;
  points: number;
  total_referrals: number;
  created_at: string;
  updated_at: string;
}

export function useRewards() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const refCode = getReferralCode();

  const query = useQuery({
    queryKey: ["rewards", userId],
    queryFn: async (): Promise<RewardRecord> => {
      const { data, error } = await supabase
        .from("rewards")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();

      if (error) throw error;
      if (data) return data as RewardRecord;

      // Initialize via secured RPC if no record exists
      const params = new URLSearchParams(window.location.search);
      const referredByParam = params.get("ref");
      const referredBy = referredByParam && /^[a-zA-Z0-9_-]{4,64}$/.test(referredByParam)
        ? referredByParam.toLowerCase()
        : null;

      const { data: initData, error: initErr } = await supabase.rpc("initialize_rewards", {
        p_device_id: userId!,
        p_referral_code: refCode.toLowerCase(),
        p_referred_by: referredBy,
      });

      if (initErr) throw initErr;

      const initResult = initData as { success: boolean; error?: string; record?: RewardRecord };
      if (!initResult?.success || !initResult.record) {
        throw new Error(initResult?.error || "Failed to initialize rewards");
      }

      return initResult.record;
    },
    enabled: !!userId,
  });

  const claimPoints = useMutation({
    mutationFn: async (action: string) => {
      const { data, error } = await supabase.rpc("claim_reward_points", {
        p_action: action,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || "Claim failed");
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rewards", userId] }),
  });

  return {
    rewards: query.data,
    isLoading: query.isLoading,
    claimPoints,
    referralCode: refCode,
  };
}
