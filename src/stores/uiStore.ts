import { create } from "zustand";

interface UIStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (v: boolean) => void;

  activeTab: "trade" | "portfolio" | "orders";
  setActiveTab: (t: "trade" | "portfolio" | "orders") => void;

  chartTimeframe: string;
  setChartTimeframe: (tf: string) => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  activeTab: "trade",
  setActiveTab: (activeTab) => set({ activeTab }),

  chartTimeframe: "1H",
  setChartTimeframe: (chartTimeframe) => set({ chartTimeframe }),
}));
