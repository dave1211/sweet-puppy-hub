// Auto Sniper Store — automated sniping based on thresholds
import { create } from "zustand";

export interface AutoSnipeConfig {
  enabled: boolean;
  minScore: number;
  maxRisk: number;
  amountSOL: number;
  maxConcurrent: number;
  cooldownMs: number;
  statesAllowed: string[];
}

export interface SnipeRecord {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  entryPrice: number;
  entryTime: number;
  amountSOL: number;
  score: number;
  risk: number;
  state: string;
  // exit
  exitPrice: number | null;
  exitTime: number | null;
  pnlPercent: number | null;
  status: "active" | "profit" | "loss" | "manual_exit";
}

interface AutoSniperState {
  config: AutoSnipeConfig;
  records: SnipeRecord[];
  cooldowns: Record<string, number>;

  setConfig: (partial: Partial<AutoSnipeConfig>) => void;
  toggleEnabled: () => void;
  addRecord: (record: SnipeRecord) => void;
  updateRecord: (id: string, partial: Partial<SnipeRecord>) => void;
  clearHistory: () => void;
  isOnCooldown: (address: string) => boolean;
  setCooldown: (address: string) => void;
}

const DEFAULT_CONFIG: AutoSnipeConfig = {
  enabled: false,
  minScore: 70,
  maxRisk: 40,
  amountSOL: 0.1,
  maxConcurrent: 3,
  cooldownMs: 300_000, // 5 min
  statesAllowed: ["SNIPE_READY", "HOT"],
};

export const useAutoSniperStore = create<AutoSniperState>((set, get) => ({
  config: { ...DEFAULT_CONFIG },
  records: [],
  cooldowns: {},

  setConfig: (partial) => set((s) => ({ config: { ...s.config, ...partial } })),
  toggleEnabled: () => set((s) => ({ config: { ...s.config, enabled: !s.config.enabled } })),

  addRecord: (record) => set((s) => ({ records: [record, ...s.records] })),

  updateRecord: (id, partial) =>
    set((s) => ({
      records: s.records.map((r) => (r.id === id ? { ...r, ...partial } : r)),
    })),

  clearHistory: () =>
    set((s) => ({
      records: s.records.filter((r) => r.status === "active"),
    })),

  isOnCooldown: (address) => {
    const ts = get().cooldowns[address];
    if (!ts) return false;
    return Date.now() - ts < get().config.cooldownMs;
  },

  setCooldown: (address) =>
    set((s) => ({ cooldowns: { ...s.cooldowns, [address]: Date.now() } })),
}));

// Selectors
export function getStats(records: SnipeRecord[]) {
  const closed = records.filter((r) => r.status !== "active");
  const wins = closed.filter((r) => r.status === "profit");
  const losses = closed.filter((r) => r.status === "loss");
  const totalPnl = closed.reduce((sum, r) => sum + (r.pnlPercent ?? 0), 0);
  const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
  const active = records.filter((r) => r.status === "active");

  return { total: closed.length, wins: wins.length, losses: losses.length, totalPnl, winRate, activeCount: active.length };
}
