import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

export type AlertItem = Tables<"alerts">;

export function useAlerts() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["alerts", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AlertItem[];
    },
    enabled: !!userId,
  });

  const addAlert = useMutation({
    mutationFn: async (alert: { address: string; kind: string; threshold: number; direction: string }) => {
      const { data, error } = await supabase
        .from("alerts")
        .insert({
          user_id: userId!,
          device_id: userId!,
          address: alert.address,
          kind: alert.kind,
          threshold: alert.threshold,
          direction: alert.direction,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts", userId] }),
  });

  const toggleAlert = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("alerts").update({ enabled }).eq("id", id).eq("user_id", userId!);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts", userId] }),
  });

  const removeAlert = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("alerts").delete().eq("id", id).eq("user_id", userId!);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts", userId] }),
  });

  return { alerts: query.data ?? [], isLoading: query.isLoading, addAlert, toggleAlert, removeAlert };
}
