/**
 * Live funnel data for the War Room — pulls real counts from Supabase.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FunnelStage {
  stage: string;
  count: number;
  pct: number;
}

async function fetchFunnel(): Promise<FunnelStage[]> {
  const [
    totalRes,
    walletRes,
    signalRes,
    proRes,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).not("wallet_address", "is", null),
    supabase.from("usage_events").select("user_id", { count: "exact", head: true }).eq("event_type", "signal_clicked"),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).neq("tier", "free").eq("status", "active"),
  ]);

  const total = totalRes.count ?? 0;
  const wallet = walletRes.count ?? 0;
  const signal = signalRes.count ?? 0;
  const pro = proRes.count ?? 0;

  const stages = [
    { stage: "Sign Ups", count: total },
    { stage: "Wallet Connected", count: wallet },
    { stage: "Signal Viewed", count: signal },
    { stage: "Pro Upgrade", count: pro },
  ];

  return stages.map(s => ({
    ...s,
    pct: total > 0 ? Math.round((s.count / total) * 1000) / 10 : 0,
  }));
}

export function useWarRoomFunnel() {
  return useQuery({
    queryKey: ["war-room-funnel"],
    queryFn: fetchFunnel,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
