import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export interface TokenSearchResult {
  address: string;
  symbol: string;
  name: string;
  price: number;
}

function useDebouncedValue(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useTokenSearch(query: string) {
  const debouncedQuery = useDebouncedValue(query.trim(), 400);

  return useQuery({
    queryKey: ["token-search", debouncedQuery],
    queryFn: async (): Promise<TokenSearchResult[]> => {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/token-data?action=token-search&q=${encodeURIComponent(debouncedQuery)}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
    gcTime: 60_000,
  });
}