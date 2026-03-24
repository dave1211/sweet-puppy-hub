import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TrackedWallet {
  id: string;
  device_id: string;
  user_id: string;
  address: string;
  label: string | null;
  created_at: string;
  updated_at: string;
}

export function useTrackedWallets() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["tracked-wallets", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracked_wallets")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TrackedWallet[];
    },
    enabled: !!userId,
  });

  const addWallet = useMutation({
    mutationFn: async (wallet: { address: string; label?: string }) => {
      const addr = wallet.address.trim();
      const { data: existing } = await supabase
        .from("tracked_wallets")
        .select("id")
        .eq("user_id", userId!)
        .eq("address", addr)
        .maybeSingle();

      if (existing) {
        if (wallet.label) {
          await supabase.from("tracked_wallets").update({ label: wallet.label }).eq("id", existing.id);
        }
        return existing;
      }

      const { data, error } = await supabase
        .from("tracked_wallets")
        .insert({ user_id: userId!, device_id: userId!, address: addr, label: wallet.label || null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tracked-wallets", userId] }),
  });

  const removeWallet = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tracked_wallets").delete().eq("id", id).eq("user_id", userId!);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tracked-wallets", userId] }),
  });

  return { wallets: query.data ?? [], isLoading: query.isLoading, addWallet, removeWallet };
}
