import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ReferralInvite {
  id: string;
  inviter_id: string;
  invite_code: string;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
  tier: string;
}

const MAX_INVITES = 5;

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "TT-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function useReferralInvites() {
  const { user } = useAuth();
  const userId = user?.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["referral-invites", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_invites")
        .select("*")
        .eq("inviter_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ReferralInvite[];
    },
    enabled: !!userId,
  });

  const createInvite = useMutation({
    mutationFn: async () => {
      const existing = query.data ?? [];
      if (existing.length >= MAX_INVITES) throw new Error(`Max ${MAX_INVITES} invites allowed`);
      const { data, error } = await supabase
        .from("referral_invites")
        .insert({ inviter_id: userId!, invite_code: generateCode() })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["referral-invites", userId] }),
  });

  const invites = query.data ?? [];
  const used = invites.filter((i) => i.used_by).length;
  const available = invites.filter((i) => !i.used_by);

  return { invites, used, available, remaining: MAX_INVITES - invites.length, createInvite, isLoading: query.isLoading };
}
