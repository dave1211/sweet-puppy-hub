/**
 * Wallet Classification Service
 * 
 * Classifies tracked wallets into categories based on observable on-chain behavior.
 * All classifications include a reason and supporting evidence — no fake labels.
 */

import type { WalletTransaction } from "@/hooks/useWalletActivity";

export type WalletCategory = "whale" | "deployer" | "early_buyer" | "high_frequency" | "unknown";

export interface WalletClassification {
  category: WalletCategory;
  reason: string;
  evidence: {
    totalTxCount: number;
    uniqueTokens: number;
    avgTxSize: number | null;
    largestTx: number | null;
    latestActivitySec: number;
    buyCount: number;
    sellCount: number;
    transferCount: number;
  };
  confidence: "high" | "medium" | "low";
}

export interface SmartMoneyEvent {
  id: string;
  walletAddress: string;
  walletLabel: string;
  walletCategory: WalletCategory;
  action: "buy" | "sell" | "transfer" | "add_liquidity" | "unknown";
  tokenAddress: string;
  tokenSymbol: string | null;
  size: number | null;
  timestamp: number;
  significant: boolean;
  reason: string | null;
}

/* ── Thresholds ── */
const WHALE_MIN_TX = 6;
const WHALE_MIN_AVG_SIZE = 5; // SOL
const DEPLOYER_TRANSFER_RATIO = 0.6;
const HIGH_FREQ_MIN_TX = 10;
const EARLY_BUYER_MAX_AGE_SEC = 600; // first 10 min
const SIGNIFICANT_SIZE_SOL = 2;

/* ── Classify a wallet from its transaction history ── */
export function classifyWalletFromTxs(
  address: string,
  label: string,
  txs: WalletTransaction[]
): WalletClassification {
  if (!txs || txs.length === 0) {
    return {
      category: "unknown",
      reason: "No transaction history available",
      evidence: { totalTxCount: 0, uniqueTokens: 0, avgTxSize: null, largestTx: null, latestActivitySec: 0, buyCount: 0, sellCount: 0, transferCount: 0 },
      confidence: "low",
    };
  }

  const tokens = new Set<string>();
  let buyCount = 0, sellCount = 0, transferCount = 0;
  let totalSize = 0, largestTx = 0, sizedCount = 0;
  let latestTime = 0;

  for (const tx of txs) {
    if (tx.tokenAddress) tokens.add(tx.tokenAddress);
    if (tx.type === "buy") buyCount++;
    else if (tx.type === "sell") sellCount++;
    else if (tx.type === "transfer") transferCount++;
    if (tx.amount != null && tx.amount > 0) {
      totalSize += tx.amount;
      sizedCount++;
      if (tx.amount > largestTx) largestTx = tx.amount;
    }
    if (tx.blockTime && tx.blockTime > latestTime) latestTime = tx.blockTime;
  }

  const avgSize = sizedCount > 0 ? totalSize / sizedCount : null;
  const evidence = {
    totalTxCount: txs.length,
    uniqueTokens: tokens.size,
    avgTxSize: avgSize,
    largestTx: largestTx > 0 ? largestTx : null,
    latestActivitySec: latestTime,
    buyCount,
    sellCount,
    transferCount,
  };

  // Deployer: mostly transfers, few buys/sells
  if (txs.length >= 3 && transferCount / txs.length >= DEPLOYER_TRANSFER_RATIO && tokens.size >= 2) {
    return {
      category: "deployer",
      reason: `${(transferCount / txs.length * 100).toFixed(0)}% transfers across ${tokens.size} tokens — deployer pattern`,
      evidence,
      confidence: "medium",
    };
  }

  // Whale: high avg size + many transactions
  if (avgSize != null && avgSize >= WHALE_MIN_AVG_SIZE && txs.length >= WHALE_MIN_TX) {
    return {
      category: "whale",
      reason: `Avg tx ${avgSize.toFixed(2)} SOL across ${txs.length} transactions — large capital movement`,
      evidence,
      confidence: "high",
    };
  }

  // Whale fallback: single very large tx
  if (largestTx >= 20) {
    return {
      category: "whale",
      reason: `Single tx of ${largestTx.toFixed(2)} SOL detected — whale-size position`,
      evidence,
      confidence: "medium",
    };
  }

  // High frequency trader
  if (txs.length >= HIGH_FREQ_MIN_TX && tokens.size >= 3) {
    return {
      category: "high_frequency",
      reason: `${txs.length} transactions across ${tokens.size} tokens — high-frequency trading pattern`,
      evidence,
      confidence: "medium",
    };
  }

  // Early buyer: bought very soon after token creation (heuristic — needs pair age context)
  // We detect this if a wallet's earliest tx is a buy and they have few total txs
  if (buyCount >= 1 && txs.length <= 4 && tokens.size <= 2) {
    return {
      category: "early_buyer",
      reason: `${buyCount} buy(s) on ${tokens.size} token(s) with limited history — early buyer pattern`,
      evidence,
      confidence: "low",
    };
  }

  return {
    category: "unknown",
    reason: `${txs.length} transactions — no clear pattern detected`,
    evidence,
    confidence: "low",
  };
}

/* ── Build smart money events from wallet activity ── */
export function buildSmartMoneyEvents(
  walletAddress: string,
  walletLabel: string,
  walletCategory: WalletCategory,
  txs: WalletTransaction[]
): SmartMoneyEvent[] {
  if (!txs) return [];

  return txs
    .filter((tx) => tx.tokenAddress)
    .map((tx) => {
      const size = tx.amount;
      const significant = size != null && size >= SIGNIFICANT_SIZE_SOL;
      return {
        id: `sme-${tx.signature}`,
        walletAddress,
        walletLabel,
        walletCategory,
        action: tx.type === "buy" ? "buy" as const : tx.type === "sell" ? "sell" as const : tx.type === "transfer" ? "transfer" as const : "unknown" as const,
        tokenAddress: tx.tokenAddress!,
        tokenSymbol: tx.tokenSymbol,
        size,
        timestamp: tx.blockTime ?? 0,
        significant,
        reason: significant ? `${size!.toFixed(2)} SOL ${tx.type} by ${walletCategory}` : null,
      };
    });
}

/* ── Category display helpers ── */
export const CATEGORY_LABELS: Record<WalletCategory, string> = {
  whale: "🐋 WHALE",
  deployer: "🔧 DEPLOYER",
  early_buyer: "⚡ EARLY BUYER",
  high_frequency: "⏩ HIGH-FREQ",
  unknown: "👤 UNKNOWN",
};

export const CATEGORY_COLORS: Record<WalletCategory, string> = {
  whale: "text-terminal-cyan",
  deployer: "text-terminal-amber",
  early_buyer: "text-terminal-green",
  high_frequency: "text-primary",
  unknown: "text-muted-foreground",
};
