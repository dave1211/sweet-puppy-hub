import { create } from "zustand";
import type { AMMPool, RouteQuote } from "@/types/xrpl";

interface AMMStore {
  pools: AMMPool[];
  selectedPool: AMMPool | null;
  routeQuotes: RouteQuote[];
  bestRoute: RouteQuote | null;
  isLoadingPools: boolean;
  isLoadingQuote: boolean;

  setPools: (pools: AMMPool[]) => void;
  setSelectedPool: (pool: AMMPool | null) => void;
  setRouteQuotes: (quotes: RouteQuote[]) => void;
  setLoadingPools: (v: boolean) => void;
  setLoadingQuote: (v: boolean) => void;
}

export const useAMMStore = create<AMMStore>()((set) => ({
  pools: [],
  selectedPool: null,
  routeQuotes: [],
  bestRoute: null,
  isLoadingPools: false,
  isLoadingQuote: false,

  setPools: (pools) => set({ pools }),
  setSelectedPool: (selectedPool) => set({ selectedPool }),
  setRouteQuotes: (routeQuotes) => {
    const bestRoute = routeQuotes.find((q) => q.isBest) ?? routeQuotes[0] ?? null;
    set({ routeQuotes, bestRoute });
  },
  setLoadingPools: (isLoadingPools) => set({ isLoadingPools }),
  setLoadingQuote: (isLoadingQuote) => set({ isLoadingQuote }),
}));
