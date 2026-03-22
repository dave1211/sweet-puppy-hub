import { useState, useEffect, useCallback, useRef } from "react";

interface PriceTick {
  time: number;
  value: number;
}

/**
 * Polls the SOL price endpoint every `intervalMs` and accumulates ticks
 * for a live-updating chart. Falls back gracefully.
 */
export function useLivePriceTicks(intervalMs = 10_000, maxTicks = 120) {
  const [ticks, setTicks] = useState<PriceTick[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const fetchTick = useCallback(async () => {
    try {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/token-data?action=sol-price`,
        {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          signal: abortRef.current.signal,
        }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data?.price) {
        setTicks(prev => {
          const next = [...prev, { time: Date.now(), value: data.price }];
          return next.length > maxTicks ? next.slice(-maxTicks) : next;
        });
      }
    } catch {
      // swallow abort / network errors
    }
  }, [maxTicks]);

  useEffect(() => {
    fetchTick();
    const id = setInterval(fetchTick, intervalMs);
    return () => {
      clearInterval(id);
      abortRef.current?.abort();
    };
  }, [fetchTick, intervalMs]);

  return ticks;
}
