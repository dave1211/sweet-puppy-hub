import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDeviceId } from "./useDeviceId";

export interface TrackedWallet {
  id: string;
  device_id: string;
  address: string;
  label: string | null;
  created_at: string;
  updated_at: string;
}

export function useTrackedWallets() {
  const deviceId = useDeviceId();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["tracked-wallets", deviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracked_wallets")
        .select("*")
        .eq("device_id", deviceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TrackedWallet[];
    },
  });

  const addWallet = useMutation({
    mutationFn: async (wallet: { address: string; label?: string }) => {
      const addr = wallet.address.trim();
      const { data: existing } = await supabase
        .from("tracked_wallets")
        .select("id")
        .eq("device_id", deviceId)
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
        .insert({ device_id: deviceId, address: addr, label: wallet.label || null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tracked-wallets", deviceId] }),
  });

  const removeWallet = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tracked_wallets").delete().eq("id", id).eq("device_id", deviceId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tracked-wallets", deviceId] }),
  });

  return { wallets: query.data ?? [], isLoading: query.isLoading, addWallet, removeWallet };
}