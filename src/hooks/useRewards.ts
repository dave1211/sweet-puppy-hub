import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDeviceId } from "./useDeviceId";
import { getReferralCode } from "@/lib/referral";

export interface RewardRecord {
  id: string;
  device_id: string;
  referral_code: string;
  referred_by: string | null;
  points: number;
  total_referrals: number;
  created_at: string;
  updated_at: string;
}

export function useRewards() {
  const deviceId = useDeviceId();
  const queryClient = useQueryClient();
  const refCode = getReferralCode();

  const query = useQuery({
    queryKey: ["rewards", deviceId],
    queryFn: async (): Promise<RewardRecord> => {
      // Try to get existing record
      const { data, error } = await supabase
        .from("rewards")
        .select("*")
        .eq("device_id", deviceId)
        .maybeSingle();

      if (error) throw error;
      if (data) return data as RewardRecord;

      // Create new record if none exists
      const params = new URLSearchParams(window.location.search);
      const referredBy = params.get("ref") || null;

      const { data: newRecord, error: insertErr } = await supabase
        .from("rewards")
        .insert({
          device_id: deviceId,
          referral_code: refCode,
          referred_by: referredBy,
          points: referredBy ? 50 : 0, // bonus for joining via referral
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      // If referred, credit the referrer
      if (referredBy) {
        await supabase.rpc("increment_referral" as any, { ref_code: referredBy });
      }

      return newRecord as RewardRecord;
    },
  });

  const claimPoints = useMutation({
    mutationFn: async (action: string) => {
      const pointsMap: Record<string, number> = {
        daily_login: 10,
        share_signal: 25,
        add_watchlist: 5,
        set_alert: 5,
        connect_wallet: 50,
      };
      const pts = pointsMap[action] || 0;
      if (!pts || !query.data) return;

      const { error } = await supabase
        .from("rewards")
        .update({ points: (query.data.points || 0) + pts })
        .eq("device_id", deviceId);

      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rewards", deviceId] }),
  });

  return {
    rewards: query.data,
    isLoading: query.isLoading,
    claimPoints,
    referralCode: refCode,
  };
}
