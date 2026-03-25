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

  useEffect(() => {
    let active = true;

    const resolveTier = async () => {
      if (!user?.id) {
        if (active) setTier("free");
        return;
      }

      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("tier")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subscription?.tier === "pro" || subscription?.tier === "elite") {
        if (active) setTier(subscription.tier);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("tier")
        .eq("id", user.id)
        .maybeSingle();

      const profileTier = profile?.tier;
      if (profileTier === "pro" || profileTier === "elite") {
        if (active) setTier(profileTier);
        return;
      }

      if (active) setTier("free");
    };

    void resolveTier();

    return () => {
      active = false;
    };
  }, [user?.id]);

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
