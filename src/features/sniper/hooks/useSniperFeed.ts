// Sniper Hook — Connects data pipeline to the store
import { useEffect, useMemo } from "react";
import { useNewLaunches, useTrendingSignals } from "@/hooks/useNewLaunches";
import { useSniperStore, getFilteredTokens } from "../stores/sniperStore";
import { processToken } from "../services/detectionService";

export function useSniperFeed() {
  const { data: newLaunches } = useNewLaunches();
  const { data: trending } = useTrendingSignals();
  const { tokens, setTokens, filters, sortField, isLive, selectedAddress, selectToken } = useSniperStore();

  // Merge and dedupe raw feeds, then process
  useEffect(() => {
    if (!isLive) return;
    const raw = [...(newLaunches ?? []), ...(trending ?? [])];
    const deduped = new Map(raw.map((t) => [t.address, t]));
    const processed = Array.from(deduped.values()).map(processToken);
    setTokens(processed);
  }, [newLaunches, trending, isLive, setTokens]);

  const filtered = useMemo(
    () => getFilteredTokens(tokens, filters, sortField),
    [tokens, filters, sortField]
  );

  const selectedToken = useMemo(
    () => tokens.find((t) => t.token.address === selectedAddress) ?? null,
    [tokens, selectedAddress]
  );

  return { tokens: filtered, allTokens: tokens, selectedToken, selectToken, isLive };
}
