/**
 * Live War Room metrics — pulls real data from Supabase tables.
 * Refreshes every 60s. Admin-only data is gated by RLS.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WarRoomMetrics {
  totalUsers: number;
  newUsers7d: number;
  activeUsers24h: number;
  premiumUsers: number;
  sniperUses7d: number;
  alertsFired7d: number;
  upgradeClicks7d: number;
  upgradeCompleted7d: number;
  signalClicks7d: number;
  totalLaunches: number;
  recentLaunches7d: number;
}

async function fetchMetrics(): Promise<WarRoomMetrics> {
  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 86400000).toISOString();
  const d24h = new Date(now.getTime() - 86400000).toISOString();

  // Run all queries in parallel
  const [
    totalUsersRes,
    newUsers7dRes,
    premiumRes,
    activeRes,
    sniperRes,
    alertsRes,
    upgradeClicksRes,
    upgradeCompletedRes,
    signalClicksRes,
    totalLaunchesRes,
    recentLaunchesRes,
  ] = await Promise.all([
    // Total profiles
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    // New users last 7d
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", d7),
    // Premium users (tier != free)
    supabase.from("profiles").select("id", { count: "exact", head: true }).neq("tier", "free"),
    // Active users 24h (distinct users with usage_events)
    supabase.from("usage_events").select("user_id", { count: "exact", head: true }).gte("created_at", d24h).not("user_id", "is", null),
    // Sniper uses 7d
    supabase.from("snipe_history").select("id", { count: "exact", head: true }).gte("created_at", d7),
    // Alerts created 7d
    supabase.from("alerts").select("id", { count: "exact", head: true }).gte("created_at", d7),
    // Upgrade clicks 7d
    supabase.from("usage_events").select("id", { count: "exact", head: true }).eq("event_type", "upgrade_clicked").gte("created_at", d7),
    // Upgrade completed 7d
    supabase.from("usage_events").select("id", { count: "exact", head: true }).eq("event_type", "upgrade_completed").gte("created_at", d7),
    // Signal clicks 7d
    supabase.from("usage_events").select("id", { count: "exact", head: true }).eq("event_type", "signal_clicked").gte("created_at", d7),
    // Total launches
    supabase.from("launches").select("id", { count: "exact", head: true }),
    // Recent launches 7d
    supabase.from("launches").select("id", { count: "exact", head: true }).gte("created_at", d7),
  ]);

  return {
    totalUsers: totalUsersRes.count ?? 0,
    newUsers7d: newUsers7dRes.count ?? 0,
    activeUsers24h: activeRes.count ?? 0,
    premiumUsers: premiumRes.count ?? 0,
    sniperUses7d: sniperRes.count ?? 0,
    alertsFired7d: alertsRes.count ?? 0,
    upgradeClicks7d: upgradeClicksRes.count ?? 0,
    upgradeCompleted7d: upgradeCompletedRes.count ?? 0,
    signalClicks7d: signalClicksRes.count ?? 0,
    totalLaunches: totalLaunchesRes.count ?? 0,
    recentLaunches7d: recentLaunchesRes.count ?? 0,
  };
}

export function useWarRoomMetrics() {
  return useQuery({
    queryKey: ["war-room-metrics"],
    queryFn: fetchMetrics,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
