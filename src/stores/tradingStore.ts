import { create } from "zustand";
import type { OpenOrder, OrderSide, OrderType } from "@/types/xrpl";

interface TradingStore {
  /* form state */
  side: OrderSide;
  orderType: OrderType;
  price: string;
  amount: string;
  slippage: number;
  setSide: (s: OrderSide) => void;
  setOrderType: (t: OrderType) => void;
  setPrice: (p: string) => void;
  setAmount: (a: string) => void;
  setSlippage: (s: number) => void;

  /* confirm modal */
  showConfirm: boolean;
  setShowConfirm: (v: boolean) => void;

  /* open orders */
  openOrders: OpenOrder[];
  setOpenOrders: (o: OpenOrder[]) => void;
  removeOrder: (id: string) => void;

  /* submission */
  isSubmitting: boolean;
  setSubmitting: (v: boolean) => void;
  lastTxResult: string | null;
  setLastTxResult: (r: string | null) => void;
}

export const useTradingStore = create<TradingStore>()((set) => ({
  side: "buy",
  orderType: "limit",
  price: "",
  amount: "",
  slippage: 1,
  setSide: (side) => set({ side }),
  setOrderType: (orderType) => set({ orderType }),
  setPrice: (price) => set({ price }),
  setAmount: (amount) => set({ amount }),
  setSlippage: (slippage) => set({ slippage }),

  showConfirm: false,
  setShowConfirm: (showConfirm) => set({ showConfirm }),

  openOrders: [],
  setOpenOrders: (openOrders) => set({ openOrders }),
  removeOrder: (id) =>
    set((s) => ({ openOrders: s.openOrders.filter((o) => o.id !== id) })),

  isSubmitting: false,
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  lastTxResult: null,
  setLastTxResult: (lastTxResult) => set({ lastTxResult }),
}));
