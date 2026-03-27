import { create } from "zustand";

export type WalletRole = "trading" | "treasury" | "watch_only" | "experimental" | "unknown";

export interface WalletProfile {
  id: string;
  address: string;
  chain: string;
  label: string | null;
  role: WalletRole;
  isPrimary: boolean;
  isWatchOnly: boolean;
  /** Locally computed, not persisted */
  balanceUSD?: number;
  solBalance?: number;
  tokenCount?: number;
  riskLevel?: string;
  alertCount?: number;
}

interface WalletProfileStore {
  profiles: WalletProfile[];
  setProfiles: (p: WalletProfile[]) => void;
  addProfile: (p: WalletProfile) => void;
  updateProfile: (id: string, patch: Partial<WalletProfile>) => void;
  removeProfile: (id: string) => void;
  getByAddress: (address: string) => WalletProfile | undefined;
  getPrimary: () => WalletProfile | undefined;
}

export const useWalletProfileStore = create<WalletProfileStore>((set, get) => ({
  profiles: [],
  setProfiles: (profiles) => set({ profiles }),
  addProfile: (p) => set((s) => ({ profiles: [...s.profiles, p] })),
  updateProfile: (id, patch) => set((s) => ({
    profiles: s.profiles.map(p => p.id === id ? { ...p, ...patch } : p),
  })),
  removeProfile: (id) => set((s) => ({
    profiles: s.profiles.filter(p => p.id !== id),
  })),
  getByAddress: (address) => get().profiles.find(p => p.address === address),
  getPrimary: () => get().profiles.find(p => p.isPrimary),
}));
