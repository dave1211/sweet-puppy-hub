// Sniper Hook — Connects live data pipeline to the store
import { useEffect, useMemo, useRef } from "react";
import { useNewLaunches, useTrendingSignals } from "@/hooks/useNewLaunches";
import { useSniperStore, getFilteredTokens } from "../stores/sniperStore";
import { processToken, processTokensLive } from "../services/detectionService";

export function useSniperFeed() {
  const { data: newLaunches } = useNewLaunches();
  const { data: trending } = useTrendingSignals();
  const { tokens, setTokens, filters, sortField, isLive, selectedAddress, selectToken } = useSniperStore();
  const enrichingRef = useRef(false);

  // Merge and dedupe raw feeds, process with cached data immediately, then enrich live
  useEffect(() => {
    if (!isLive) return;
    const raw = [...(newLaunches ?? []), ...(trending ?? [])];
    if (raw.length === 0) return;

    const deduped = new Map(raw.map((t) => [t.address, t]));
    const rawList = Array.from(deduped.values());

    // Immediate render with cached/basic data
    const immediate = rawList.map(processToken);
    setTokens(immediate);

    // Then fetch live enrichment in background
    if (!enrichingRef.current) {
      enrichingRef.current = true;
      processTokensLive(rawList)
        .then((enriched) => {
          if (enriched.length > 0) {
            setTokens(enriched);
          }
        })
        .finally(() => {
          enrichingRef.current = false;
        });
    }
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
