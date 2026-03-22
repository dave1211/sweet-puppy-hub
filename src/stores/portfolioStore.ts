import { create } from "zustand";
import type { PortfolioAsset, WalletTransaction } from "@/types/xrpl";

interface PortfolioStore {
  totalValueXRP: number;
  totalValueUSD: number;
  assets: PortfolioAsset[];
  transactions: WalletTransaction[];
  isLoading: boolean;

  setPortfolio: (data: {
    totalValueXRP: number;
    totalValueUSD: number;
    assets: PortfolioAsset[];
  }) => void;
  setTransactions: (txs: WalletTransaction[]) => void;
  addTransaction: (tx: WalletTransaction) => void;
  setLoading: (v: boolean) => void;
}

export const usePortfolioStore = create<PortfolioStore>()((set) => ({
  totalValueXRP: 0,
  totalValueUSD: 0,
  assets: [],
  transactions: [],
  isLoading: false,

  setPortfolio: (data) => set(data),
  setTransactions: (transactions) => set({ transactions }),
  addTransaction: (tx) =>
    set((s) => ({ transactions: [tx, ...s.transactions].slice(0, 200) })),
  setLoading: (isLoading) => set({ isLoading }),
}));
