/** ── XRPL domain types used across the app ── */

/* ── Currency / Asset ── */
export interface XRPLCurrency {
  currency: string;
  issuer?: string; // absent for native XRP
}

export interface XRPLAmount {
  currency: string;
  issuer?: string;
  value: string;
}

export type DropsOrToken = string | XRPLAmount;

/* ── Trading pair ── */
export interface TradingPair {
  base: XRPLCurrency;
  quote: XRPLCurrency;
  label: string; // e.g. "XRP/USD"
}

/* ── Order book ── */
export interface OrderBookEntry {
  price: number;
  size: number;
  total: number; // cumulative
  numOrders: number;
}

export interface OrderBookSnapshot {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread: number;
  spreadPct: number;
  lastUpdated: number;
}

/* ── Recent trade ── */
export interface RecentTrade {
  id: string;
  price: number;
  size: number;
  side: "buy" | "sell";
  timestamp: number;
  txHash: string;
}

/* ── Open order ── */
export interface OpenOrder {
  id: string;
  sequence: number;
  side: "buy" | "sell";
  type: "limit";
  price: number;
  size: number;
  filled: number;
  pair: TradingPair;
  createdAt: number;
  expiresAt?: number;
  txHash: string;
}

/* ── Wallet ── */
export type WalletProviderType = "xaman" | "crossmark" | "ledger" | null;

export interface TokenBalance {
  currency: string;
  issuer: string;
  value: string;
  limit?: string;
  issuerName?: string;
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  provider: WalletProviderType;
  xrpBalance: string; // in drops
  tokenBalances: TokenBalance[];
  isConnecting: boolean;
  error: string | null;
}

/* ── Transaction ── */
export interface WalletTransaction {
  hash: string;
  type: string;
  timestamp: number;
  fee: string;
  result: string;
  details: Record<string, unknown>;
}

/* ── Network ── */
export interface NetworkStatus {
  connected: boolean;
  server: string;
  ledgerIndex: number;
  latency: number; // ms
  networkId?: number;
}

/* ── Portfolio ── */
export interface PortfolioAsset {
  currency: string;
  issuer?: string;
  balance: number;
  valueXRP: number;
  valueUSD: number;
  pctOfTotal: number;
  change24h?: number;
}

/* ── Candle / OHLCV ── */
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/* ── Trade form ── */
export type OrderSide = "buy" | "sell";
export type OrderType = "market" | "limit";

export interface TradeFormValues {
  side: OrderSide;
  type: OrderType;
  price: string; // only for limit
  amount: string;
  total: string;
  slippage: number;
}
