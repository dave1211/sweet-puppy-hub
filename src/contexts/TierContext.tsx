import { createContext, useContext, useState, ReactNode, useCallback } from "react";

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
  return {
    canUseSniper:         tier === "pro" || tier === "elite",
    canUseSmartMoney:     tier === "pro" || tier === "elite",
    canUseCopyTrading:    tier === "elite",
    canUseAutoSniper:     tier === "elite",
    canUseAdvancedSignals: tier === "pro" || tier === "elite",
    canUseLaunchPriority: tier === "elite",
  };
}

interface TierContextValue {
  tier: Tier;
  setTier: (t: Tier) => void;
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

  const requiredTier = useCallback(
    (gate: keyof TierGates) => GATE_REQUIRED_TIER[gate],
    []
  );

  return (
    <TierContext.Provider
      value={{
        tier,
        setTier,
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
