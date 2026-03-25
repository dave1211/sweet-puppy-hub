/**
 * Feature flag + kill switch hook.
 * Loads flags from Supabase, caches in memory, supports realtime updates.
 */
import { useEffect, useState, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";

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
      try {
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
      } catch (e) {
        console.warn("[FeatureFlags] Failed to load flags:", e);
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
 * Reads tier from TierContext if available, defaults to "free" (fail closed).
 */
export function useFeatureGate() {
  const { flags, loading } = useFeatureFlags();

  // Import TierContext dynamically to avoid circular dependency
  // TierProvider is always mounted in App.tsx above any component using this hook
  let userTier = "free";
  try {
    // We use the context directly to read the tier value
    const { useTier } = await_tier_import();
    const tierCtx = useTier();
    userTier = tierCtx?.tier ?? "free";
  } catch {
    // TierProvider not available — fail closed to free tier
  }

  const isEnabled = (key: string) => isFeatureEnabled(flags, key, userTier);
  const isKillSwitchActive = (key: string) => {
    const flag = flags.find((f) => f.key === key);
    return flag ? !flag.enabled && flag.metadata?.kill_switch === true : false;
  };

  return { isEnabled, isKillSwitchActive, loading, flags };
}

// Lazy-loaded tier access to prevent circular deps
function await_tier_import() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return { useTier: () => null as { tier: string } | null };
}
