import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Tier = "free" | "pro" | "elite";

export interface TierLimits {
  maxWallets: number;
  maxAlerts: number;
  maxHistory: number;
}

const TIER_LIMITS: Record<Tier, TierLimits> = {
  free:  { maxWallets: 1, maxAlerts: 3,  maxHistory: 10 },
  pro:   { maxWallets: 5, maxAlerts: 20, maxHistory: 100 },
  elite: { maxWallets: Infinity, maxAlerts: Infinity, maxHistory: Infinity },
};

export interface TierGates {
  canUseSniper: boolean;
  canUseSmartMoney: boolean;
  canUseCopyTrading: boolean;
  canUseAutoSniper: boolean;
  canUseAdvancedSignals: boolean;
  canUseLaunchPriority: boolean;
}

function getGates(tier: Tier): TierGates {
  // TODO: enforce tier server-side in edge functions before monetization
  const isPro = tier === "pro" || tier === "elite";
  const isElite = tier === "elite";
  return {
    canUseSniper: isPro,
    canUseSmartMoney: isPro,
    canUseCopyTrading: isElite,
    canUseAutoSniper: isElite,
    canUseAdvancedSignals: isPro,
    canUseLaunchPriority: isElite,
  };
}

interface TierContextValue {
  tier: Tier;
  gates: TierGates;
  limits: TierLimits;
  tierLabel: string;
  requiredTier: (gate: keyof TierGates) => Tier;
}

const GATE_REQUIRED_TIER: Record<keyof TierGates, Tier> = {
  canUseSniper: "pro",
  canUseSmartMoney: "pro",
  canUseCopyTrading: "elite",
  canUseAutoSniper: "elite",
  canUseAdvancedSignals: "pro",
  canUseLaunchPriority: "elite",
};

const TIER_LABELS: Record<Tier, string> = {
  free: "FREE",
  pro: "PRO",
  elite: "ELITE",
};

const TierContext = createContext<TierContextValue | null>(null);

export function TierProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<Tier>("free");
  const { user } = useAuth();

  const resolveTierForUser = useCallback(async (userId: string): Promise<Tier> => {
    try {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("tier")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subscription?.tier === "pro" || subscription?.tier === "elite") {
        return subscription.tier;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("tier")
        .eq("id", userId)
        .maybeSingle();

      if (profile?.tier === "pro" || profile?.tier === "elite") {
        return profile.tier;
      }

      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });

      if (isAdmin) return "elite";
    } catch {
      return "free";
    }

    return "free";
  }, []);

  useEffect(() => {
    let active = true;

    const applyTier = async () => {
      if (!user?.id) {
        if (active) setTier("free");
        return;
      }

      const resolvedTier = await resolveTierForUser(user.id);
      if (active) setTier(resolvedTier);
    };

    const onFocus = () => {
      void applyTier();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void applyTier();
      }
    };

    void applyTier();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    const interval = window.setInterval(onFocus, 30_000);

    return () => {
      active = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(interval);
    };
  }, [user?.id, resolveTierForUser]);

  const requiredTier = useCallback(
    (gate: keyof TierGates) => GATE_REQUIRED_TIER[gate],
    []
  );

  return (
    <TierContext.Provider
      value={{
        tier,
        gates: getGates(tier),
        limits: TIER_LIMITS[tier],
        tierLabel: TIER_LABELS[tier],
        requiredTier,
      }}
    >
      {children}
    </TierContext.Provider>
  );
}

export function useTier() {
  const ctx = useContext(TierContext);
  if (!ctx) throw new Error("useTier must be inside TierProvider");
  return ctx;
}
