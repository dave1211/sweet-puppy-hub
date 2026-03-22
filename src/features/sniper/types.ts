// Sniper Core Types — Tanner Terminal
// Central type definitions for the Solana sniper engine

// ── Token State Machine ──
export type SniperState = "IGNORE" | "WATCH" | "HOT" | "SNIPE_READY" | "BLOCKED";

export type RiskBand = "LOW" | "MODERATE" | "HIGH" | "EXTREME";
export type ScoreBand = "WEAK" | "DEVELOPING" | "PROMISING" | "STRONG" | "ELITE";
export type WalletTag = "smart_money" | "whale" | "deployer" | "insider_suspect" | "exit_wallet" | "unknown";

// ── Detected Token ──
export interface DetectedToken {
  address: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  liquidity: number;
  pairCreatedAt: number;
  dexId: string;
  url: string;
  // enriched fields
  holderCount: number;
  txCount: number;
  buyCount: number;
  sellCount: number;
  topHolderPct: number;
  lpLocked: boolean | null;
  deployerAddress: string | null;
  metadata: TokenMetadata;
  detectedAt: number;
}

export interface TokenMetadata {
  website: string | null;
  twitter: string | null;
  telegram: string | null;
  description: string | null;
  imageUrl: string | null;
  hasCompleteMeta: boolean;
}

// ── Scoring ──
export interface ScoreBreakdown {
  liquidity: number;     // 0–20
  momentum: number;      // 0–20
  holderQuality: number; // 0–20
  smartMoney: number;    // 0–20
  safety: number;        // 0–15
  socialMeta: number;    // 0–5
  total: number;         // 0–100
  band: ScoreBand;
  confidence: number;    // 0–100
  tags: string[];
}

// ── Risk ──
export interface RiskFlag {
  id: string;
  category: RiskCategory;
  label: string;
  detail: string;
  severity: "warning" | "danger" | "critical";
  weight: number;
}

export type RiskCategory =
  | "liquidity"
  | "holder_concentration"
  | "deployer"
  | "trade_pattern"
  | "token_structure"
  | "behavioral";

export interface RiskBreakdown {
  liquidity: number;           // 0–20
  holderConcentration: number; // 0–20
  deployer: number;            // 0–20
  tradePattern: number;        // 0–15
  tokenStructure: number;      // 0–10
  behavioral: number;          // 0–15
  total: number;               // 0–100
  band: RiskBand;
  flags: RiskFlag[];
  blockRecommended: boolean;
}

// ── Smart Money ──
export interface TaggedWallet {
  address: string;
  tag: WalletTag;
  label: string;
  winRate: number;
  avgHoldMinutes: number;
  totalTrades: number;
  pnl: number;
}

export interface SmartMoneyEntry {
  walletAddress: string;
  walletTag: WalletTag;
  walletLabel: string;
  tokenAddress: string;
  action: "buy" | "sell";
  amount: number;
  timestamp: number;
}

// ── Enriched Sniper Token ──
export interface SniperToken {
  token: DetectedToken;
  score: ScoreBreakdown;
  risk: RiskBreakdown;
  state: SniperState;
  smartMoneyEntries: SmartMoneyEntry[];
  whaleCount: number;
  smartMoneyCount: number;
  momentumDelta: number; // positive = accelerating
  updatedAt: number;
}

// ── Execution ──
export interface ExecutionConfig {
  amountSOL: number;
  slippageBps: number;
  priorityFeeLamports: number;
  maxPositionSOL: number;
  wallet: string | null;
  fastMode: boolean;
}

export interface ExecutionPreview {
  token: SniperToken;
  config: ExecutionConfig;
  estimatedOutput: number;
  estimatedOutputSymbol: string;
  priceImpact: number;
  route: string[];
  warningCount: number;
}

// ── Filters ──
export interface SniperFilters {
  minLiquidity: number;
  maxRiskScore: number;
  minVolume: number;
  maxAgeMinutes: number;
  minHolders: number;
  smartMoneyOnly: boolean;
  verifiedOnly: boolean;
  watchlistOnly: boolean;
  hiddenTokens: Set<string>;
  blockedTokens: Set<string>;
}

export type SortField =
  | "newest"
  | "score"
  | "liquidity"
  | "volume"
  | "buys"
  | "smartMoney"
  | "riskAsc"
  | "momentum";

// ── Helpers ──
export function getScoreBand(score: number): ScoreBand {
  if (score >= 90) return "ELITE";
  if (score >= 75) return "STRONG";
  if (score >= 60) return "PROMISING";
  if (score >= 40) return "DEVELOPING";
  return "WEAK";
}

export function getRiskBand(risk: number): RiskBand {
  if (risk >= 75) return "EXTREME";
  if (risk >= 50) return "HIGH";
  if (risk >= 25) return "MODERATE";
  return "LOW";
}

export function getSniperState(score: ScoreBreakdown, risk: RiskBreakdown): SniperState {
  if (risk.blockRecommended || risk.band === "EXTREME") return "BLOCKED";
  if (score.band === "ELITE" || score.band === "STRONG") {
    if (risk.band === "LOW" || risk.band === "MODERATE") return "SNIPE_READY";
    return "HOT";
  }
  if (score.band === "PROMISING") return "HOT";
  if (score.band === "DEVELOPING") return "WATCH";
  return "IGNORE";
}

export const SCORE_COLORS: Record<ScoreBand, string> = {
  WEAK: "text-muted-foreground",
  DEVELOPING: "text-terminal-amber",
  PROMISING: "text-terminal-cyan",
  STRONG: "text-terminal-green",
  ELITE: "text-primary",
};

export const RISK_COLORS: Record<RiskBand, string> = {
  LOW: "text-terminal-green",
  MODERATE: "text-terminal-amber",
  HIGH: "text-terminal-red",
  EXTREME: "text-terminal-red",
};

export const STATE_COLORS: Record<SniperState, string> = {
  IGNORE: "bg-muted/30 text-muted-foreground border-border",
  WATCH: "bg-terminal-amber/10 text-terminal-amber border-terminal-amber/30",
  HOT: "bg-terminal-cyan/10 text-terminal-cyan border-terminal-cyan/30",
  SNIPE_READY: "bg-terminal-green/10 text-terminal-green border-terminal-green/30",
  BLOCKED: "bg-terminal-red/10 text-terminal-red border-terminal-red/30",
};
