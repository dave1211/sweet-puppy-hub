import { create } from "zustand";

type MainTab = "trade" | "portfolio" | "orders" | "alerts" | "nft";

interface UIStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (v: boolean) => void;

  activeTab: MainTab;
  setActiveTab: (t: MainTab) => void;

  chartTimeframe: string;
  setChartTimeframe: (tf: string) => void;

  showPairSearch: boolean;
  setShowPairSearch: (v: boolean) => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  activeTab: "trade",
  setActiveTab: (activeTab) => set({ activeTab }),

  chartTimeframe: "1H",
  setChartTimeframe: (chartTimeframe) => set({ chartTimeframe }),

  showPairSearch: false,
  setShowPairSearch: (showPairSearch) => set({ showPairSearch }),
}));
