/**
 * Unified Signal Engine — types, dedup, rate-limiting, multi-chain health.
 * Separate from UI. Never imported at boot.
 */
import { create } from "zustand";
import type { ChainId } from "@/lib/multichain/types";

/* ─── Signal types ─── */
export type SignalCategory =
  | "price" | "volume" | "whale" | "watchlist"
  | "health" | "bridge" | "portfolio" | "compliance" | "system"
  | "wallet_activity" | "risk" | "launch" | "liquidity"
  | "authority" | "deployer";

export type SignalSeverity = "info" | "warning" | "critical";

export type SignalSource = "dashboard" | "multichain" | "compliance" | "bridge" | "system"
  | "watchlist" | "wallet_tracker" | "risk_engine" | "launch_scanner";

export interface TerminalSignal {
  id: string;
  category: SignalCategory;
  severity: SignalSeverity;
  source: SignalSource;
  title: string;
  message: string;
  detail?: string;
  chainId?: ChainId;
  asset?: string;
  address?: string;
  timestamp: number;
  read: boolean;
  dismissed: boolean;
  dedupeKey?: string;
}

/* ─── Store ─── */
interface SignalStore {
  signals: TerminalSignal[];
  unreadCount: number;

  emit: (signal: Omit<TerminalSignal, "id" | "timestamp" | "read" | "dismissed">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
}

const MAX_SIGNALS = 300;
const DEDUP_WINDOW_MS = 60_000; // 60s dedup window

export const useSignalStore = create<SignalStore>()((set, get) => ({
  signals: [],
  unreadCount: 0,

  emit: (input) => {
    const state = get();
    // Dedup check
    if (input.dedupeKey) {
      const cutoff = Date.now() - DEDUP_WINDOW_MS;
      const isDupe = state.signals.some(
        s => s.dedupeKey === input.dedupeKey && s.timestamp > cutoff && !s.dismissed
      );
      if (isDupe) return;
    }

    const signal: TerminalSignal = {
      ...input,
      id: `sig-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      read: false,
      dismissed: false,
    };

    set({
      signals: [signal, ...state.signals].slice(0, MAX_SIGNALS),
      unreadCount: state.unreadCount + 1,
    });
  },

  markRead: (id) =>
    set(s => ({
      signals: s.signals.map(sig => sig.id === id ? { ...sig, read: true } : sig),
      unreadCount: Math.max(0, s.unreadCount - (s.signals.find(sig => sig.id === id && !sig.read) ? 1 : 0)),
    })),

  markAllRead: () =>
    set(s => ({
      signals: s.signals.map(sig => ({ ...sig, read: true })),
      unreadCount: 0,
    })),

  dismiss: (id) =>
    set(s => ({
      signals: s.signals.map(sig => sig.id === id ? { ...sig, dismissed: true, read: true } : sig),
      unreadCount: Math.max(0, s.unreadCount - (s.signals.find(sig => sig.id === id && !sig.read) ? 1 : 0)),
    })),

  clearAll: () => set({ signals: [], unreadCount: 0 }),
}));

/* ─── Filter helpers ─── */
export function filterSignals(
  signals: TerminalSignal[],
  filters: {
    source?: SignalSource;
    category?: SignalCategory;
    severity?: SignalSeverity;
    chainId?: ChainId;
    showDismissed?: boolean;
  }
): TerminalSignal[] {
  return signals.filter(s => {
    if (!filters.showDismissed && s.dismissed) return false;
    if (filters.source && s.source !== filters.source) return false;
    if (filters.category && s.category !== filters.category) return false;
    if (filters.severity && s.severity !== filters.severity) return false;
    if (filters.chainId && s.chainId !== filters.chainId) return false;
    return true;
  });
}

/* ─── Severity counts helper ─── */
export function severityCounts(signals: TerminalSignal[]): Record<SignalSeverity, number> {
  const counts: Record<SignalSeverity, number> = { info: 0, warning: 0, critical: 0 };
  for (const s of signals) {
    if (!s.dismissed) counts[s.severity]++;
  }
  return counts;
}
