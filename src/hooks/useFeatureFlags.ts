/**
 * Feature flag + kill switch hook.
 * Loads flags from Supabase, caches in memory, supports realtime updates.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  min_tier: string | null;
  metadata: Record<string, unknown>;
}

const TIER_ORDER: Record<string, number> = {
  free: 0,
  pro: 1,
  elite: 2,
  vip: 3,
  admin: 10,
  owner: 99,
};

let cachedFlags: FeatureFlag[] | null = null;

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>(cachedFlags ?? []);
  const [loading, setLoading] = useState(!cachedFlags);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data } = await supabase
        .from("feature_flags")
        .select("key, enabled, min_tier, metadata");

      if (!cancelled && data) {
        const parsed = data.map((f) => ({
          key: f.key,
          enabled: f.enabled,
          min_tier: f.min_tier,
          metadata: (f.metadata ?? {}) as Record<string, unknown>,
        }));
        cachedFlags = parsed;
        setFlags(parsed);
      }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { flags, loading };
}

/**
 * Check if a feature is enabled for a given user tier.
 * Returns false if flag doesn't exist (fail closed).
 */
export function isFeatureEnabled(
  flags: FeatureFlag[],
  key: string,
  userTier = "free"
): boolean {
  const flag = flags.find((f) => f.key === key);
  if (!flag) return false; // fail closed
  if (!flag.enabled) return false;

  const requiredLevel = TIER_ORDER[flag.min_tier ?? "free"] ?? 0;
  const userLevel = TIER_ORDER[userTier] ?? 0;
  return userLevel >= requiredLevel;
}

/**
 * Convenience hook: returns a checker function bound to current user tier.
 */
export function useFeatureGate() {
  const { flags, loading } = useFeatureFlags();
  const { user } = useAuth();
  // We don't have tier on auth context directly, default to free
  const userTier = "free"; // TODO: read from profile/subscription

  const isEnabled = (key: string) => isFeatureEnabled(flags, key, userTier);
  const isKillSwitchActive = (key: string) => {
    const flag = flags.find((f) => f.key === key);
    return flag ? !flag.enabled && flag.metadata?.kill_switch === true : false;
  };

  return { isEnabled, isKillSwitchActive, loading, flags };
}
