import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDeviceId } from "./useDeviceId";

export function useSnipeHistory() {
  const deviceId = useDeviceId();

  const query = useQuery({
    queryKey: ["snipe-history", deviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("snipe_history")
        .select("*")
        .eq("device_id", deviceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!deviceId,
  });

  const wins = (query.data ?? []).filter(s => (s.pnl_percent ?? 0) > 0);
  const losses = (query.data ?? []).filter(s => (s.pnl_percent ?? 0) < 0);
  const active = (query.data ?? []).filter(s => s.status === "active");

  return {
    history: query.data ?? [],
    wins,
    losses,
    active,
    isLoading: query.isLoading,
  };
}
