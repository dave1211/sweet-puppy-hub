import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { WalletProviderType, TokenBalance } from "@/types/xrpl";

interface WalletStore {
  isConnected: boolean;
  address: string | null;
  provider: WalletProviderType;
  xrpBalance: string;
  tokenBalances: TokenBalance[];
  isConnecting: boolean;
  error: string | null;

  connect: (provider: WalletProviderType) => void;
  setConnected: (address: string, provider: WalletProviderType) => void;
  disconnect: () => void;
  setXRPBalance: (drops: string) => void;
  setTokenBalances: (balances: TokenBalance[]) => void;
  setError: (error: string | null) => void;
  setConnecting: (v: boolean) => void;
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      isConnected: false,
      address: null,
      provider: null,
      xrpBalance: "0",
      tokenBalances: [],
      isConnecting: false,
      error: null,

      connect: (provider) => {
        set({ isConnecting: true, error: null, provider });
      },

      setConnected: (address, provider) => {
        set({
          isConnected: true,
          address,
          provider,
          isConnecting: false,
          error: null,
        });
      },

      disconnect: () => {
        set({
          isConnected: false,
          address: null,
          provider: null,
          xrpBalance: "0",
          tokenBalances: [],
          isConnecting: false,
          error: null,
        });
      },

      setXRPBalance: (drops) => set({ xrpBalance: drops }),
      setTokenBalances: (balances) => set({ tokenBalances: balances }),
      setError: (error) => set({ error, isConnecting: false }),
      setConnecting: (v) => set({ isConnecting: v }),
    }),
    {
      name: "tanner-wallet",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({
        isConnected: s.isConnected,
        address: s.address,
        provider: s.provider,
      }),
    }
  )
);
