import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useSnipeHistory() {
  const { user } = useAuth();
  const userId = user?.id;

  const query = useQuery({
    queryKey: ["snipe-history", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("snipe_history")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
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
