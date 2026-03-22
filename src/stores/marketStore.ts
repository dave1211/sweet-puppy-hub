import { create } from "zustand";
import type {
  TradingPair,
  OrderBookSnapshot,
  RecentTrade,
  Candle,
  NetworkStatus,
} from "@/types/xrpl";

/* ── Default pair ── */
const DEFAULT_PAIR: TradingPair = {
  base: { currency: "XRP" },
  quote: { currency: "USD", issuer: "rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq" },
  label: "XRP/USD",
};

interface MarketStore {
  /* active pair */
  activePair: TradingPair;
  setActivePair: (pair: TradingPair) => void;

  /* price */
  lastPrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  setTicker: (data: {
    lastPrice: number;
    change24h: number;
    high24h: number;
    low24h: number;
    volume24h: number;
  }) => void;

  /* order book */
  orderBook: OrderBookSnapshot;
  setOrderBook: (ob: OrderBookSnapshot) => void;

  /* recent trades */
  recentTrades: RecentTrade[];
  addTrade: (trade: RecentTrade) => void;
  setTrades: (trades: RecentTrade[]) => void;

  /* candles */
  candles: Candle[];
  setCandles: (c: Candle[]) => void;

  /* network */
  network: NetworkStatus;
  setNetwork: (n: Partial<NetworkStatus>) => void;

  /* available pairs */
  availablePairs: TradingPair[];
  setAvailablePairs: (pairs: TradingPair[]) => void;
}

const emptyOrderBook: OrderBookSnapshot = {
  bids: [],
  asks: [],
  spread: 0,
  spreadPct: 0,
  lastUpdated: 0,
};

export const useMarketStore = create<MarketStore>()((set) => ({
  activePair: DEFAULT_PAIR,
  setActivePair: (pair) => set({ activePair: pair }),

  lastPrice: 0,
  change24h: 0,
  high24h: 0,
  low24h: 0,
  volume24h: 0,
  setTicker: (data) => set(data),

  orderBook: emptyOrderBook,
  setOrderBook: (ob) => set({ orderBook: ob }),

  recentTrades: [],
  addTrade: (trade) =>
    set((s) => ({ recentTrades: [trade, ...s.recentTrades].slice(0, 100) })),
  setTrades: (trades) => set({ recentTrades: trades }),

  candles: [],
  setCandles: (c) => set({ candles: c }),

  network: {
    connected: false,
    server: "wss://xrplcluster.com",
    ledgerIndex: 0,
    latency: 0,
  },
  setNetwork: (n) => set((s) => ({ network: { ...s.network, ...n } })),

  availablePairs: [
    DEFAULT_PAIR,
    {
      base: { currency: "XRP" },
      quote: { currency: "EUR", issuer: "rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq" },
      label: "XRP/EUR",
    },
    {
      base: { currency: "XRP" },
      quote: { currency: "BTC", issuer: "rchGBxcD1A1C2tdxF6papQYZ8kjRKMYcL" },
      label: "XRP/BTC",
    },
    {
      base: { currency: "CSC", issuer: "rCSCManTZ8ME9EoLrSHHYKW8PPwWMgkwr" },
      quote: { currency: "XRP" },
      label: "CSC/XRP",
    },
    {
      base: { currency: "SOLO", issuer: "rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz" },
      quote: { currency: "XRP" },
      label: "SOLO/XRP",
    },
  ],
  setAvailablePairs: (pairs) => set({ availablePairs: pairs }),
}));
