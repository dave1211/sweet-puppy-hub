import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type WatchlistItem = Tables<"watchlist">;

function normalizeAddress(addr: string): string {
  return addr.trim();
}

export function useWatchlist() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["watchlist", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("watchlist")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as WatchlistItem[];
    },
    enabled: !!userId,
  });

  const addItem = useMutation({
    mutationFn: async (item: { address: string; label?: string }) => {
      const normalized = normalizeAddress(item.address);
      const { data: existing } = await supabase
        .from("watchlist")
        .select("id")
        .eq("user_id", userId!)
        .eq("address", normalized)
        .maybeSingle();

      if (existing) {
        if (item.label) {
          const { error } = await supabase
            .from("watchlist")
            .update({ label: item.label })
            .eq("id", existing.id)
            .eq("user_id", userId!);
          if (error) throw error;
        }
        return existing;
      }

      const { data, error } = await supabase
        .from("watchlist")
        .insert({
          user_id: userId!,
          device_id: userId!,
          address: normalized,
          label: item.label || null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["watchlist", userId] }),
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("watchlist")
        .delete()
        .eq("id", id)
        .eq("user_id", userId!);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["watchlist", userId] }),
  });

  return { items: query.data ?? [], isLoading: query.isLoading, addItem, removeItem };
}
