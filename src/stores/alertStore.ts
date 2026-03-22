import { create } from "zustand";
import type { Alert, AlertRule, AlertType } from "@/types/xrpl";

interface AlertStore {
  alerts: Alert[];
  rules: AlertRule[];
  unreadCount: number;
  isOpen: boolean;

  addAlert: (alert: Omit<Alert, "id" | "timestamp" | "read">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismissAlert: (id: string) => void;
  clearAll: () => void;
  setOpen: (v: boolean) => void;

  addRule: (rule: Omit<AlertRule, "id">) => void;
  toggleRule: (id: string) => void;
  removeRule: (id: string) => void;
}

export const useAlertStore = create<AlertStore>()((set, get) => ({
  alerts: [],
  rules: generateDefaultRules(),
  unreadCount: 0,
  isOpen: false,

  addAlert: (alert) => {
    const newAlert: Alert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      read: false,
    };
    set((s) => ({
      alerts: [newAlert, ...s.alerts].slice(0, 200),
      unreadCount: s.unreadCount + 1,
    }));
  },

  markRead: (id) =>
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)),
      unreadCount: Math.max(0, s.unreadCount - (s.alerts.find((a) => a.id === id && !a.read) ? 1 : 0)),
    })),

  markAllRead: () =>
    set((s) => ({
      alerts: s.alerts.map((a) => ({ ...a, read: true })),
      unreadCount: 0,
    })),

  dismissAlert: (id) =>
    set((s) => ({
      alerts: s.alerts.filter((a) => a.id !== id),
      unreadCount: Math.max(0, s.unreadCount - (s.alerts.find((a) => a.id === id && !a.read) ? 1 : 0)),
    })),

  clearAll: () => set({ alerts: [], unreadCount: 0 }),

  setOpen: (isOpen) => set({ isOpen }),

  addRule: (rule) =>
    set((s) => ({
      rules: [...s.rules, { ...rule, id: `rule-${Date.now()}` }],
    })),

  toggleRule: (id) =>
    set((s) => ({
      rules: s.rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    })),

  removeRule: (id) =>
    set((s) => ({
      rules: s.rules.filter((r) => r.id !== id),
    })),
}));

function generateDefaultRules(): AlertRule[] {
  return [
    { id: "rule-price-up", type: "price_above", enabled: true, label: "Price spike alerts" },
    { id: "rule-price-down", type: "price_below", enabled: true, label: "Price drop alerts" },
    { id: "rule-large-trade", type: "large_trade", enabled: true, label: "Whale trade alerts" },
    { id: "rule-liq", type: "liquidity_change", enabled: false, label: "Liquidity changes" },
    { id: "rule-wallet", type: "wallet_activity", enabled: false, label: "Wallet activity" },
    { id: "rule-exec", type: "execution_complete", enabled: true, label: "Trade execution" },
    { id: "rule-fail", type: "tx_failed", enabled: true, label: "Failed transactions" },
  ];
}
