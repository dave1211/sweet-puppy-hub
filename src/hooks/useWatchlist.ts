import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDeviceId } from "./useDeviceId";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type WatchlistItem = Tables<"watchlist">;

function normalizeAddress(addr: string): string {
  return addr.trim();
}

export function useWatchlist() {
  const deviceId = useDeviceId();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["watchlist", deviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("watchlist")
        .select("*")
        .eq("device_id", deviceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as WatchlistItem[];
    },
  });

  const addItem = useMutation({
    mutationFn: async (item: { address: string; label?: string }) => {
      const normalized = normalizeAddress(item.address);
      const { data: existing } = await supabase
        .from("watchlist")
        .select("id")
        .eq("device_id", deviceId)
        .eq("address", normalized)
        .maybeSingle();

      if (existing) {
        if (item.label) {
          const { error } = await supabase
            .from("watchlist")
            .update({ label: item.label })
            .eq("id", existing.id)
            .eq("device_id", deviceId);
          if (error) throw error;
        }
        return existing;
      }

      const { data, error } = await supabase
        .from("watchlist")
        .insert({
          device_id: deviceId,
          address: normalized,
          label: item.label || null,
        } as TablesInsert<"watchlist">)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["watchlist", deviceId] }),
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("watchlist")
        .delete()
        .eq("id", id)
        .eq("device_id", deviceId);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["watchlist", deviceId] }),
  });

  return { items: query.data ?? [], isLoading: query.isLoading, addItem, removeItem };
}