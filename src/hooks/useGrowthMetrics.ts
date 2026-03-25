import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GrowthMetric {
  id: string;
  date: string;
  signups: number;
  active_users: number;
  wallet_connects: number;
  upgrades: number;
  revenue_usd: number;
  referral_signups: number;
  churn: number;
  dau_over_mau: number;
}

export function useGrowthMetrics(days = 30) {
  return useQuery({
    queryKey: ["growth-metrics", days],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const { data, error } = await supabase
        .from("growth_metrics")
        .select("*")
        .gte("date", since.toISOString().split("T")[0])
        .order("date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as GrowthMetric[];
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
