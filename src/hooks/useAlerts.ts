import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDeviceId } from "./useDeviceId";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type AlertItem = Tables<"alerts">;

export function useAlerts() {
  const deviceId = useDeviceId();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["alerts", deviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("device_id", deviceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AlertItem[];
    },
  });

  const addAlert = useMutation({
    mutationFn: async (alert: { address: string; kind: string; threshold: number; direction: string }) => {
      const { data, error } = await supabase
        .from("alerts")
        .insert({
          device_id: deviceId,
          address: alert.address,
          kind: alert.kind,
          threshold: alert.threshold,
          direction: alert.direction,
        } as TablesInsert<"alerts">)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts", deviceId] }),
  });

  const toggleAlert = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("alerts").update({ enabled }).eq("id", id).eq("device_id", deviceId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts", deviceId] }),
  });

  const removeAlert = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("alerts").delete().eq("id", id).eq("device_id", deviceId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts", deviceId] }),
  });

  return { alerts: query.data ?? [], isLoading: query.isLoading, addAlert, toggleAlert, removeAlert };
}