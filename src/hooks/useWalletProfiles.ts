import { useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWalletProfileStore, type WalletProfile, type WalletRole } from "@/stores/walletProfileStore";
import { toast } from "sonner";

function mapRow(row: Record<string, unknown>): WalletProfile {
  return {
    id: row.id as string,
    address: row.address as string,
    chain: (row.chain as string) ?? "solana",
    label: row.label as string | null,
    role: (row.role as WalletRole) ?? "unknown",
    isPrimary: Boolean(row.is_primary),
    isWatchOnly: Boolean(row.is_watch_only),
  };
}

export function useWalletProfiles() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { setProfiles, profiles } = useWalletProfileStore();

  const query = useQuery({
    queryKey: ["wallet-profiles", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallet_profiles")
        .select("*")
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (query.data) setProfiles(query.data);
  }, [query.data, setProfiles]);

  const addWallet = useMutation({
    mutationFn: async (input: { address: string; chain?: string; label?: string; role?: WalletRole; isPrimary?: boolean; isWatchOnly?: boolean }) => {
      const { error } = await supabase.from("wallet_profiles").insert({
        user_id: user!.id,
        address: input.address,
        chain: input.chain ?? "solana",
        label: input.label ?? null,
        role: input.role ?? "unknown",
        is_primary: input.isPrimary ?? false,
        is_watch_only: input.isWatchOnly ?? false,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["wallet-profiles"] }); toast.success("Wallet added"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateWallet = useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; label?: string; role?: WalletRole; isPrimary?: boolean; isWatchOnly?: boolean }) => {
      const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (patch.label !== undefined) update.label = patch.label;
      if (patch.role !== undefined) update.role = patch.role;
      if (patch.isPrimary !== undefined) update.is_primary = patch.isPrimary;
      if (patch.isWatchOnly !== undefined) update.is_watch_only = patch.isWatchOnly;
      const { error } = await supabase.from("wallet_profiles").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["wallet-profiles"] }); toast.success("Wallet updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeWallet = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wallet_profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["wallet-profiles"] }); toast.success("Wallet removed"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const ensureConnectedWallet = useCallback(
    async (address: string) => {
      if (!user) return;
      const exists = profiles.some(p => p.address === address);
      if (!exists) {
        await addWallet.mutateAsync({ address, isPrimary: profiles.length === 0 });
      }
    },
    [user, profiles, addWallet]
  );

  return {
    profiles: query.data ?? [],
    isLoading: query.isLoading,
    addWallet: addWallet.mutate,
    updateWallet: updateWallet.mutate,
    removeWallet: removeWallet.mutate,
    ensureConnectedWallet,
  };
}
