// Execution Store — Sniper buy/sell state
import { create } from "zustand";
import type { ExecutionConfig } from "../types";

interface ExecutionState {
  config: ExecutionConfig;
  isConfirmOpen: boolean;
  isFastMode: boolean;

  setAmount: (amt: number) => void;
  setSlippage: (bps: number) => void;
  setPriorityFee: (lamports: number) => void;
  setMaxPosition: (sol: number) => void;
  setWallet: (addr: string | null) => void;
  toggleFastMode: () => void;
  openConfirm: () => void;
  closeConfirm: () => void;
  reset: () => void;
}

const DEFAULT_CONFIG: ExecutionConfig = {
  amountSOL: 0.1,
  slippageBps: 100,
  priorityFeeLamports: 10_000,
  maxPositionSOL: 1.0,
  wallet: null,
  fastMode: false,
};

export const useExecutionStore = create<ExecutionState>((set) => ({
  config: { ...DEFAULT_CONFIG },
  isConfirmOpen: false,
  isFastMode: false,

  setAmount: (amountSOL) => set((s) => ({ config: { ...s.config, amountSOL } })),
  setSlippage: (slippageBps) => set((s) => ({ config: { ...s.config, slippageBps } })),
  setPriorityFee: (priorityFeeLamports) => set((s) => ({ config: { ...s.config, priorityFeeLamports } })),
  setMaxPosition: (maxPositionSOL) => set((s) => ({ config: { ...s.config, maxPositionSOL } })),
  setWallet: (wallet) => set((s) => ({ config: { ...s.config, wallet } })),
  toggleFastMode: () => set((s) => ({ isFastMode: !s.isFastMode, config: { ...s.config, fastMode: !s.config.fastMode } })),
  openConfirm: () => set({ isConfirmOpen: true }),
  closeConfirm: () => set({ isConfirmOpen: false }),
  reset: () => set({ config: { ...DEFAULT_CONFIG }, isConfirmOpen: false }),
}));
