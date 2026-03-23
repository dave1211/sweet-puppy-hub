// Sniper Store — Central state for the sniper feed and token management
import { create } from "zustand";
import type { SniperToken, SniperFilters, SortField } from "../types";

interface SniperState {
  tokens: SniperToken[];
  selectedAddress: string | null;
  filters: SniperFilters;
  sortField: SortField;
  isLive: boolean;
  lastRefresh: number;

  setTokens: (tokens: SniperToken[]) => void;
  updateToken: (address: string, partial: Partial<SniperToken>) => void;
  selectToken: (address: string | null) => void;
  setFilter: <K extends keyof SniperFilters>(key: K, value: SniperFilters[K]) => void;
  resetFilters: () => void;
  setSortField: (field: SortField) => void;
  toggleLive: () => void;
  hideToken: (address: string) => void;
  blockToken: (address: string) => void;
}

const DEFAULT_FILTERS: SniperFilters = {
  minLiquidity: 0,
  maxRiskScore: 100,
  minVolume: 0,
  maxAgeMinutes: 9999,
  minHolders: 0,
  smartMoneyOnly: false,
  verifiedOnly: false,
  watchlistOnly: false,
  hiddenTokens: new Set(),
  blockedTokens: new Set(),
};

export const useSniperStore = create<SniperState>((set) => ({
  tokens: [],
  selectedAddress: null,
  filters: { ...DEFAULT_FILTERS },
  sortField: "score",
  isLive: true,
  lastRefresh: 0,

  setTokens: (tokens) => set({ tokens, lastRefresh: Date.now() }),
  updateToken: (address, partial) => set((s) => ({
    tokens: s.tokens.map((t) => t.token.address === address ? { ...t, ...partial } : t),
  })),
  selectToken: (address) => set({ selectedAddress: address }),
  setFilter: (key, value) => set((s) => ({ filters: { ...s.filters, [key]: value } })),
  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),
  setSortField: (field) => set({ sortField: field }),
  toggleLive: () => set((s) => ({ isLive: !s.isLive })),
  hideToken: (address) => set((s) => {
    const next = new Set(s.filters.hiddenTokens);
    next.add(address);
    return { filters: { ...s.filters, hiddenTokens: next } };
  }),
  blockToken: (address) => set((s) => {
    const next = new Set(s.filters.blockedTokens);
    next.add(address);
    return { filters: { ...s.filters, blockedTokens: next } };
  }),
}));

// Selectors
export function getFilteredTokens(tokens: SniperToken[], filters: SniperFilters, sortField: SortField): SniperToken[] {
  const result = tokens.filter((t) => {
    if (filters.hiddenTokens.has(t.token.address)) return false;
    if (filters.blockedTokens.has(t.token.address)) return false;
    if (t.token.liquidity < filters.minLiquidity) return false;
    if (t.risk.total > filters.maxRiskScore) return false;
    if (t.token.volume24h < filters.minVolume) return false;
    if (t.token.holderCount < filters.minHolders) return false;
    if (filters.smartMoneyOnly && t.smartMoneyCount === 0) return false;
    if (filters.verifiedOnly && !t.token.metadata.hasCompleteMeta) return false;

    const ageMin = (Date.now() - t.token.pairCreatedAt) / 60_000;
    if (ageMin > filters.maxAgeMinutes) return false;

    return true;
  });

  const sortFns: Record<SortField, (a: SniperToken, b: SniperToken) => number> = {
    newest: (a, b) => b.token.pairCreatedAt - a.token.pairCreatedAt,
    score: (a, b) => b.score.total - a.score.total,
    liquidity: (a, b) => b.token.liquidity - a.token.liquidity,
    volume: (a, b) => b.token.volume24h - a.token.volume24h,
    buys: (a, b) => b.token.buyCount - a.token.buyCount,
    smartMoney: (a, b) => b.smartMoneyCount - a.smartMoneyCount,
    riskAsc: (a, b) => a.risk.total - b.risk.total,
    momentum: (a, b) => b.momentumDelta - a.momentumDelta,
  };

  result.sort(sortFns[sortField]);
  return result;
}
