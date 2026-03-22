import { useMemo, useRef } from "react";
import { useUnifiedSignals } from "./useUnifiedSignals";
import { useSmartMoneyMap } from "./useSmartMoneyMap";
import { useWhaleProfiles } from "./useWhaleProfiles";
import { SniperConfig, SniperPreview, evaluateToken } from "@/lib/sniperEngine";

export function useAutoSniper(config: SniperConfig) {
  const { tokens, isLoading } = useUnifiedSignals();
  const { map: smartMoneyMap } = useSmartMoneyMap();
  const { tokenWhaleCount } = useWhaleProfiles();
  const cooldowns = useRef<Record<string, number>>({});

  const previews = useMemo(() => {
    if (!tokens.length) return [];
    const results: SniperPreview[] = [];
    for (const token of tokens) {
      const lastSeen = smartMoneyMap[token.address]?.lastSeen ?? 0;
      const whaleCount = tokenWhaleCount[token.address] ?? 0;
      const preview = evaluateToken(token, config, whaleCount, lastSeen, cooldowns.current);
      results.push(preview);
    }
    results.sort((a, b) => { if (a.status !== b.status) return a.status === "READY" ? -1 : 1; return b.token.score - a.token.score; });
    return results;
  }, [tokens, smartMoneyMap, tokenWhaleCount, config]);

  return { previews, readyCount: previews.filter((p) => p.status === "READY").length, blockedCount: previews.filter((p) => p.status === "BLOCKED").length, isLoading };
}