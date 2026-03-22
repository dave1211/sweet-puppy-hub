/** ── XRPL domain types used across the app ── */

/* ── Currency / Asset ── */
export interface XRPLCurrency {
  currency: string;
  issuer?: string;
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
  label: string;
  isFavorite?: boolean;
}

/* ── Order book ── */
export interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
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
  status: "open" | "partially_filled" | "filled" | "cancelled";
}

/* ── Order history ── */
export interface HistoricalOrder extends OpenOrder {
  completedAt?: number;
  averageFillPrice?: number;
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
  xrpBalance: string;
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
  latency: number;
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

/* ── PnL ── */
export interface PnLEntry {
  currency: string;
  issuer?: string;
  costBasis: number;
  currentValue: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;
  pnlPct: number;
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
  price: string;
  amount: string;
  total: string;
  slippage: number;
}

/* ── AMM ── */
export interface AMMPool {
  id: string;
  asset1: XRPLCurrency;
  asset2: XRPLCurrency;
  asset1Balance: number;
  asset2Balance: number;
  lpTokenBalance: number;
  tradingFee: number; // basis points
  auctionSlot?: {
    account: string;
    discountedFee: number;
    expiration: number;
  };
  votingSlots?: Array<{
    account: string;
    tradingFee: number;
    voteWeight: number;
  }>;
}

export interface AMMQuote {
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
  effectivePrice: number;
  fee: number;
  route: "amm";
}

/* ── Smart Router ── */
export type RouteSource = "dex" | "amm" | "split";

export interface RouteQuote {
  source: RouteSource;
  inputAmount: number;
  outputAmount: number;
  effectivePrice: number;
  priceImpact: number;
  fee: number;
  slippage: number;
  isBest: boolean;
  splitPct?: { dex: number; amm: number }; // for split routes
  explanation: string;
}

/* ── Alerts ── */
export type AlertType =
  | "price_above"
  | "price_below"
  | "large_trade"
  | "liquidity_change"
  | "wallet_activity"
  | "execution_complete"
  | "tx_failed";

export type AlertSeverity = "info" | "warning" | "critical";

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  asset?: XRPLCurrency;
  metadata?: Record<string, unknown>;
}

export interface AlertRule {
  id: string;
  type: AlertType;
  enabled: boolean;
  asset?: XRPLCurrency;
  threshold?: number;
  label: string;
}

/* ── Trust Lines ── */
export interface TrustLine {
  currency: string;
  issuer: string;
  balance: string;
  limit: string;
  limitPeer: string;
  noRipple: boolean;
  freeze: boolean;
  authorized: boolean;
  qualityIn?: number;
  qualityOut?: number;
  issuerName?: string;
  riskLevel: "safe" | "caution" | "danger" | "unknown";
}

/* ── NFTs ── */
export interface XRPLNft {
  nftokenId: string;
  issuer: string;
  uri?: string;
  taxon: number;
  serial: number;
  flags: number;
  transferFee?: number;
  name?: string;
  description?: string;
  imageUrl?: string;
  collection?: string;
}

/* ── Risk ── */
export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface RiskAssessment {
  level: RiskLevel;
  warnings: RiskWarning[];
  score: number; // 0-100
}

export interface RiskWarning {
  type: "low_liquidity" | "high_slippage" | "suspicious_token" | "issuer_concentration" | "volatile_asset" | "no_trustline";
  message: string;
  severity: AlertSeverity;
}
